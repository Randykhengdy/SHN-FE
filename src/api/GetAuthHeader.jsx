import { getToken, getTokenType } from "@/lib/tokenStorage";

export function getAuthHeader() {
  const token = getToken();
  const tokenType = getTokenType() || 'Bearer';
  
  if (token) {
    return {
      Authorization: `${tokenType} ${token}`,
    };
  }
  
  return {};
}