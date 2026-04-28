export function success<T>(data: T) {
  return {
    success: true,
    data,
    meta: {
      request_id: 'local-dev'
    }
  };
}
