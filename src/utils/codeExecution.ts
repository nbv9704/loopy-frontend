// Code execution utilities
import { errorLogger } from '../services/ErrorLogger'
import type { ExecutionError } from '../types/logger.types'

export interface ExecutionResult {
  logs: string[]
  error?: string
}

// ============================================================================
// QUAN TRỌNG: Chỉ có JavaScript có thể chạy trực tiếp trong browser!
// ============================================================================
// - JavaScript: Chạy được vì browser có JavaScript engine (V8, SpiderMonkey, etc.)
// - C++: KHÔNG chạy được - cần compiler (g++, clang++) để biên dịch thành machine code
// - Python: KHÔNG chạy được - cần Python interpreter (có thể dùng Pyodide/WASM nhưng chưa implement)
// ============================================================================

// Execute code based on language
export const executeCode = (code: string, language: string): ExecutionResult => {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      // ✅ JavaScript CÓ THỂ chạy trong browser
      return executeJavaScript(code)
    case 'cpp':
    case 'c++':
      // ❌ C++ KHÔNG THỂ chạy trong browser - chỉ hiển thị hướng dẫn
      return executeCpp(code)
    case 'python':
    case 'py':
      // ❌ Python KHÔNG THỂ chạy trong browser - chỉ hiển thị hướng dẫn
      return executePython(code)
    default:
      return {
        logs: [],
        error: `Ngôn ngữ "${language}" chưa được hỗ trợ`,
      }
  }
}

// ============================================================================
// C++ EXECUTION - KHÔNG THỂ CHẠY TRONG BROWSER
// ============================================================================
// Lý do: C++ là compiled language, cần compiler để biên dịch thành machine code
// Browser chỉ có JavaScript engine, không có C++ compiler
// Giải pháp: Hiển thị hướng dẫn để user chạy code C++ trên máy local hoặc online compiler
// ============================================================================
 
const executeCpp = (codeParam: string): ExecutionResult => {
  // Avoid unused parameter warning
  void codeParam
  return {
    logs: [
      '⚠️  C++ KHÔNG THỂ CHẠY TRONG BROWSER',
      '',
      '📘 Lý do: C++ là ngôn ngữ biên dịch (compiled language)',
      '   Browser chỉ có JavaScript engine, không có C++ compiler',
      '',
      '💡 Để chạy code C++:',
      '1. Cài đặt compiler (g++, clang++, hoặc Visual Studio)',
      '2. Lưu code vào file (ví dụ: main.cpp)',
      '3. Biên dịch: g++ main.cpp -o main',
      '4. Chạy: ./main (Linux/Mac) hoặc main.exe (Windows)',
      '',
      '🔗 Hoặc dùng online compiler:',
      '- https://www.onlinegdb.com/online_c++_compiler',
      '- https://www.programiz.com/cpp-programming/online-compiler/',
      '- https://godbolt.org/ (xem assembly code)',
    ],
  }
}

// ============================================================================
// PYTHON EXECUTION - KHÔNG THỂ CHẠY TRONG BROWSER
// ============================================================================
// Lý do: Python cần interpreter để chạy
// Browser không có Python interpreter built-in
// Giải pháp tương lai: Có thể dùng Pyodide (Python compiled to WebAssembly)
// ============================================================================
 
const executePython = (codeParam: string): ExecutionResult => {
  // Avoid unused parameter warning
  void codeParam
  return {
    logs: [
      '⚠️  PYTHON KHÔNG THỂ CHẠY TRONG BROWSER',
      '',
      '🐍 Lý do: Python cần interpreter để chạy',
      '   Browser không có Python interpreter built-in',
      '',
      '💡 Để chạy code Python:',
      '1. Cài đặt Python từ python.org',
      '2. Lưu code vào file (ví dụ: main.py)',
      '3. Chạy: python main.py',
      '',
      '🔗 Hoặc dùng online interpreter:',
      '- https://www.programiz.com/python-programming/online-compiler/',
      '- https://repl.it/languages/python3',
      '',
      '📝 Ghi chú: Có thể implement Pyodide (Python WASM) trong tương lai',
    ],
  }
}

// ============================================================================
// JAVASCRIPT EXECUTION - CHỈ CÓ JAVASCRIPT CHẠY ĐƯỢC TRONG BROWSER
// ============================================================================
// JavaScript có thể chạy vì browser có JavaScript engine built-in (V8, SpiderMonkey, etc.)
// Sử dụng Function constructor để execute code trong isolated scope
// ============================================================================
export const executeJavaScript = (code: string): ExecutionResult => {
  const logs: string[] = []
  const originalConsoleLog = console.log

  // Override console.log to capture output
  console.log = function (...args) {
    const stringifiedArgs = args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      })
      .join(' ')

    logs.push(stringifiedArgs)
    originalConsoleLog.apply(console, args)
  }

  try {
    const userCodeFunc = new Function(code)
    userCodeFunc()

    if (logs.length === 0) {
      logs.push('(Chạy thành công nhưng không có lệnh in nào)')
    }
  } catch (e: any) {
    // Log execution error
    const execError = new Error(e.message) as ExecutionError
    execError.name = e.name || 'JavaScriptError'
    execError.language = 'javascript'

    errorLogger.logExecutionError(execError, code)

    return {
      logs,
      error: e.message,
    }
  } finally {
    console.log = originalConsoleLog
  }

  return { logs }
}

// Format error message for display
export const formatError = (error: string): string => {
  return `❌ LỖI: ${error}`
}
