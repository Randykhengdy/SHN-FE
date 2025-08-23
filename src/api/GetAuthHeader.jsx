export function getAuthHeader() {
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("token_type") || "Bearer";
    return {Authorization: `${type} ${token}`,};
}