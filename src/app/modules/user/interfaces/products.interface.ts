export interface RegisterProductRes {
  user:      string;
  urls:      string[];
  status:    string;
  frequency: string;
  _id:       string;
  createdAt: Date;
  updatedAt: Date;
  id:        string;
}

export interface RegisterProductReq {
  urls:      string[];
  frequency: string;
}

export interface Product {
  jobId:        string;
  productTitle: string;
  currentPrice: number;
  lastUpdate:   Date;
  image:        string;
  lowestPrice:  number;
  url:          string;
  urlId:        string;
}

export interface ProductPublic {
  productTitle:       string;
  currentPrice:       number;
  lastUpdate:         Date;
  image:              string;
  url:                string;
  urlId:              string;
  lowestPrice:        number;
  previousPrice:      number;
  discountPercentage: number;
}

export interface PriceHistory {
  productInfo:  ProductInfo;
  priceHistory: PriceHistoryClass;
}

export interface PriceHistoryClass {
  prices:  [number[]];
  dates:  [ Date[]];
  changes: any[];
}

export interface ProductInfo {
  title:        string;
  description:  string;
  currentPrice: number;
  image:        string;
  url:          string;
  urlId:        string;
}

export interface DeleteURLResp {
  message:       string;
  remainingUrls: number;
}
