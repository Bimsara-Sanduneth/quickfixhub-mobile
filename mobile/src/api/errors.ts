import { isAxiosError } from 'axios';

import type { ApiError } from './types';

export function extractErrorMessage(error: unknown): string {
  if (isAxiosError<ApiError>(error)) {
    return error.response?.data?.message ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}
