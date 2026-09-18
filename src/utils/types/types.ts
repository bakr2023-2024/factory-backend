export type ErrorDetail = {
  key: "query" | "params" | "body";
  message: string;
  path: PropertyKey[];
};
export type PaginationType<T> = {
  data: T;
  page: number;
  size: number;
  totalPages: number;
  totalCount: number;
};