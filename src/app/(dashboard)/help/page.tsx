'use client'
import { useState } from 'react'

const faqs = [
  {
    category: 'Getting Started',
    icon: '🚀',
    items: [
      {
        q: 'How do I log a new session?',
        a: 'Go to Sessions → click "+ Log session". Fill in the client, date, start/end time, and hourly rate. The charge is calculated automatically. You can also add notes about what was discussed.',
      },
      {
        q: 'How do I add a new client?',
        a: 'Go to Clients → click "+ Add client". Enter their name, email, phone, currency, and default hourly rate. Once added, they\'ll appear in all session and invoice dropdowns.',
      },
      {
        q: 'How do I generate an invoice?',
        a: 'Log your sessions first, then go to Invoices and use the generate invoice feature. The system pulls all unbilled sessions for a client and calculates the total automatically.',
      },
    ],
  },
  {
    category: 'Invoices & Payments',
    icon: '💳',
    items: [
      {
        q: 'How do I record a payment?',
        a: 'Open any invoice that has an outstanding balance. You\'ll see a yellow banner at the top with a "Record payment" button. Click it, enter the amount, payment method, and date.',
      },
      {
        q: 'How do I change an invoice status?',
        a: 'Open the invoice and click the status badge in the top right corner. A dropdown appears with all available statuses: Draft, Sent, Viewed, Paid, Overdue, Partial, Cancelled.',
      },
      {
        q: 'How do I download an invoice as PDF?',
        a: 'Open any invoice and click the "↓ Download PDF" button in the top right. This opens an HTML version of the invoice with your company info and terms & conditions. Use Cmd+P (Mac) or Ctrl+P (Windows) to save as PDF.',
      },
      {
        q: 'How do I send an invoice to a client?',
        a: 'Open the invoice and click "Send to [email]". The system sends a professional email via Resend. Make sure the client has an email address set — you can add it in the Clients page.',
      },
      {
        q: 'What do the invoice statuses mean?',
        a: 'Draft: not yet sent. Sent: emailed to client. Viewed: client has opened it. Paid: fully paid. Partial: partially paid. Overdue: past due date. Cancelled: void.',
      },
    ],
  },
  {
    category: 'Clients & Risk',
    icon: '👥',
    items: [
      {
        q: 'How is client risk calculated?',
        a: 'Each client gets a risk score from 0–100. Points are deducted for: overdue invoices (-25 each), high outstanding balance (-10 to -20), inactivity over 60 days (-10 to -20), and unbilled sessions (-10). 80+ = Good Standing, 60–79 = Needs Attention, below 60 = High Risk.',
      },
      {
        q: 'What does "Inactive" mean on a client card?',
        a: 'A client is flagged as inactive if their last session was more than 60 days ago. This is a signal to reach out and re-engage them. You\'ll see a re-engagement alert on their detail page.',
      },
      {
        q: 'What does the ⭐ repeat client badge mean?',
        a: 'A client is marked as a repeat client if they have 3 or more sessions logged. This helps you identify your most loyal and valuable clients at a glance.',
      },
      {
        q: 'How do I see a client\'s full history?',
        a: 'Click on any client card to open their 360° detail view. You\'ll see their risk score breakdown, all invoices, all sessions, payment history, contact info, and any re-engagement alerts.',
      },
    ],
  },
  {
    category: 'Analytics & Reports',
    icon: '📊',
    items: [
      {
        q: 'How does the AI forecast work?',
        a: 'The AI forecast looks at your last 3 months of revenue, calculates a monthly average, and detects whether your trend is growing, stable, or declining. It then projects forward 3, 6, or 12 months with a ±15% variance range.',
      },
      {
        q: 'How do I export my financial data?',
        a: 'Go to Analytics or Invoices and click "Export CSV" or "PDF Report". The CSV gives you a spreadsheet of all invoices. The PDF report is a formatted financial summary with charts and totals. Both show a preview before you download.',
      },
      {
        q: 'What is the collection rate?',
        a: 'Collection rate = (total collected ÷ total invoiced) × 100. A rate above 90% is excellent. The industry benchmark for professional services is 85%. ConsultFlow targets 95%.',
      },
      {
        q: 'What is the utilization rate?',
        a: 'Utilization rate = (billable hours ÷ total hours tracked) × 100. It tells you what percentage of your logged time has been invoiced. Above 80% is high, 60–80% is medium, below 60% is low.',
      },
    ],
  },
  {
    category: 'Automations',
    icon: '⚡',
    items: [
      {
        q: 'How do payment reminders work?',
        a: 'When an invoice is sent, the system schedules 4 automated reminders: 3 days, 7 days, 14 days, and 30 days after the due date. You can see all scheduled reminders on the Automations page.',
      },
      {
        q: 'How do I run all reminders at once?',
        a: 'Go to Automations → click "Run reminders". This sends all reminders that are currently due. Reminders that aren\'t due yet will stay scheduled for their future date.',
      },
      {
        q: 'Can I turn off automations?',
        a: 'Yes. Go to Settings → Automation tab → toggle the master automation switch off. This pauses all automated workflows. Individual workflows can also be paused independently.',
      },
      {
        q: 'What is the re-engagement automation?',
        a: 'When a client hasn\'t had a session in 60+ days, ConsultFlow flags them on the client detail page with a re-engagement alert and a button to send them a message to check if they\'d like to book another consultation.',
      },
    ],
  },
  {
    category: 'Settings & Account',
    icon: '⚙',
    items: [
      {
        q: 'How do I update my company information?',
        a: 'Go to Settings → Company tab. Update your company name, email, phone, address, and payment terms. This information appears on all invoices and reports.',
      },
      {
        q: 'How do I set my monthly revenue target?',
        a: 'Go to Settings → Billing & Targets tab. Enter your monthly revenue target. This number is used on the dashboard progress bar and in financial health calculations.',
      },
      {
        q: 'How do I change my password or email?',
        a: 'Go to Settings → Account tab. You\'ll find fields to update your email address and password. Changes take effect immediately after saving.',
      },
      {
        q: 'How do I sign out?',
        a: 'Click your initials (CW) in the top right corner on desktop, or in the profile menu on mobile. Click "Sign out". On desktop, you can also use the sign out button at the bottom of the sidebar.',
      },
    ],
  },
]

export default function HelpPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  function toggle(key: string) {
    const next = new Set(openItems)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setOpenItems(next)
  }

  const filtered = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat =>
    cat.items.length > 0 &&
    (!activeCategory || activeCategory === cat.category)
  )

  const totalFAQs = faqs.reduce((s, c) => s + c.items.length, 0)

  return (
    <div style={{ maxWidth: '760px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.4px' }}>Help Center</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: '14px', margin: 0 }}>
          {totalFAQs} answers to common questions · Can't find what you need? Contact support below.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--gray-300)' }}>🔍</span>
        <input
          type="text"
          placeholder="Search help articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          style={{ paddingLeft: '40px', fontSize: '14px', height: '46px' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'var(--gray-100)', border: 'none', borderRadius: '6px',
            padding: '3px 8px', fontSize: '12px', cursor: 'pointer', color: 'var(--gray-500)',
          }}>
            Clear
          </button>
        )}
      </div>

      {/* Category pills */}
      {!search && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button onClick={() => setActiveCategory(null)} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
            background: !activeCategory ? 'var(--primary)' : 'white',
            color: !activeCategory ? 'white' : 'var(--gray-600)',
            boxShadow: !activeCategory ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
            border: !activeCategory ? 'none' : '1px solid var(--border)' as any,
          }}>
            All topics
          </button>
          {faqs.map(cat => (
            <button key={cat.category} onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px',
                fontWeight: 600, border: activeCategory === cat.category ? 'none' : '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font)',
                background: activeCategory === cat.category ? 'var(--primary)' : 'white',
                color: activeCategory === cat.category ? 'white' : 'var(--gray-600)',
                boxShadow: activeCategory === cat.category ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
              }}>
              {cat.icon} {cat.category}
            </button>
          ))}
        </div>
      )}

      {/* Search results count */}
      {search && (
        <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginBottom: '16px' }}>
          {filtered.reduce((s, c) => s + c.items.length, 0)} results for "{search}"
        </p>
      )}

      {/* FAQ sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filtered.map(cat => (
          <div key={cat.category} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

            {/* Category header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{cat.icon}</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 1px' }}>{cat.category}</p>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>{cat.items.length} article{cat.items.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* FAQ items */}
            {cat.items.map((item, i) => {
              const key = `${cat.category}-${i}`
              const isOpen = openItems.has(key)
              return (
                <div key={key} style={{ borderBottom: i < cat.items.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <button onClick={() => toggle(key)} style={{
                    width: '100%', textAlign: 'left', padding: '16px 20px',
                    background: isOpen ? 'var(--primary-light)' : 'white',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '16px', transition: 'background 0.15s',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: isOpen ? 700 : 500, color: isOpen ? 'var(--primary)' : 'var(--gray-800)', flex: 1, lineHeight: 1.4 }}>
                      {item.q}
                    </span>
                    <span style={{ fontSize: '18px', color: isOpen ? 'var(--primary)' : 'var(--gray-300)', flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>+</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 20px 18px', background: 'var(--primary-light)' }}>
                      <div style={{ padding: '14px 16px', background: 'white', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '14px', color: 'var(--gray-700)', margin: 0, lineHeight: 1.7 }}>{item.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', background: 'white', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '4px' }}>No results found</p>
            <p style={{ fontSize: '14px', color: 'var(--gray-400)' }}>Try different keywords or browse by category</p>
          </div>
        )}
      </div>

      {/* Contact support */}
      <div style={{ marginTop: '32px', background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', borderRadius: '16px', padding: '28px', color: 'white', textAlign: 'center' }}>
        <p style={{ fontSize: '22px', marginBottom: '8px' }}>💬</p>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.3px' }}>Still need help?</h2>
        <p style={{ fontSize: '14px', opacity: 0.8, margin: '0 0 20px', lineHeight: 1.6 }}>
          Can't find the answer you're looking for? Our support team is here to help you get the most out of ConsultFlow.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="mailto:support@consultflow.app" style={{
            padding: '10px 22px', background: 'white', color: 'var(--primary)',
            borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}>
            ✉ Email support
          </a>
          <button style={{
            padding: '10px 22px', background: 'rgba(255,255,255,0.15)',
            color: 'white', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}>
            📖 View guides
          </button>
        </div>
      </div>

    </div>
  )
}