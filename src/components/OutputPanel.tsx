import React from 'react'
import { Copy } from 'lucide-react'

interface OutputPanelProps {
  generatedMessage: string
  copied: boolean
  onCopy: () => void
}

export default function OutputPanel({ generatedMessage, copied, onCopy }: OutputPanelProps) {
  return (
    <section className="panel-card panel-card-accent" aria-labelledby="generated-message-heading">
      <div className="panel-toolbar">
        <h2 id="generated-message-heading" className="section-title">
          Output
        </h2>
        {generatedMessage && (
          <button
            type="button"
            onClick={onCopy}
            className="secondary-action secondary-action-emerald"
          >
            <Copy className="icon-small" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      <div className="output-shell">
        {generatedMessage ? (
          <textarea
            readOnly
            value={generatedMessage}
            aria-label="Generated release note"
            className="output-textarea"
            style={{ whiteSpace: 'pre-wrap' }}
          />
        ) : (
          <div className="output-empty">
            <p>No message yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}
