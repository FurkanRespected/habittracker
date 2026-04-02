import { useCallback, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  applyImportBundle,
  buildExportBundle,
  downloadJson,
  readJsonFile,
} from '../utils/dataExportUtils.js'

export default function SettingsPage({ hasCloud, exportHabits, sessionEmail, appearance }) {
  const { prefs, patch } = appearance
  const importInputRef = useRef(null)
  const [importNote, setImportNote] = useState({ text: '', kind: '' })

  const runExport = useCallback(() => {
    const bundle = buildExportBundle({
      habits: exportHabits,
      sessionEmail,
      hasCloud,
    })
    const d = new Date()
    const stamp = d.toISOString().slice(0, 10)
    downloadJson(`habitracker-icerik-${stamp}.json`, bundle)
  }, [exportHabits, sessionEmail, hasCloud])

  const onPickImport = useCallback(() => {
    setImportNote({ text: '', kind: '' })
    importInputRef.current?.click()
  }, [])

  const onImportFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setImportNote({ text: '', kind: '' })
      try {
        const data = await readJsonFile(file)
        const result = applyImportBundle(data)
        if (!result.ok) {
          setImportNote({ text: result.error, kind: 'err' })
          return
        }
        const summary = result.applied.length ? result.applied.join(', ') : 'yalnızca yerel protokol listesi'
        setImportNote({
          text: `Tamam: ${summary}. Sayfa yenileniyor…`,
          kind: 'ok',
        })
        window.setTimeout(() => window.location.reload(), 500)
      } catch (err) {
        setImportNote({
          text: err?.message || 'JSON okunamadı veya dosya bozuk.',
          kind: 'err',
        })
      }
    },
    [],
  )

  return (
    <div className="profPage">
      <header className="profHead">
        <p className="profKicker">TERCIHLER</p>
        <h1 className="profTitle">Ayarlar</h1>
        <p className="profSub">
          Görünüm ve bildirim tercihleri bu cihazda saklanır. Panel kartları da tarayıcıda yerel
          olarak tutulur.
        </p>
      </header>

      <section className="profCard">
        <h2 className="profCardTitle">Panel</h2>
        <p className="profMuted">
          Düzenleme modunda sıra (tutamaç), <strong>sağ kenardan sürükleyerek</strong> 1–12 sütun
          genişliği, ikonla önayar döngüsü ve protokol için iki satır yüksekliği yönetilir. Dengeli
          yerleşim için{' '}
          <Link to="/panel?editPanel=1" className="textButton">
            Panel → Paneli düzenle
          </Link>{' '}
          içinde <strong>Referans bento</strong> (tam sıfırlama: <strong>Sıfırla (tam)</strong>).
        </p>
      </section>

      <section className="profCard">
        <h2 className="profCardTitle">Görünüm</h2>
        <ul className="settingsWidgetList">
          <li>
            <label className="settingsWidgetRow">
              <span>Hareketleri azalt (animasyonları kısalt)</span>
              <input
                type="checkbox"
                checked={prefs.reduceMotion}
                onChange={(e) => patch({ reduceMotion: e.target.checked })}
              />
            </label>
          </li>
          <li>
            <label className="settingsWidgetRow">
              <span>Kompakt boşluklar (profil / ayar kartları)</span>
              <input
                type="checkbox"
                checked={prefs.compactDensity}
                onChange={(e) => patch({ compactDensity: e.target.checked })}
              />
            </label>
          </li>
        </ul>
      </section>

      <section className="profCard">
        <h2 className="profCardTitle">Bildirimler</h2>
        <p className="profMuted" style={{ marginBottom: '1rem' }}>
          Gerçek anlık bildirim henüz yok; tercih ileride kullanılmak üzere kaydedilir.
        </p>
        <label className="settingsWidgetRow">
          <span>Ürün ipuçları ve güncellemeler (gelecek özellik)</span>
          <input
            type="checkbox"
            checked={prefs.notifyProductTips}
            onChange={(e) => patch({ notifyProductTips: e.target.checked })}
          />
        </label>
      </section>

      <section className="profCard">
        <h2 className="profCardTitle">Genel</h2>
        <p className="profMuted">
          {hasCloud
            ? 'Protokoller ve işaretler hesabınla senkron. Takviye ve beslenme kayıtları da bulutta.'
            : 'Yerel kayıtta çalışıyorsun; protokoller bu tarayıcıda. Senkron için Supabase `.env` ayarla.'}
        </p>
      </section>

      <section className="profCard">
        <h2 className="profCardTitle">Veri</h2>
        <p className="profMuted" style={{ marginBottom: '1rem' }}>
          İndirilen dosyada ekranda gördüğün protokoller, bu cihazdaki antrenman günlüğü, panel
          görünümü ve görünüm tercihleri yer alır. Buluttaki takviye / beslenme tablolarının tam
          yedeği bu dosyada olmayabilir; gerekirse Supabase konsolundan ayrıca dışa aktarım yap.
        </p>
        {hasCloud ? (
          <p className="profMuted" style={{ marginBottom: '1rem' }}>
            <strong>Oturum açıkken</strong> protokol listesi sunucudan gelir; içe aktarılan protokoller
            yine de bu tarayıcıdaki yerel <code className="settingsCode">habits</code> kaydına yazılır
            (cihaz yedekleme / ileride oturumsuz kullanım için). Buluta otomatik yükleme yok.
          </p>
        ) : null}
        <div className="settingsDataActions">
          <button type="button" className="button" onClick={runExport}>
            JSON indir
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="settingsFileInput"
            onChange={onImportFile}
          />
          <button type="button" className="button buttonGhost" onClick={onPickImport}>
            JSON içe aktar
          </button>
        </div>
        {importNote.text ? (
          <p
            className={`settingsImportNote${importNote.kind === 'err' ? ' isError' : ''}${importNote.kind === 'ok' ? ' isOk' : ''}`}
          >
            {importNote.text}
          </p>
        ) : null}
      </section>

      <p className="profMuted">
        <NavLink to="/profile" className="textButton">
          ← Profil&apos;e dön
        </NavLink>
      </p>
    </div>
  )
}
