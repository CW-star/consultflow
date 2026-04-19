'use client'

export default function DownloadPDFButton({ invoiceId, invoiceNumber }: {
  invoiceId: string
  invoiceNumber: string
}) {
  function handleDownload() {
    window.open(`/api/invoices/pdf?id=${invoiceId}`, '_blank')
  }

  return (
    <button onClick={handleDownload} style={{
      background: 'white', color: '#374151', border: '1px solid #e5e7eb',
      padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
      fontWeight: 500, cursor: 'pointer', display: 'flex',
      alignItems: 'center', gap: '6px',
    }}>
      ↓ Download PDF
    </button>
  )
}