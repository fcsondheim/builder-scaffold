import { Severity, useNotification } from '@evefrontier/dapp-kit'
import { Callout } from '@radix-ui/themes'
import { useEffect } from 'react'

const AUTO_DISMISS_MS = 6000

const SEVERITY_COLOR: Record<Severity, 'green' | 'red' | 'amber' | 'blue'> = {
  [Severity.Success]: 'green',
  [Severity.Error]: 'red',
  [Severity.Warning]: 'amber',
  [Severity.Info]: 'blue',
}

/**
 * Renders the global dapp-kit notification (the provider ships state only, no UI) as
 * a fixed bottom-right toast that auto-dismisses. Mount once, app-wide.
 */
export function NotificationToast() {
  const { notification } = useNotification()
  const { isOpen, severity, message, handleClose } = notification

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(handleClose, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <Callout.Root
      color={SEVERITY_COLOR[severity]}
      role="status"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        maxWidth: '420px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      <Callout.Text style={{ wordBreak: 'break-all' }}>{message}</Callout.Text>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss notification"
        style={{ cursor: 'pointer' }}
      >
        ×
      </button>
    </Callout.Root>
  )
}
