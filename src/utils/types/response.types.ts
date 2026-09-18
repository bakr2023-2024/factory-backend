import { ErrorDetail } from "./types";

export type DataResponse<T> = {
  status: number;
  body: { data: T };
};
export type PaginationResponse<T> = {
  status: number;
  body: {
    data: T;
    page: number;
    size: number;
    totalPages: number;
    totalCount: number;
  };
};
export type ErrorResponse = {
  status: number;
  body: { message: string; cause?: ErrorDetail[] };
};
