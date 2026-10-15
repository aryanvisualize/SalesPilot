import { useEffect, useState } from "react";
import { apiRequest } from "./services/api";
import Login from "./pages/Login";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking...");

  useEffect(() => {
    async function checkApiHealth() {
      try {
        const data = await apiRequest("/api/health");
        setApiStatus(data.message);
      } catch (error) {
        setApiStatus("Backend connection failed");
        console.error("Health check failed:", error);
      }
    }

    checkApiHealth();
  }, []);

  function handleLogin(data) {
    console.log("Login successful", data);
    // Next step: store the user and show the dashboard.
  }

  return (
    <main>
      <p>Backend status: {apiStatus}</p>
      <Login onLogin={handleLogin} />
    </main>
  );
}

export default App;