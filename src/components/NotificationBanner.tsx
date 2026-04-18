import React from 'react'

interface NotificationBannerProps {
  notification: { type: 'success' | 'error'; message: string }
  onDismiss: () => void
}

export default function NotificationBanner({ notification, onDismiss }: NotificationBannerProps) {
  return (
    <div
      className={`notice-banner ${notification.type === 'success' ? 'notice-success' : 'notice-error'}`}
      role="status"
      aria-live="polite"
    >
      <span>{notification.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="notice-dismiss"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}
