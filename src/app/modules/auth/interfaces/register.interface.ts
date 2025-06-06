import { User } from "./user.interface";

export interface RegisterResponse {
  message: string;
  tempToken: string;
  userId: string;
}

export interface UpdateResponse {
  message: string;
  user: User;
}

export interface RegisterRequest {
  fullname: string;
  // email: string;
  whatsapp: string;
  // password: string;
}

export interface UpdateRequest {
  fullname: string;
  email: string;
  whatsapp: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
