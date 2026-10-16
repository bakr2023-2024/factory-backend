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
export type PaymentPreview = {
  rateId: number;
  days: number;
  dailySalary: number;
  gross: number;
  loans: number;
  loanPayments: number;
  net: number;
  paid: boolean;
  occurredAt: Date | null;
};