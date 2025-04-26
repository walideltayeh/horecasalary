
export interface User {
  id: string;
  email: string; // Ensure email is required
  role: 'admin' | 'user';
  name: string;
  password?: string;
}
