export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
}