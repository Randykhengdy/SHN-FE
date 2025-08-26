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
  },

  async refreshToken(refreshToken) {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.refresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return response.json();
  },

  async logout() {
    const refreshToken = localStorage.getItem("refresh_token");
    
    // Hit API logout untuk invalidate refresh token di backend
    if (refreshToken) {
      try {
        await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.logout}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        console.log("✅ Logout API call successful");
      } catch (error) {
        console.log("⚠️ Logout API call failed, but continuing with local cleanup");
      }
    }
    
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    console.log("✅ Logout successful - all tokens cleared");
  }
};