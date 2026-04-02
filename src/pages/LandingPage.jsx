import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="landingPage">
      <header className="landingTop">
        <span className="landingLogo">DISCIPLINE</span>
        <div className="landingTopActions">
          <Link to="/login" className="landingLink">
            Giriş yap
          </Link>
          <Link to="/signup" className="landingCta">
            Ücretsiz dene
          </Link>
        </div>
      </header>

      <section className="landingHero">
        <p className="landingKicker">Life / Performance OS</p>
        <h1 className="landingTitle">Kişisel gelişim ve performans için tek komuta merkezi</h1>
        <p className="landingLead">
          Protokoller, antrenman, beslenme ve takviye — modern, modüler panel. Disiplini ölçülebilir
          kıl.
        </p>
        <div className="landingHeroActions">
          <Link to="/signup" className="landingCta landingCtaLg">
            Hemen başla
          </Link>
          <a href="#pricing" className="landingGhost">
            Paketleri gör
          </a>
        </div>
        <div className="landingMock" aria-hidden="true">
          <div className="landingMockBar" />
          <div className="landingMockGrid">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="landingPricing" id="pricing">
        <h2 className="landingSectionTitle">Fiyatlandırma</h2>
        <p className="landingSectionSub">İhtiyacına göre yükselt. Ödeme entegrasyonu yakında.</p>
        <div className="landingPriceGrid">
          <article className="landingPriceCard">
            <h3>Free</h3>
            <p className="landingPriceAmt">0 ₺</p>
            <ul className="landingPriceList">
              <li>Panel ve protokoller</li>
              <li>Yerel / bulut senkron</li>
              <li>Antrenman günlüğü</li>
            </ul>
            <Link to="/signup" className="landingGhost landingPriceBtn">
              Başla
            </Link>
          </article>
          <article className="landingPriceCard landingPriceFeatured">
            <span className="landingBadge">Pro</span>
            <h3>Pro</h3>
            <p className="landingPriceAmt">Yakında</p>
            <ul className="landingPriceList">
              <li>Gelişmiş widget’lar</li>
              <li>Şablonlar ve overload</li>
              <li>Öncelikli özellikler</li>
            </ul>
            <Link to="/signup" className="landingCta landingPriceBtn">
              Listeye yazıl
            </Link>
          </article>
          <article className="landingPriceCard">
            <h3>Coach</h3>
            <p className="landingPriceAmt">Yakında</p>
            <ul className="landingPriceList">
              <li>Öğrenci panosu</li>
              <li>Program satışı</li>
              <li>Canlı takip</li>
            </ul>
            <Link to="/" className="landingGhost landingPriceBtn">
              İletişim
            </Link>
          </article>
        </div>
      </section>

      <footer className="landingFoot">
        <Link to="/login">Zaten hesabın var mı? Giriş yap</Link>
      </footer>
    </div>
  )
}
