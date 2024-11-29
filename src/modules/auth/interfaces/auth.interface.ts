export interface IAuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  message: string;
}

export interface ILoginResponse extends IAuthResponse {
  access_token: string;
}
