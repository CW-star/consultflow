import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '@/lib/utils'

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  logo: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1e40af' },
  invoiceLabel: { fontSize: 28, color: '#e5e7eb', fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  section: { marginBottom: 24 },
  label: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 11, color: '#111827' },
  table: { marginTop: 24 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: '8 12', borderRadius: 4 },
  tableRow: { flexDirection: 'row', padding: '10 12', borderBottom: '0.5px solid #f3f4f6' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  totals: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, marginBottom: 4 },
  totalLabel: { fontSize: 10, color: '#6b7280' },
  totalValue: { fontSize: 10, color: '#111827' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', width: 200, marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb' },
  grandLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  grandValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1e40af' },
  footer: { position: 'absolute', bottom: 48, left: 48, right: 48, textAlign: 'center', color: '#9ca3af', fontSize: 9 },
})

export function InvoicePDF({ invoice, client, sessions, consultant }: {
  invoice: any, client: any, sessions: any[], consultant: string
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{consultant}</Text>
            <Text style={{ color: '#6b7280', marginTop: 4 }}>Independent Consultant</Text>
          </View>
          <Text style={styles.invoiceLabel}>INVOICE</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
          <View style={styles.section}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={{ ...styles.value, fontFamily: 'Helvetica-Bold' }}>{client.name}</Text>
            {client.email && <Text style={{ ...styles.value, color: '#6b7280' }}>{client.email}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Invoice number</Text>
            <Text style={styles.value}>{invoice.invoice_number}</Text>
            <Text style={{ ...styles.label, marginTop: 12 }}>Issue date</Text>
            <Text style={styles.value}>{formatDate(invoice.issue_date)}</Text>
            <Text style={{ ...styles.label, marginTop: 12 }}>Due date</Text>
            <Text style={{ ...styles.value, color: '#ef4444' }}>{formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.col1, fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#6b7280' }}>DESCRIPTION</Text>
            <Text style={{ ...styles.col2, fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#6b7280' }}>MINS</Text>
            <Text style={{ ...styles.col3, fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#6b7280' }}>AMOUNT</Text>
          </View>
          {sessions.map((s, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text>{formatDate(s.date)} — {s.notes || 'Consulting session'}</Text>
                <Text style={{ color: '#6b7280', fontSize: 9, marginTop: 2 }}>
                  {s.start_time && s.end_time ? `${s.start_time} – ${s.end_time} ` : ''} @ ${s.hourly_rate}/hr
                </Text>
              </View>
              <Text style={styles.col2}>{s.total_time_mins}</Text>
              <Text style={styles.col3}>{formatCurrency(s.charge, client.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal, client.currency)}</Text>
          </View>
          {invoice.tax_rate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount, client.currency)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatCurrency(invoice.total_amount, client.currency)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={{ marginTop: 40, padding: 16, backgroundColor: '#f9fafb', borderRadius: 4 }}>
            <Text style={styles.label}>Notes</Text>
            <Text style={{ ...styles.value, color: '#6b7280' }}>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Payment due within {client.payment_terms_days || 14} days. Thank you for your business.
        </Text>
      </Page>
    </Document>
  )
}