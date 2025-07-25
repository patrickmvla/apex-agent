export const getMapRotation = async () => {
  const response = await fetch("/api/map-rotation");

  if (!response.ok) {
    throw new Error("Network response was not okay");
  }

  return response.json();
};

export const getPlayerStats = async ({
  platform,
  playerName,
}: {
  platform: string;
  playerName: string;
}) => {
  if (!platform || !playerName) {
    throw new Error("Platform and player name are required");
  }

  const response = await fetch(`/api/player-stats/${platform}/${playerName}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.error || `Player not found or API error (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
};

export const getStoreRotation = async () => {
  const response = await fetch("/api/store");

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
};

export const getCraftingRotation = async () => {
  const response = await fetch("/api/crafting");

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
};

export const getGameNews = async () => {
  const response = await fetch("/api/news");

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
};

export type ChatHistoryItem = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

export const askAI = async (message: string, history: ChatHistoryItem[]) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    throw new Error("Failed to get a response from the AI agent.");
  }

  return response.json();
};

export const getPredatorLeaderboard = async () => {
  const response = await fetch("/api/predator");

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
};
