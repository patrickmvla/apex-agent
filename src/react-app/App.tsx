import { useState, useEffect } from "react";
import "./App.css";

// Define a type for the map rotation data for better type safety
interface MapRotationData {
  battle_royale: {
    current: { map: string; remainingTimer: string };
    next: { map: string };
  };
  ranked: {
    current: { map:string; remainingTimer: string };
    next: { map: string };
  };
  ltm: {
    current: { map: string; remainingTimer: string };
    next: { map: string };
  };
}

function App() {
  const [rotationData, setRotationData] = useState<MapRotationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the map rotation data when the component mounts
    const fetchMapRotation = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/map-rotation");
        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.statusText}`);
        }
        const data = await res.json();
        setRotationData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapRotation();
  }, []); // The empty dependency array ensures this runs only once on mount

  const renderMapCard = (title: string, mapInfo: MapRotationData[keyof MapRotationData]) => {
    if (!mapInfo || !mapInfo.current) return null;
    return (
      <div className="map-card">
        <h2>{title}</h2>
        <p><strong>Current:</strong> {mapInfo.current.map}</p>
        <p><strong>Time Remaining:</strong> {mapInfo.current.remainingTimer}</p>
        <p><strong>Next:</strong> {mapInfo.next.map}</p>
      </div>
    );
  };


  return (
    <>
      <h1>Apex Legends Dashboard</h1>
      <div className="dashboard-container">
        {isLoading && <p>Loading live game data...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {rotationData && (
          <div className="rotation-grid">
            {renderMapCard("Battle Royale", rotationData.battle_royale)}
            {renderMapCard("Ranked", rotationData.ranked)}
            {renderMapCard("Limited Time Mode", rotationData.ltm)}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
