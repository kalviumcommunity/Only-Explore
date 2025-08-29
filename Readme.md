#  Only Explore – AI Travel Chat App  

##  Project Overview  
**Only Explore** is an AI-powered travel assistant that simplifies the trip planning process.  
Instead of browsing multiple sites and apps, users can chat with *Only Explore* just like they would with a friend. The app helps them plan trips, estimate expenses, explore cuisines & culture, and even recall previously visited places.  

Our mission is to make **travel planning fun, smart, and conversational**.  

---

##  Key Features  
- **AI Travel Chat Assistant**  
   - Plan personalized itineraries (day-by-day).  
   - Suggest activities, attractions, food, and culture.  
   - Provide cost estimates and budget-friendly alternatives.  

-  **Smart Trip Planning**  
   - Suggests hotels, flights, and transport (via API integration).  
   - Weather and best-time-to-visit recommendations.  

-  **Community Sharing**  
   - Users can chat and share travel stories.  
   - AI highlights similar destinations for inspiration.  

-  **Trip History**  
   - Save, revisit, and update past trip plans anytime.  

---

## Tech Stack  

### **Frontend**
- React (Next.js / Vite)  
- Tailwind CSS (for modern UI)  
- ShadCN/UI (for prebuilt components like chat bubbles, cards)  

### **Backend**
- Node.js (Express) or Go (for APIs and request handling)  
- Supabase (Database + Authentication + Realtime chat storage)  

### **AI Integration**
- OpenAI GPT / Gemini API for conversational responses.  
- HuggingFace (optional for NLP fine-tuning).  

### **APIs**
- Skyscanner / Amadeus (Flights)  
- Booking.com / Hotels API  
- Weather API (real-time conditions)  

---

##  System Architecture  

1. **User → Frontend (React)**  
   - User enters a query like: “Plan me a 5-day trip to Bali under $800.”  

2. **Frontend → Backend (Node/Go)**  
   - Request sent to backend for processing.  

3. **Backend → AI API (OpenAI/Gemini)**  
   - AI generates an itinerary with budget, food, culture info.  

4. **Backend → External APIs**  
   - Fetches live flights, hotels, and weather details.  

5. **Backend → Database (Supabase)**  
   - Stores user chat, saved trips, and recommendations.  

6. **Backend → Frontend**  
   - Response displayed in a **chat interface** (WhatsApp/ChatGPT style).  

---

##  Implementation Plan  

### **Phase 1 – MVP**
- Create chat UI (React + Tailwind).  
- Integrate OpenAI/Gemini API for AI responses.  
- Store user queries + responses in Supabase.  

### **Phase 2 – Smart Planning**
- Add flight + hotel APIs.  
- Weather integration.  
- Allow users to save itineraries.  

### **Phase 3 – Community Features**
- Add group chat/forum for travelers.  
- AI suggests similar trips based on user chats.  

### **Phase 4 – Polishing**
- Add authentication (Google/Supabase Auth).  
- Responsive mobile-first UI.  
- Deploy on **Vercel (frontend)** + **Render/Heroku (backend)**.  

---

##  Video Explanation Script  

### **Intro:**  
“Hello everyone, my project is called *Only Explore*, an AI-powered travel assistant that makes planning trips simple, fun, and interactive.”  

### **Problem Statement:**  
“Travel planning today is scattered — you check multiple websites for flights, hotels, activities, and still don’t get a personalized plan. My app solves this by allowing users to chat with an AI as if it’s their travel buddy.”  

### **Solution:**  
“With *Only Explore*, you can type something like *Plan me a 5-day trip to Italy under $1200* and instantly get a personalized itinerary, cost estimates, food recommendations, and even cultural tips. The app also connects to live APIs for flights, hotels, and weather.”  

### **Technical Flow:**  
“The frontend is built in React with Tailwind CSS. The backend runs on Node.js with Supabase as the database. AI integration is done using OpenAI/Gemini API, while external APIs provide real-time travel data. Chat history and itineraries are saved for future use.”  

### **Phases:**  
“We’ll start with a simple AI chat MVP, then add smart planning, community features, and finally polish with authentication and deployment.”  

### **Closing:**  
“In short, *Only Explore* is your all-in-one AI travel buddy. It makes trip planning efficient, engaging, and personalized.”  

---
