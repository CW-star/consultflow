import { Resend } from 'resend'

export async function sendInvoiceEmail({
  to, clientName, invoiceNumber, amount, dueDate, pdfUrl, currency
}: {
  to: string, clientName: string, invoiceNumber: string
  amount: number, dueDate: string, pdfUrl: string, currency: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send({
    from: 'Your Name <invoices@yourdomain.com>',
    to,
    subject: `Invoice ${invoiceNumber} — $${amount} ${currency} due ${dueDate}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
        <h2 style="font-size:20px;font-weight:600;color:#111827;margin:0 0 8px">
          Invoice ${invoiceNumber}
        </h2>
        <p style="color:#6b7280;margin:0 0 32px">Hi ${clientName},</p>
        <p style="color:#374151;line-height:1.6;margin:0 0 24px">
          Please find your invoice for recent consulting work. Payment of
          <strong>$${amount} ${currency}</strong> is due by <strong>${dueDate}</strong>.
        </p>
        <a href="${pdfUrl}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;margin-bottom:32px">
          View & download invoice
        </a>
        <p style="color:#9ca3af;font-size:13px;border-top:1px solid #f3f4f6;padding-top:24px;margin:0">
          Questions? Reply to this email.
        </p>
      </div>
    `,
  })
}

export async function sendReminderEmail({
  to, clientName, invoiceNumber, amount, dueDate, daysOverdue, currency, pdfUrl
}: {
  to: string, clientName: string, invoiceNumber: string
  amount: number, dueDate: string, daysOverdue: number, currency: string, pdfUrl: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const isOverdue = daysOverdue > 0
  const urgency = daysOverdue >= 14 ? 'urgent' : 'friendly'

  return resend.emails.send({
    from: 'Your Name <invoices@yourdomain.com>',
    to,
    subject: isOverdue
      ? `[${urgency === 'urgent' ? 'ACTION REQUIRED' : 'Reminder'}] Invoice ${invoiceNumber} is ${daysOverdue} days overdue`
      : `Friendly reminder: Invoice ${invoiceNumber} due ${dueDate}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
        ${isOverdue ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#991b1b;font-size:14px">
          Invoice ${invoiceNumber} is <strong>${daysOverdue} days overdue</strong>
        </div>` : ''}
        <p style="color:#374151;line-height:1.6;margin:0 0 24px">
          Hi ${clientName},<br><br>
          ${isOverdue
            ? `This is a reminder that invoice ${invoiceNumber} for <strong>$${amount} ${currency}</strong> was due on ${dueDate}.`
            : `Just a friendly reminder that invoice ${invoiceNumber} for <strong>$${amount} ${currency}</strong> is due on ${dueDate}.`
          }
        </p>
        <a href="${pdfUrl}" style="display:inline-block;background:${isOverdue ? '#dc2626' : '#1e40af'};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">
          View invoice
        </a>
      </div>
    `,
  })
}