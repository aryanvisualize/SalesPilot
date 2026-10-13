
import { useEffect, useState } from "react";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("API request failed");
        }

        return response.json();
      })
      .then((data) => {
        setApiStatus(data.message);
      })
      .catch(() => {
        setApiStatus("Backend connection failed");
      });
  }, []);

  return (
    <main>
      <h1>SalesPilot</h1>
      <p>Sales Meeting & Visit Management</p>
      <p>Backend status: {apiStatus}</p>
    </main>
  );
}

export default App;
