export default function ClientPage({ params }: { params: { id: string } }) {
  return <div><h1 style={{fontSize:"24px",fontWeight:600}}>Client {params.id}</h1></div>
}
