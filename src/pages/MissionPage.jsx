import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MissionPage({ onAddHabit }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')

  async function submit(e) {
    e.preventDefault()
    const t = name.trim()
    if (!t) return
    try {
      await Promise.resolve(onAddHabit(t))
      navigate('/')
    } catch {
      /* Supabase hatası üst katmanda authError ile gösterilebilir */
    }
  }

  return (
    <div className="misWrap">
      <main className="misCard">
        <section className="misFormSide">
          <header className="misHead">
            <div className="misHeadRow">
              <span className="material-symbols-outlined misShield">shield</span>
              <h1 className="misTitle">Görev ata</h1>
            </div>
            <p className="misSub">
              Tutarlılıkla mükemmelliği döv. Yeni protokolünü kaydet.
            </p>
          </header>

          <form className="misForm" onSubmit={submit}>
            <div className="misFieldRow">
              <div className="misField">
                <label htmlFor="mis-obj">Görev hedefi</label>
                <input
                  id="mis-obj"
                  className="misInput"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="örn. 05:00 uyan"
                  autoComplete="off"
                />
              </div>
              <div className="misField misFieldIcon">
                <span className="misLbl">Simge</span>
                <button type="button" className="misIconBtn" aria-label="Simge">
                  <span className="material-symbols-outlined">bolt</span>
                </button>
              </div>
            </div>

            <div className="misField">
              <span className="misLbl">Operasyon sıklığı</span>
              <div className="misPills">
                <button type="button" className="misPill misPillOn">
                  Günlük
                </button>
                <button type="button" className="misPill">
                  Haftalık
                </button>
                <button type="button" className="misPill">
                  Stratejik
                </button>
              </div>
            </div>

            <div className="misGrid2">
              <div className="misField">
                <label htmlFor="mis-int">Yoğunluk</label>
                <div className="misInputWrap">
                  <input id="mis-int" className="misInput" type="number" defaultValue={1} min={1} />
                  <span className="misSuffix">tekrar / gün</span>
                </div>
              </div>
              <div className="misField">
                <label htmlFor="mis-time">Hatırlatıcı (isteğe bağlı)</label>
                <input id="mis-time" className="misInput" type="time" defaultValue="05:00" />
              </div>
            </div>

            <div className="misActions">
              <button type="submit" className="misCommit">
                Göreve bağlan
              </button>
              <button type="button" className="misAbort" onClick={() => navigate(-1)}>
                Vazgeç
              </button>
            </div>
          </form>
        </section>

        <aside className="misAside">
          <span className="misStatus">Durum: başlatılıyor</span>
          <div className="misPreview">
            <div className="misPreviewTop">
              <div className="misPreviewIco">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div className="misPreviewStat">
                <span className="misPreviewNum">0/1</span>
                <span className="misPreviewLbl">Tamamlandı</span>
              </div>
            </div>
            <h3 className="misPreviewTitle">{name.trim() || 'Yeni protokol'}</h3>
            <div className="misPreviewBar">
              <div className="misPreviewFill" />
            </div>
            <div className="misPreviewFoot">
              <span className="material-symbols-outlined">military_tech</span>
              <span>Yeni protokol</span>
            </div>
          </div>
          <div className="misQuote">
            <h2>Zor seçimler, kolay hayat.</h2>
            <div className="misQuoteLine" />
            <p>“Disiplin, hedef ile başarı arasındaki köprüdür.”</p>
          </div>
        </aside>
      </main>
    </div>
  )
}
