export interface Notification {
  _id:         string;
  user:        string;
  description: string;
  image:       string;
  urlId:       string;
  status:      number;
  createdAt:   Date;
}
