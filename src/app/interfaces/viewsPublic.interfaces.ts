export interface ViewsReq {
  resultId: string;
  label:    string;
}

export interface ViewResp {
  _id:       string;
  user:      string;
  result:    string;
  label:     string;
  viewCount: number;
  dates:     Date[];
  createdAt: Date;
}
