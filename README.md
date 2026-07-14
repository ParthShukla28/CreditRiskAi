# CREDITRISKAI
A full-stack loan default risk assessment platform for tracking loan applications and generating AI-driven credit risk scores.
**Live Demo:** https://credit-risk-ai-five.vercel.app
## Technologies Used
-   **Frontend:** React, TypeScript, Vite, Tailwind CSS
-   **Backend:** Node.js, Express, MongoDB (Mongoose)
-   **AI Microservice:** Python, FastAPI, scikit-learn, XGBoost, SHAP
-   **Authentication:** JWT (JSON Web Tokens)
## Features
-   **Loan Applications:** Create, view, update status, and delete loan applications.
-   **AI Risk Scoring:** Leverages a FastAPI microservice to predict default risk and return a risk category (Low / Medium / High) along with the top contributing factors, explained using SHAP.
-   **Loan Advisor Chat:** A conversational endpoint that explains an applicant's risk score in plain language.
-   **CSV Upload:** Bulk import applicants via CSV, with a downloadable template.
-   **Analytics Dashboard:** Track application volume, approval/rejection trends, and risk distribution, with data export.
-   **User Authentication:** Role-based sign-in (admin, officer, analyst) secured with JWT.
## Local Development Setup
1.  **Prerequisites:**
    -   Node.js 18+
    -   Python 3.10+
    -   MongoDB (local instance or a connection URI)
2.  **AI Microservice Setup:**
    -   Navigate to the `aiservice` directory.
    -   Install dependencies: `pip install -r requirements.txt`
    -   Start the service: `uvicorn app:app --reload --port 8000`
    -   The service will run at `http://localhost:8000`.
3.  **Backend Setup:**
    -   Navigate to the `backend` directory.
    -   Copy `.env.example` to `.env` and update values as needed.
    -   Install dependencies: `npm install`
    -   Seed an initial admin account: `node seed.js` (creates `admin@bank.com` / `password123`)
    -   Start the server: `npm run dev`
    -   The API will run at `http://localhost:3001`.
4.  **Frontend Setup:**
    -   Navigate to the `frontend` directory.
    -   Install dependencies: `npm install`
    -   Start the development server: `npm run dev`
    -   The app will run at `http://localhost:5173`.
5.  **Environment Variables:**
    -   Create a `.env` file in the `backend` directory. Example structure:
    ```
    PORT=3001
    NODE_ENV=development

    MONGODB_URI=mongodb://localhost:27017/loanrisk

    JWT_SECRET=b472cec764d74c2dd525176859d6423fc3faef13fe26d8ee4640240d60c8a931
    JWT_EXPIRES_IN=7d

    ML_API_URL=http://localhost:8000
    ML_PREDICT_ENDPOINT=/predict

    FRONTEND_URL=http://localhost:5173
    ```
6.  **Run All Three Services:**
    -   With the AI microservice, backend, and frontend all running, the application should be accessible at `localhost:5173`.
