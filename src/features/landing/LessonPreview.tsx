import { FiCode, FiTerminal } from 'react-icons/fi'

interface LessonPreviewProps {
  title: string
  exampleLabel: string
  greeting: string
  outputLabel: string
  explanation: string
}

/** Static illustration: output is an example, never an execution or check result. */
export default function LessonPreview({
  title,
  exampleLabel,
  greeting,
  outputLabel,
  explanation,
}: LessonPreviewProps) {
  const greetingLiteral = JSON.stringify(`${greeting}, `)
  return (
    <figure className="loopy-card min-w-0 overflow-hidden rounded-3xl border shadow-lg">
      <figcaption className="border-b loopy-border px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold tracking-wide learning-entry-accent">{exampleLabel}</p>
        <p className="loopy-heading mt-2 text-lg font-bold leading-7">{title}</p>
      </figcaption>
      <div className="bg-[#0b1220] px-5 py-5 text-slate-200 sm:px-6">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <FiCode aria-hidden="true" /> hello.js
        </div>
        <pre className="mt-5 whitespace-pre-wrap break-words font-mono text-[13px] leading-7 sm:text-sm">
          <code>
            <span className="text-violet-300">const</span>
            {' name = '}
            <span className="text-emerald-300">{'"Loopy"'}</span>
            {';\n'}
            <span className="text-sky-300">console</span>
            {'.log('}
            <span className="text-emerald-300">{greetingLiteral}</span>
            {' + name + '}
            <span className="text-emerald-300">{'"!"'}</span>
            {');'}
          </code>
        </pre>
        <div className="mt-6 border-t border-slate-700/70 pt-4">
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <FiTerminal aria-hidden="true" /> {outputLabel}
          </p>
          <p className="mt-2 font-mono text-sm text-emerald-300">{greeting}, Loopy!</p>
        </div>
      </div>
      <p className="loopy-body px-5 py-4 text-sm leading-6 sm:px-6">{explanation}</p>
    </figure>
  )
}
