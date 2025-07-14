export interface LoginResponse {
  user: {
    _id: string;
    fullname: string;
    email: string;
    whatsapp: string;
    verified: boolean;
    onlyHisLow: boolean;
    createdAt: string;
    updatedAt: string;
    urls_scrap: number;
  };
  token: string;
}

export interface LoginRequest {
  whatsapp: string;
  code: string;
}
