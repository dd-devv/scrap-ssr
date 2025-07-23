export interface BuysReq {
  resultId: string;
  label:    string;
}

export interface BuyResp {
  _id:       string;
  user:      string;
  result:    string;
  url:     string;
  buyCount: number;
  dates:     Date[];
  createdAt: Date;
}
