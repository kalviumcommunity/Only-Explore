// src/lib/rag.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchTravelDocs } from './embeddings.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface RAGConfig {
  query: string;
  maxRetrievedDocs?: number;
  similarityThreshold?: number;
  includeCitations?: boolean;
  responseFormat?: 'detailed' | 'concise' | 'structured';
  contextWindow?: number;
}

export interface RAGResult {
  query: string;
  retrievedDocuments: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
    metadata?: any;
  }>;
  augmentedResponse: string;
  citations: string[];
  retrievalStats: {
    documentsRetrieved: number;
    averageSimilarity: number;
    contextLength: number;
  };
  method: string;
}

// RAG prompt templates for different response types
const ragPrompts = {
  detailed: (query: string, context: string) => `
You are Only Explore, an expert travel assistant with access to comprehensive travel knowledge.

CONTEXT FROM TRAVEL DATABASE:
${context}

USER QUERY: ${query}

INSTRUCTIONS:
- Use the provided context to give accurate, detailed travel recommendations
- Cite specific information from the context when making recommendations
- If the context doesn't contain relevant information, acknowledge this and provide general advice
- Include practical details, tips, and actionable recommendations
- Format citations as [Source: Document Title] when referencing specific information

Please provide a comprehensive response based on the available context and your travel expertise.
`,

  concise: (query: string, context: string) => `
TRAVEL CONTEXT:
${context}

QUERY: ${query}

Provide a clear, concise response using the context above. Include key facts and practical tips. Cite sources as [Source: Title].
`,

  structured: (query: string, context: string) => `
TRAVEL KNOWLEDGE BASE:
${context}

USER REQUEST: ${query}

Please provide a structured response including:
1. Overview and key recommendations
2. Specific details from the context
3. Practical information and tips
4. Sources and citations

Use the context to provide accurate, factual information. Cite sources as [Source: Document Title].
`
};

export async function performRAG(config: RAGConfig): Promise<RAGResult> {
  try {
    console.log(`🔍 RAG: Retrieving documents for "${config.query.substring(0, 50)}..."`);

    // Step 1: Retrieve relevant documents
    const searchResults = await searchTravelDocs(
      config.query,
      config.maxRetrievedDocs || 5
    );

    // Step 2: Prepare context from retrieved documents
    const context = prepareContext(searchResults, config.contextWindow || 3000);
    
    // Step 3: Generate augmented response
    const responseFormat = config.responseFormat || 'detailed';
    const prompt = ragPrompts[responseFormat](config.query, context);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2000
      }
    });

    const result = await model.generateContent(prompt);
    const augmentedResponse = result.response.text();

    // Step 4: Extract citations
    const citations = config.includeCitations !== false ? 
      extractCitations(augmentedResponse, searchResults) : [];

    // Step 5: Calculate retrieval statistics
    const retrievalStats = calculateRetrievalStats(searchResults, context.length);

    return {
      query: config.query,
      retrievedDocuments: searchResults.map(doc => ({
        id: doc.id?.toString() || '',
        title: doc.title,
        content: doc.content,
        similarity: doc.similarity || 0,
        metadata: doc.metadata
      })),
      augmentedResponse,
      citations,
      retrievalStats,
      method: 'retrieval-augmented-generation'
    };

  } catch (error) {
    console.error('Error in RAG processing:', error);
    throw error;
  }
}

// Prepare context from retrieved documents
function prepareContext(documents: any[], maxLength: number): string {
  let context = '';
  let currentLength = 0;

  for (const doc of documents) {
    const docContext = `DOCUMENT: ${doc.title}\n${doc.content}\n\n`;
    
    if (currentLength + docContext.length > maxLength) {
      // Truncate if we're approaching the limit
      const remainingSpace = maxLength - currentLength - 100; // Leave some buffer
      if (remainingSpace > 0) {
        context += `DOCUMENT: ${doc.title}\n${doc.content.substring(0, remainingSpace)}...\n\n`;
      }
      break;
    }
    
    context += docContext;
    currentLength += docContext.length;
  }

  return context.trim();
}

// Extract citations from the response
function extractCitations(response: string, documents: any[]): string[] {
  const citations: string[] = [];
  
  // Look for citation patterns like [Source: Title]
  const citationPattern = /\[Source:\s*([^\]]+)\]/g;
  let match;
  
  while ((match = citationPattern.exec(response)) !== null) {
    citations.push(match[1].trim());
  }

  // Also check if any document titles are mentioned in the response
  for (const doc of documents) {
    if (response.toLowerCase().includes(doc.title.toLowerCase()) && 
        !citations.includes(doc.title)) {
      citations.push(doc.title);
    }
  }

  return [...new Set(citations)]; // Remove duplicates
}

// Calculate retrieval statistics
function calculateRetrievalStats(documents: any[], contextLength: number) {
  const averageSimilarity = documents.length > 0 
    ? documents.reduce((sum, doc) => sum + doc.similarity, 0) / documents.length 
    : 0;

  return {
    documentsRetrieved: documents.length,
    averageSimilarity: Math.round(averageSimilarity * 100) / 100,
    contextLength
  };
}

// Compare RAG vs Direct Generation
export async function compareRAGvsDirect(query: string): Promise<{
  ragResult: RAGResult;
  directResult: string;
  comparison: string;
}> {
  // RAG approach
  const ragResult = await performRAG({
    query,
    maxRetrievedDocs: 3,
    includeCitations: true
  });

  // Direct generation approach
  const directModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const directPrompt = `You are Only Explore, a travel assistant. Answer this query: ${query}`;
  const directResponse = await directModel.generateContent(directPrompt);
  const directResult = directResponse.response.text();

  return {
    ragResult,
    directResult,
    comparison: `RAG uses ${ragResult.retrievedDocuments.length} retrieved documents with ${ragResult.citations.length} citations, while direct generation relies only on pre-trained knowledge`
  };
}

// Advanced RAG with multi-step retrieval
export async function performAdvancedRAG(
  query: string,
  options: {
    multiStepRetrieval?: boolean;
    queryExpansion?: boolean;
    reranking?: boolean;
  } = {}
): Promise<{
  initialQuery: string;
  expandedQueries?: string[];
  multiStepResults?: RAGResult[];
  finalResult: RAGResult;
  enhancement: string;
}> {
  let expandedQueries: string[] | undefined;
  let multiStepResults: RAGResult[] | undefined;

  // Step 1: Query expansion if enabled
  if (options.queryExpansion) {
    expandedQueries = await expandQuery(query);
  }

  // Step 2: Multi-step retrieval if enabled
  if (options.multiStepRetrieval) {
    const queries = expandedQueries || [query];
    multiStepResults = [];
    
    for (const q of queries) {
      const result = await performRAG({ query: q, maxRetrievedDocs: 2 });
      multiStepResults.push(result);
    }
  }

  // Step 3: Final RAG with enhanced context
  let finalQuery = query;
  if (expandedQueries && expandedQueries.length > 0) {
    finalQuery = `${query} (Also consider: ${expandedQueries.slice(0, 2).join(', ')})`;
  }

  const finalResult = await performRAG({
    query: finalQuery,
    maxRetrievedDocs: 5,
    includeCitations: true,
    responseFormat: 'structured'
  });

  return {
    initialQuery: query,
    expandedQueries,
    multiStepResults,
    finalResult,
    enhancement: 'Advanced RAG with query expansion and multi-step retrieval for comprehensive context gathering'
  };
}

// Query expansion to improve retrieval
async function expandQuery(query: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const expansionPrompt = `
Given this travel query: "${query}"

Generate 2-3 related queries that would help find relevant travel information. Focus on:
- Different aspects of the same topic
- Related activities or experiences
- Alternative ways to phrase the request

Return only the expanded queries, one per line, without numbering or explanations.
`;

  const result = await model.generateContent(expansionPrompt);
  const expandedQueries = result.response.text()
    .split('\n')
    .map(q => q.trim())
    .filter(q => q.length > 0 && !q.match(/^\d+\./));

  return expandedQueries.slice(0, 3); // Limit to 3 expansions
}

// RAG with specific document filtering
export async function performFilteredRAG(
  query: string,
  filters: {
    categories?: string[];
    locations?: string[];
    dateRange?: { start: string; end: string };
  }
): Promise<RAGResult> {
  // This would integrate with a more sophisticated document filtering system
  // For now, we'll use the basic RAG and add filter information to the prompt
  
  const filterContext = buildFilterContext(filters);
  const enhancedQuery = `${query}\n\nFILTERS: ${filterContext}`;
  
  return performRAG({
    query: enhancedQuery,
    maxRetrievedDocs: 5,
    includeCitations: true,
    responseFormat: 'structured'
  });
}

function buildFilterContext(filters: any): string {
  const parts = [];
  
  if (filters.categories?.length) {
    parts.push(`Categories: ${filters.categories.join(', ')}`);
  }
  
  if (filters.locations?.length) {
    parts.push(`Locations: ${filters.locations.join(', ')}`);
  }
  
  if (filters.dateRange) {
    parts.push(`Date Range: ${filters.dateRange.start} to ${filters.dateRange.end}`);
  }
  
  return parts.join(' | ') || 'No specific filters';
}
