import { IUser } from "./user";

export interface ILoginResponseToken {
  token:              string;
  refreshToken:       string;
  mustChangePassword: boolean;
  user:               IUser;
  userId?:            number;   // ← agregar — solo viene cuando mustChangePassword = true
  message?:           string;   // ← agregar — solo viene cuando mustChangePassword = true
}