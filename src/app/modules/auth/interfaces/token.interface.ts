import { User } from "./user.interface";

export interface TokenPayload {
  userId: string;
  purpose?: string;
  iat: number;
  exp: number;
}

export interface VerifyCodeResponse {
  message: string;
  tempToken?: string;
  user?: User;
  accessToken?: string;
}
