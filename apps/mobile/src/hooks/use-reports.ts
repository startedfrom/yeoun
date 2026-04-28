import { useMutation } from '@tanstack/react-query';
import { createReport } from '../lib/api';
import type { CreateReportRequest } from '@gamdojang/domain';

export function useCreateReport() {
  return useMutation({
    mutationFn: (data: CreateReportRequest) => createReport(data),
  });
}
