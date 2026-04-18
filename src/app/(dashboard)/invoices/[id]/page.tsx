export default function InvoicePage({ params }: { params: { id: string } }) {
  return <div><h1 style={{fontSize:"24px",fontWeight:600}}>Invoice {params.id}</h1></div>
}
