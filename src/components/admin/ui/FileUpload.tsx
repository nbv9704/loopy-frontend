import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { FiUpload, FiImage, FiTrash2 } from 'react-icons/fi'
import { cn } from '../../../utils/admin/cn'
import {
  validateFile,
  formatFileSize,
  createImagePreview,
} from '../../../utils/admin/fileValidation'
import Button from './Button'

export interface FileUploadProps {
  label?: string
  accept: string // e.g., "image/png,image/jpeg,image/svg+xml,image/webp"
  maxSize: number // in bytes
  currentFile?: string // URL of current file
  onUpload: (file: File) => Promise<string> // Returns uploaded file URL
  onDelete?: () => Promise<void>
  error?: string
  disabled?: boolean
}

export default function FileUpload({
  label,
  accept,
  maxSize,
  currentFile,
  onUpload,
  onDelete,
  error,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(currentFile || null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate unique IDs for accessibility
  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${inputId}-error`

  const handleFileSelect = async (file: File) => {
    if (disabled || isUploading) return

    const validationError = validateFile(file, accept, maxSize)
    if (validationError) {
      // Error will be displayed via the error prop passed from parent
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Create preview
      const previewUrl = await createImagePreview(file)
      setPreview(previewUrl)

      // Simulate progress (since we don't have real progress from the API)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const uploadedUrl = await onUpload(file)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setPreview(uploadedUrl)
      setFileInfo({ name: file.name, size: file.size })

      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0)
        setIsUploading(false)
      }, 500)
    } catch (err) {
      setIsUploading(false)
      setUploadProgress(0)
      setPreview(currentFile || null)
      // Error will be handled by parent component
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDelete = async () => {
    if (!onDelete || disabled || isUploading) return

    try {
      setIsUploading(true)
      await onDelete()
      setPreview(null)
      setFileInfo(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      // Error will be handled by parent component
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? 'true' : 'false'}
      />

      {/* Upload area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all',
          isDragging && !disabled && !isUploading
            ? 'border-primary bg-primary/5'
            : error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-gray-50',
          disabled || isUploading
            ? 'opacity-60 cursor-not-allowed'
            : 'cursor-pointer hover:border-primary hover:bg-primary/5'
        )}
      >
        {preview ? (
          // Preview section
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Image preview */}
              <div className="flex-shrink-0">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                />
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileInfo?.name || 'Uploaded file'}
                    </p>
                    {fileInfo && (
                      <p className="text-xs text-gray-500 mt-1">{formatFileSize(fileInfo.size)}</p>
                    )}
                  </div>

                  {/* Delete button */}
                  {onDelete && !isUploading && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                      disabled={disabled}
                      aria-label="Xóa file"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Upload new file button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleButtonClick}
                  disabled={disabled || isUploading}
                  className="mt-3"
                >
                  <FiUpload className="w-4 h-4" />
                  Tải lên file mới
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Upload prompt
          <div className="p-8 text-center" onClick={handleButtonClick}>
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center',
                  isDragging ? 'bg-primary/10' : 'bg-gray-100'
                )}
              >
                <FiImage className={cn('w-8 h-8', isDragging ? 'text-primary' : 'text-gray-400')} />
              </div>
            </div>

            <p className="text-sm font-medium text-gray-700 mb-1">
              {isDragging ? 'Thả file vào đây' : 'Kéo thả file vào đây hoặc'}
            </p>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={disabled || isUploading}
              className="mt-2"
            >
              <FiUpload className="w-4 h-4" />
              Chọn file
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              Định dạng: PNG, JPG, SVG, WebP • Tối đa {formatFileSize(maxSize)}
            </p>
          </div>
        )}

        {/* Upload progress bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
