export interface IUser {
  id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
