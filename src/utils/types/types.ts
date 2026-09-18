export type ErrorDetail = {
  key: "query" | "params" | "body";
  message: string;
  path: PropertyKey[];
};
