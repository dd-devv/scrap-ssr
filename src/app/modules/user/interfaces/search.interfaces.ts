export interface SearchReq {
  term: string;
}

export interface SearchRes {
  store: string;
  name:  string;
  image: string;
  price: number | string;
  url:   string;
}
