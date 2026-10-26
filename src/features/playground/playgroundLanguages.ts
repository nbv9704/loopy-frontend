import { FiCpu, FiCode, FiDatabase } from 'react-icons/fi'

export type PlaygroundLanguage = 'python' | 'javascript' | 'cpp' | 'java' | 'go' | 'rust'

export const playgrounds: Record<
  PlaygroundLanguage,
  { label: string; file: string; icon: typeof FiCpu; code: string }
> = {
  python: {
    label: 'Python',
    file: 'main.py',
    icon: FiCpu,
    code: 'name = "Loopy"\nprint(f"Xin chào {name}")',
  },
  javascript: {
    label: 'JavaScript',
    file: 'main.js',
    icon: FiCode,
    code: 'const name = "Loopy"\nconsole.log(`Xin chào ${name}`)',
  },
  cpp: {
    label: 'C++',
    file: 'main.cpp',
    icon: FiDatabase,
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Xin chào Loopy" << endl;\n  return 0;\n}',
  },
  java: {
    label: 'Java',
    file: 'Main.java',
    icon: FiDatabase,
    code: 'class Main {\n  public static void main(String[] args) {\n    System.out.println("Xin chào Loopy");\n  }\n}',
  },
  go: {
    label: 'Go',
    file: 'main.go',
    icon: FiDatabase,
    code: 'package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Xin chào Loopy")\n}',
  },
  rust: {
    label: 'Rust',
    file: 'main.rs',
    icon: FiDatabase,
    code: 'fn main() {\n    println!("Xin chào Loopy");\n}',
  },
}
