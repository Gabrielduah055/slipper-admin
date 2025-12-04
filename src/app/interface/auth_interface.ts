export interface login {
  message: string;
  token: string;
  admin: Admin;
}

export interface Admin {
  id: string;
  userName: string;
  email: string;
  role: string;
}
