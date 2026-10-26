interface HttpFailure {
  response?: { status?: number; data?: { message?: string; error?: { message?: string } } }
  message?: string
}

export function getHttpStatus(error: unknown): number | undefined {
  return (error as HttpFailure | null)?.response?.status
}

export function getAdminErrorMessage(error: unknown, fallback: string): string {
  const failure = error as HttpFailure | null
  return (
    failure?.response?.data?.error?.message ||
    failure?.response?.data?.message ||
    failure?.message ||
    fallback
  )
}
