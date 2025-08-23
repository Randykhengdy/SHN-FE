import apiConfig from "@/config/api";

export const authService = {
  async login(credentials) {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.login}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },
  
  async register(userData) {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.register}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return response.json();
  }
};