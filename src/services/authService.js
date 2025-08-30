import apiConfig from "@/config/api";
import { 
  setToken, 
  removeToken, 
  setRefreshToken, 
  removeRefreshToken,
  setTokenType,
  setIsLoggedIn,
  setUser,
  removeUser,
  clearAllTokens,
  getRefreshToken
} from "@/lib/tokenStorage";

export const authService = {
  async login(credentials) {
    const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.login}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    
    const result = await response.json();
    
    // If login successful, store tokens
    if (result.success) {
      setToken(result.token);
      setTokenType(result.token_type);
      setRefreshToken(result.refresh_token);
      setIsLoggedIn("true");
      if (result.user) {
        setUser(result.user);
      }
    }
    
    return result;
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
    const refreshToken = getRefreshToken();
    
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
    
    // Clear all tokens using new storage utility
    clearAllTokens();
    console.log("✅ Logout successful - all tokens cleared");
  }
};