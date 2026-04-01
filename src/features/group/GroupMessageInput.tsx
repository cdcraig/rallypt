import { useState, useRef, type KeyboardEvent } from 'react'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export function GroupMessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="px-4 py-3 bg-[#0f172a] border-t border-[#1e3a5f] shrink-0">
      <div className="flex items-end gap-2 bg-[#1e293b] rounded-2xl px-3 py-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Message…"
          disabled={disabled}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm resize-none outline-none leading-relaxed py-1 max-h-[120px] overflow-y-auto"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0 transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-slate-600 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
