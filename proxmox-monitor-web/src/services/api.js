import config from "../config";

export async function login(email, password) {
  const response = await fetch(`${config.apiBaseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = new Error("Login failed");
    error.status = response.status; // נשמור את הקוד
    throw error;
  }

  const data = await response.json();
  return data;
}