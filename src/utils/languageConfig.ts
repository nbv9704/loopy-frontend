import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { php } from '@codemirror/lang-php'
import { rust } from '@codemirror/lang-rust'
import { java } from '@codemirror/lang-java'
import { sql } from '@codemirror/lang-sql'

// Hàm tự động nhận diện ngôn ngữ từ extension
export const detectLanguage = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    mjs: 'javascript',
    cjs: 'javascript',
    // Python
    py: 'python',
    pyw: 'python',
    // C/C++
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'cpp',
    hpp: 'cpp',
    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'css',
    sass: 'css',
    json: 'json',
    xml: 'html',
    // Markdown
    md: 'markdown',
    markdown: 'markdown',
    // PHP
    php: 'php',
    // Rust
    rs: 'rust',
    // Java
    java: 'java',
    // SQL
    sql: 'sql',
    // Shell
    sh: 'shell',
    bash: 'shell',
  }
  return languageMap[ext] || 'javascript'
}

// Cấu hình extension và màu cho từng ngôn ngữ
export const getLanguageConfig = (language: string) => {
  const configs: Record<string, { ext: any; icon: string; color: string }> = {
    javascript: { ext: javascript({ jsx: true, typescript: false }), icon: 'JS', color: 'yellow' },
    typescript: { ext: javascript({ jsx: true, typescript: true }), icon: 'TS', color: 'cyan' },
    python: { ext: python(), icon: 'PY', color: 'blue' },
    cpp: { ext: cpp(), icon: 'C++', color: 'fuchsia' },
    c: { ext: cpp(), icon: 'C', color: 'purple' },
    html: { ext: html(), icon: 'HTML', color: 'orange' },
    css: { ext: css(), icon: 'CSS', color: 'blue' },
    json: { ext: json(), icon: 'JSON', color: 'green' },
    markdown: { ext: markdown(), icon: 'MD', color: 'slate' },
    php: { ext: php(), icon: 'PHP', color: 'indigo' },
    rust: { ext: rust(), icon: 'RS', color: 'orange' },
    java: { ext: java(), icon: 'JAVA', color: 'red' },
    sql: { ext: sql(), icon: 'SQL', color: 'cyan' },
    shell: { ext: javascript(), icon: 'SH', color: 'green' },
  }
  return configs[language] || configs.javascript
}

export const getLanguageExtension = (language: string) => {
  return getLanguageConfig(language).ext
}
