/**
 * The persistent AI composer — the spine of InvestAnalitic. A spark-marked,
 * auto-growing text area where the user types trades in free text ("Купил 5
 * лотов Сбера по 286") or asks the analyst anything. On focus the shell picks up
 * the azure accent glow. Optional suggestion chips prime common questions; a
 * subtle hint explains Enter/Shift+Enter. Always reachable — dock it at the
 * bottom of the conversation column or as a right-rail footer.
 *
 * `onSend(text)` fires on Enter or the send button (Shift+Enter = newline).
 */
export interface AIComposerProps {
  placeholder?: string
  /** Suggestion chips shown under the input. */
  suggestions?: string[]
  /** Called with the trimmed text on submit. */
  onSend?: (text: string) => void
  /** Called when a suggestion chip is clicked (defaults to onSend). */
  onSuggestion?: (text: string) => void
  /** Helper line under the input. Pass "" to hide. */
  hint?: string
  disabled?: boolean
  className?: string
}

export declare function AIComposer(props: AIComposerProps): JSX.Element
