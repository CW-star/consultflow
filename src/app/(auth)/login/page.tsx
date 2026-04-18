'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else if (data.session) {
      window.location.href = '/'
    } else {
      setError('Sign in succeeded but no session. Check email confirmation settings in Supabase.')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f9fafb'}}>
      <div style={{background:'white',padding:'2rem',borderRadius:'12px',border:'1px solid #e5e7eb',width:'360px'}}>
        <h1 style={{fontSize:'20px',fontWeight:600,marginBottom:'8px'}}>ConsultFlow</h1>
        <p style={{color:'#6b7280',fontSize:'14px',marginBottom:'24px'}}>
          {isSignUp ? 'Create your account' : 'Sign in'}
        </p>
        {error && <p style={{color:'#ef4444',fontSize:'14px',marginBottom:'16px'}}>{error}</p>}
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <input type="email" placeholder="Email" value={email}
            onChange={e=>setEmail(e.target.value)}
            style={{padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'14px'}} required/>
          <input type="password" placeholder="Password" value={password}
            onChange={e=>setPassword(e.target.value)}
            style={{padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'14px'}} required/>
          <button type="submit" disabled={loading}
            style={{padding:'10px',background:'#1e40af',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:500,cursor:'pointer'}}>
            {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>
        <button onClick={()=>setIsSignUp(!isSignUp)}
          style={{marginTop:'16px',background:'none',border:'none',color:'#6b7280',fontSize:'14px',cursor:'pointer',width:'100%'}}>
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}