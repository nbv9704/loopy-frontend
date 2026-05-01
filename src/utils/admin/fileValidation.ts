/**
 * Validates a file for upload
 * @param file - The file to validate
 * @param accept - Comma-separated list of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Error message if invalid, null if valid
 */
export function validateFile(file: File, accept: string, maxSize: number): string | null {
  const allowedTypes = accept.split(',').map(type => type.trim())

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return 'Định dạng file không hợp lệ. Vui lòng tải lên PNG, JPG, SVG hoặc WebP'
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return `Kích thước file vượt quá ${maxSizeMB}MB`
  }

  return null
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Checks if a file is an image based on MIME type
 * @param file - The file to check
 * @returns True if the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Creates a preview URL for an image file
 * @param file - The image file
 * @returns Promise that resolves to a data URL
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('File is not an image'))
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}
