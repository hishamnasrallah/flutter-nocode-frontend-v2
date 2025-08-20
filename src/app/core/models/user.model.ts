// src/app/core/models/user.model.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  last_login?: string;
  profile_picture?: string;
  phone_number?: string;
  company?: string;
  role?: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  company?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface LogoutRequest {
  refresh: string;
}
