import { Link } from 'react-router-dom'

export default function ComingSoonPage({ title, subtitle }) {
  return (
    <div className="dashComingSoon">
      <p className="dashComingSoonKicker">MONOLITH</p>
      <h2 className="dashComingSoonTitle">{title}</h2>
      <p className="dashComingSoonText">{subtitle || 'Bu bölüm yakında eklenecek.'}</p>
      <Link className="shellCta shellCtaGhost" to="/">
        Dashboard
      </Link>
    </div>
  )
}
