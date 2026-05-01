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
    name: 'main.js',
    language: 'javascript',
    code: '// Welcome to Loopy Playground!\nconsole.log("Hello, World!")\n',
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
