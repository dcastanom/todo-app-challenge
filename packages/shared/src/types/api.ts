/** Standard success envelope returned by every endpoint. */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/** Pagination metadata attached to list endpoints. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type PaginatedResponse<T> = ApiResponse<T[]> & { meta: PaginationMeta };

/** Standard error envelope. `code` is a stable machine-readable string. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
