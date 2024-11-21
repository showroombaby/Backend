export interface IAuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  message: string;
}
