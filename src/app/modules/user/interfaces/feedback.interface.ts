export interface FeedbackReq {
  user?: string;
  experience:         number;
  comment_experience: string;
  updates:            string;
  add_or_remove:      string;
  calification:       number;
}

export interface FeedResp {
  success: boolean;
  message: string;
  data:    FeedBack;
}

export interface FeedBack {
  experience:         number;
  comment_experience: string;
  updates:            string;
  add_or_remove:      string;
  calification:       number;
  _id:                string;
  createdAt:          Date;
  __v:                number;
}
