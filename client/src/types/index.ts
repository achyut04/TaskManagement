export interface User {
  id: string;
  username: string;
  email: string;
  role: "Admin" | "User";
}

export interface AuthResponse {
  token: string;
  id: string;
  username: string;
  email: string;
  role: "Admin" | "User";
}
