import { IUser } from "./user";

export interface ILoginResponseToken {
  token: string;
  refreshToken: string;
  mustChangePassword: boolean;
  user: IUser;
}