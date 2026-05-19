/**
 * API Service Utility
 * 
 * Handles communication between the frontend (React/Android) 
 * and the backend (Express).
 */

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

const getBaseUrl = () => {
  // If we are in production (on a phone), use the deployed server URL
  // In development, it defaults to relative paths which Vite proxies
  const remoteUrl = (import.meta as any).env?.VITE_API_URL;
  return remoteUrl || '';
};

export const api = {
  async post(endpoint: string, body: any) {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
};
