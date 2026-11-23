type SupportNotification = { conversationId: string; subject: string };

// Server-only notification seam. SMTP credentials are read only when an
// external mail adapter is configured; the support conversation remains the
// source of truth and no fake "sent" result is returned.
export async function notifySupportInbox(_notification: SupportNotification): Promise<{ sent: boolean }> {
  const configured = Boolean(
    process.env.SUPPORT_SMTP_HOST &&
    process.env.SUPPORT_SMTP_PORT &&
    process.env.SUPPORT_SMTP_USER &&
    process.env.SUPPORT_SMTP_PASSWORD &&
    process.env.SUPPORT_NOTIFICATION_TO,
  );
  if (!configured) return { sent: false };
  // SMTP transport is intentionally not enabled until an approved provider
  // and dependency are configured. In-app admin inbox remains authoritative.
  return { sent: false };
}
