import { useState } from 'react'
import FileUpload from './FileUpload'

/**
 * Example usage of FileUpload component
 * This demonstrates how to integrate the component with an API
 */
export default function FileUploadExample() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File): Promise<string> => {
    try {
      setError(null)

      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('logo', file)

      // Example API call (replace with actual API endpoint)
      const response = await fetch('/api/admin/header/logo', {
        method: 'POST',
        body: formData,
        headers: {
          // Add authentication token if needed
          // 'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const data = await response.json()
      setLogoUrl(data.data.logo_url)
      return data.data.logo_url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải lên'
      setError(errorMessage)
      throw err
    }
  }

  const handleDelete = async (): Promise<void> => {
    try {
      setError(null)

      // Example API call (replace with actual API endpoint)
      const response = await fetch('/api/admin/header/logo', {
        method: 'DELETE',
        headers: {
          // Add authentication token if needed
          // 'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Delete failed')
      }

      setLogoUrl(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa'
      setError(errorMessage)
      throw err
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">File Upload Example</h2>

      <FileUpload
        label="Logo Header"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        maxSize={2 * 1024 * 1024} // 2MB
        currentFile={logoUrl || undefined}
        onUpload={handleUpload}
        onDelete={handleDelete}
        error={error || undefined}
      />

      {/* Display current logo URL */}
      {logoUrl && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Current Logo URL:</p>
          <p className="text-sm text-gray-600 break-all">{logoUrl}</p>
        </div>
      )}
    </div>
  )
}
