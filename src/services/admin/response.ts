import { z } from 'zod'
import { getAdminErrorMessage } from './errors'

export function adminData<T extends z.ZodTypeAny>(
  schema: T,
  response: { data?: { success?: boolean; data?: unknown } }
): z.output<T> {
  const parsed = schema.safeParse(response.data?.data)
  if (response.data?.success !== true || !parsed.success)
    throw new Error(
      'Dữ liệu phản hồi chưa được xác nhận. Hãy tải lại để kiểm tra trước khi gửi lại.'
    )
  return parsed.data
}

export async function adminRead<T>(request: Promise<T>): Promise<T> {
  try {
    return await request
  } catch (cause) {
    throw new Error(getAdminErrorMessage(cause, 'Không tải được dữ liệu.'))
  }
}
