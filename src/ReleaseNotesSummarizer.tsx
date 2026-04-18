import React, { useEffect, useState } from 'react'
import NotificationBanner from './components/NotificationBanner'
import OutputPanel from './components/OutputPanel'
import ReleaseForm from './components/ReleaseForm'
import { requestGeneratedMessage } from './lib/api'
import {
  EMPTY_FORM_DATA,
  EXAMPLE_TICKETS,
  buildReleasePrompt,
  getLocalDateInputValue
} from './lib/release'
import { RELEASE_FORM_STORAGE_KEY } from './lib/storage'

interface ReleaseFormData {
  osBE: string
  osFE: string
  proFE: string
  proNative: string
  releaseDate: string
  releaseTime: string
  ticketDetails: string
  downtime: string
}

export default function ReleaseNotesSummarizer() {
  const [formData, setFormData] = useState<ReleaseFormData>(EMPTY_FORM_DATA)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(RELEASE_FORM_STORAGE_KEY)
    if (!saved) {
      return
    }

    try {
      setFormData({ ...EMPTY_FORM_DATA, ...JSON.parse(saved) })
    } catch (error) {
      console.error('Failed to load saved form data:', error)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(RELEASE_FORM_STORAGE_KEY, JSON.stringify(formData))
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [formData])

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const showNotification = (type: 'success' | 'error', message: string, duration = 8000) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), duration)
  }

  const generateReleaseNotes = async () => {
    setIsGenerating(true)
    setNotification(null)

    try {
      const prompt = buildReleasePrompt(formData)
      const message = await requestGeneratedMessage(prompt)
      setGeneratedMessage(message)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setGeneratedMessage(`Error: ${errorMessage}`)
      showNotification('error', errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      showNotification('error', `Failed to copy message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleClear = () => {
    setFormData(EMPTY_FORM_DATA)
    setGeneratedMessage('')
    localStorage.removeItem(RELEASE_FORM_STORAGE_KEY)
    showNotification('success', 'Form cleared successfully', 3000)
  }

  const handleToday = () => {
    const now = new Date()
    updateField('releaseDate', getLocalDateInputValue(now))
    updateField('releaseTime', now.toTimeString().slice(0, 5))
  }

  const handleToggleExample = () => {
    updateField('ticketDetails', formData.ticketDetails.trim() ? '' : EXAMPLE_TICKETS)
  }

  const canGenerate = Boolean(formData.ticketDetails.trim() && formData.releaseDate && formData.releaseTime)

  return (
    <div className="app-shell">
      <main className="page-frame">
        <header className="page-header">
          <h1 className="page-title">Release Notes Summarizer</h1>
          <p className="page-subtitle">Generate a release message from ticket details.</p>
        </header>

        {notification && <NotificationBanner notification={notification} onDismiss={() => setNotification(null)} />}

        <div className="content-grid">
          <ReleaseForm
            formData={formData}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
            onFieldChange={updateField}
            onToday={handleToday}
            onGenerate={generateReleaseNotes}
            onClear={handleClear}
            onToggleExample={handleToggleExample}
          />

          <OutputPanel generatedMessage={generatedMessage} copied={copied} onCopy={handleCopy} />
        </div>

        <footer className="page-footer">
          <span>Built by vidhatrashukla</span>
          <a
            href="https://github.com/vidhatrashukla"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            github.com/vidhatrashukla
          </a>
        </footer>
      </main>
    </div>
  )
}
