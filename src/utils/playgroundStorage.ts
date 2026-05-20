/**
 * Playground Storage — localStorage persistence for playground files.
 */

export interface CodeFile {
  id: string
  name: string
  language: string
  code: string
}

const STORAGE_KEY = 'playground_files'
const ACTIVE_FILE_KEY = 'playground_active_file'

const DEFAULT_FILES: CodeFile[] = [
  {
    id: '1',
    name: 'thu-nghiem.js',
    language: 'javascript',
    code: `// 🎮 Chào mừng bạn đến Playground!
// Đây là nơi bạn tự do thử nghiệm code.
// Nhấn nút "Chạy" để xem kết quả.

// Thử thay đổi tên bên dưới:
const ten = "Loopy"
console.log("Xin chào, " + ten + "! 🚀")

// Thử tính toán:
console.log("2 + 3 =", 2 + 3)
`,
  },
]

export function loadFiles(): CodeFile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_FILES]
}

export function saveFiles(files: CodeFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
  } catch {
    // ignore
  }
}

export function loadActiveFileId(files: CodeFile[]): string {
  const stored = localStorage.getItem(ACTIVE_FILE_KEY)
  if (stored && files.some(f => f.id === stored)) return stored
  return files[0]?.id || '1'
}

export function saveActiveFileId(id: string): void {
  localStorage.setItem(ACTIVE_FILE_KEY, id)
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(ACTIVE_FILE_KEY)
}

export function addFileToPlayground(code: string, language: string, title: string = 'Untitled'): void {
  const files = loadFiles()
  const newFile: CodeFile = {
    id: Date.now().toString(),
    name: `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'cpp'}`,
    language,
    code,
  }
  
  // Prevent duplicate names roughly
  let finalName = newFile.name
  let counter = 1
  while (files.some(f => f.name === finalName)) {
    finalName = `${newFile.name.split('.')[0]}_${counter}.${newFile.name.split('.')[1]}`
    counter++
  }
  newFile.name = finalName

  // Remove oldest if limit reached
  if (files.length >= 10) {
    files.shift()
  }

  files.push(newFile)
  saveFiles(files)
  saveActiveFileId(newFile.id)
}
