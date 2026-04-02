import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'

export default function AuthForm({ onDone, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const disabled = loading || !email.trim() || password.length < 6

  const title = useMemo(() => {
    if (mode === 'signup') return 'Kayıt Ol'
    return 'Giriş Yap'
  }, [mode])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!supabase) {
      setError('Supabase ayarları eksik. `.env` dosyanı kontrol et.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (signUpError) throw signUpError
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
      }
      onDone?.()
    } catch (err) {
      setError(err?.message || 'Bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authCard">
      <h2 className="authTitle">{title}</h2>
      <p className="authSubtitle muted">
        Cihazlar arası senkron için hesabınla giriş yap.{' '}
        <Link to="/" className="textButton">
          Ürünü keşfet
        </Link>
      </p>

      <form className="authForm" onSubmit={submit}>
        <label className="authLabel">
          E-posta
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="ornek@mail.com"
          />
        </label>

        <label className="authLabel">
          Şifre (min 6 karakter)
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="••••••"
          />
        </label>

        {error ? <div className="authError">{error}</div> : null}

        <button className="button" type="submit" disabled={disabled}>
          {loading ? 'Bekle...' : title}
        </button>
      </form>

      <div className="authSwitch muted">
        {mode === 'signup' ? (
          <>
            Zaten hesabın var mı?{' '}
            <button className="textButton" type="button" onClick={() => setMode('signin')}>
              Giriş yap
            </button>
          </>
        ) : (
          <>
            Hesabın yok mu?{' '}
            <button className="textButton" type="button" onClick={() => setMode('signup')}>
              Kayıt ol
            </button>
          </>
        )}
      </div>
    </div>
  )
}

