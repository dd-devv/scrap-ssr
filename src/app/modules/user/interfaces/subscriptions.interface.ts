export interface Subscription {
  _id:         string;
  user:        string;
  monto:       number;
  tipo:        string;
  status:      number;
  vencimiento: Date;
  createdAt:   Date;
}

export interface SubscriptionRequest {
  monto:      number;
  tipo:       string;
}

export interface SubscriptionResponse {
  message:      string;
  subscription: Subscription;
}
