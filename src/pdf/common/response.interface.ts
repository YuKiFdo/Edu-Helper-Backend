export interface StandardApiResponse<T = any> {
  isSuccessfull: boolean;
  Message: string;
  Content?: T;
  listContent?: T[];
}

