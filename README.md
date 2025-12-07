# SF A2A MVP (Agent-to-Agent)

A standalone web application MVP demonstrating an Agent-to-Agent (A2A) architecture. This application integrates multiple AI agents to provide a personalized user experience, including public data verification, calendar management, and intelligent gift/activity recommendations.

## 🚀 Features

*   **Authentication**: Secure user signup and login using Supabase.
*   **Public Data Review**: Fetches user public data via an AI Agent, allowing users to verify and update their profile and family details.
*   **Calendar Integration**: Connects to Google Calendar (simulated via JSON-RPC) to fetch upcoming events.
*   **AI Recommendations**:
    *   **Strategic Suggestions**: Analyzes calendar events to suggest activities.
    *   **Gift Ideas**: Provides personalized gift recommendations based on event context and user preferences.
*   **Modern UI/UX**:
    *   Responsive design using Bootstrap 5 and custom SCSS.
    *   Interactive cards with internal scrolling for data management.
    *   Real-time notifications using `react-toastify`.
    *   Markdown rendering for rich AI responses.

## 🛠️ Tech Stack

### Frontend (`/client`)
*   **Framework**: React 18 (Vite)
*   **Styling**: SCSS, Bootstrap 5
*   **Routing**: React Router DOM v6
*   **State Management**: Context API (`AuthContext`)
*   **HTTP Client**: Axios
*   **Notifications**: React Toastify

### Backend (`/server`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database Integration**: Supabase (REST API)
*   **Agent Integration**: Axios (JSON-RPC & REST)
*   **Middleware**: CORS, Dotenv

---

## 🏁 Getting Started

### Prerequisites
*   Node.js (v16 or higher)
*   npm (v8 or higher)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd SF_A2A
    ```

2.  **Backend Setup**
    ```bash
    cd server
    npm install
    ```

3.  **Frontend Setup**
    ```bash
    cd ../client
    npm install
    ```

### Environment Configuration

Create a `.env` file in the `server` directory with the following configuration:

```env
PORT=5000
# Agent URLs
PUBLIC_DATA_AGENT_URL=https://open-ai-agent-app-bt5gn1.7y6hwo.usa-e2.cloudhub.io/public-data-agent
PREFERENCE_CREATE_AGENT_URL=https://preference-agent-app-bt5gn1.7y6hwo.usa-e2.cloudhub.io/preference-agent
PREFERENCE_QUERY_AGENT_URL=https://preference-agent-app-bt5gn1.7y6hwo.usa-e2.cloudhub.io/preference-agent
CALENDAR_AGENT_URL=https://calendar-agent-app-bt5gn1.7y6hwo.usa-e2.cloudhub.io/calendar-agent
GIFT_RECOMMEND_AGENT_URL=https://open-ai-agent-app-bt5gn1.7y6hwo.usa-e2.cloudhub.io/public-data-agent
```

### Running the Application

You need to run both the backend and frontend servers concurrently.

1.  **Start the Backend Server**
    ```bash
    cd server
    npm run dev
    # Server runs on http://localhost:5000
    ```

2.  **Start the Frontend Client**
    ```bash
    cd client
    npm run dev
    # Client runs on http://localhost:5173 (or similar)
    ```

---

## 📚 Developer Guide

### Project Structure

```
SF_A2A/
├── client/                 # Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable UI components (Header, etc.)
│   │   ├── context/        # Global state (AuthContext)
│   │   ├── pages/          # Route components (Auth, PublicData, Calendar)
│   │   ├── services/       # API service configuration
│   │   └── styles/         # Global SCSS and Bootstrap overrides
│   └── vite.config.js      # Vite configuration (Proxy setup)
│
├── server/                 # Backend Application
│   ├── config/             # Configuration files (API URLs)
│   ├── controllers/        # Request handlers (Agent & Auth logic)
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic & External API calls
│   └── server.js           # Entry point
```

### Key Components

#### 1. `MarkdownCardRenderer` (`client/src/pages/CalendarPage.jsx`)
A specialized component that parses raw Markdown text from AI agents and renders it into structured, interactive UI cards.
*   **Features**:
    *   Detects numbered lists (`1.`, `1)`) for "Strategic Suggestions".
    *   Detects bullet points (`- **Title**`) for "Shopping Options".
    *   Renders distinct badges (Blue for #, Green for Checkmarks).
    *   Parses key-value pairs within list items.

#### 2. `AuthContext` (`client/src/context/AuthContext.jsx`)
Manages the user's authentication state across the application. It persists user session data and provides `login` and `logout` methods to all components.

#### 3. Backend Proxy (`server/server.js`)
The Express server acts as a secure proxy between the React frontend and the external AI Agents/Supabase. This avoids CORS issues and keeps API keys/secrets hidden from the client.

### API Documentation

The backend exposes the following REST endpoints under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/signup` | Creates a new user in Supabase. |
| `POST` | `/public-data` | Fetches user public data via Agent. |
| `POST` | `/preferences` | Saves user preferences via Agent. |
| `POST` | `/calendar/events` | Fetches calendar events (JSON-RPC). |
| `POST` | `/recommendations/query` | Gets strategic suggestions for an event. |
| `POST` | `/recommendations/gifts` | Gets gift ideas for an event. |

### Styling Guidelines

*   **SCSS**: Global styles are defined in `client/src/styles/main.scss`.
*   **Bootstrap**: We use Bootstrap 5 utility classes (`d-flex`, `mb-3`, `fw-bold`) for layout and spacing.
*   **Customization**:
    *   Primary Color: Indigo 600 (`#4f46e5`)
    *   Font: Inter (Google Fonts)
    *   Cards: Custom shadows and border-radius for a "glassmorphic" or clean SaaS look.

### Troubleshooting

*   **404 Errors**: Ensure the backend server is running and the Vite proxy in `client/vite.config.js` is correctly pointing to `http://localhost:5000`.
*   **CORS Issues**: The backend is configured with `cors()`. Ensure all client requests go through the `/api` prefix.
*   **Agent Timeouts**: AI Agents may take a few seconds to respond. The UI handles this with loading spinners (`spinner-border`).

---

## 📄 License

This project is an MVP and is proprietary.
