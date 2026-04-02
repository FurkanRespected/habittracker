import { useMemo } from 'react'
import { maxStreakAcrossHabits } from '../utils/dashboardUtils.js'

const LEADERBOARD = [
  { rank: '01', name: 'Sarah Bloom', xp: '9.420 XP', top: true },
  { rank: '02', name: 'David Miller', xp: '8.150 XP', top: false },
  { rank: '03', name: 'Elena K.', xp: '7.900 XP', top: false },
]

const FEED = [
  {
    icon: 'military_tech',
    fill: true,
    text: (
      <>
        <strong>SEN</strong> <span className="comFeedHl">Derin uyku</span> madalyasını kilitledin.
      </>
    ),
    time: '2 saat önce',
  },
  {
    icon: 'handshake',
    text: (
      <>
        <strong>Marcus</strong> disiplinini onayladı.
      </>
    ),
    time: '5 saat önce',
  },
  {
    icon: 'groups',
    text: (
      <>
        <strong>4. kohort</strong> toplam <strong>1.000+ saat</strong> tamamladı.
      </>
    ),
    time: '24 saat önce',
  },
]

export default function CommunityPage({ habits }) {
  const streak = useMemo(() => maxStreakAcrossHabits(habits), [habits])
  const secured = Math.min(12, habits?.length ?? 0)
  const totalMedals = 48
  const featuredTitle = streak >= 7 ? 'Erken kuş ustası' : 'Disiplin sancaktarı'
  const featuredBody =
    streak >= 7
      ? `${streak} gün üst üste operasyon. Alarmı yenen sensin.`
      : habits?.length
        ? `${habits.length} protokol aktif. Seriyi uzattıkça madalya seviyesi artar.`
        : 'İlk protokolünü ekleyerek operasyonu başlat.'

  return (
    <div className="comPage">
      <div className="comGrid">
        <section className="comMain">
          <div className="comMainHead">
            <div>
              <span className="comKicker">Operasyon kaydı</span>
              <h2 className="comTitle">Onur madalyaları</h2>
            </div>
            <div className="comMainMeta">
              <p className="comMetaLabel">Kazanılan birim</p>
              <p className="comMetaVal">
                {secured} <span className="comMetaSlash">/ {totalMedals}</span>
              </p>
            </div>
          </div>

          <div className="comMedalGrid">
            <div className="comMedalHero">
              <span className="material-symbols-outlined comMedalBgIco">military_tech</span>
              <div className="comMedalHeroBody">
                <div className="comMedalIcoWrap">
                  <span className="material-symbols-outlined comMedalIco">military_tech</span>
                </div>
                <h3 className="comMedalHeroTitle">{featuredTitle}</h3>
                <p className="comMedalHeroText">{featuredBody}</p>
                <div className="comMedalProgress">
                  <div className="comMedalProgHead">
                    <span>Ustalık</span>
                    <span>{streak >= 7 ? '100%' : `${Math.min(100, streak * 14)}%`}</span>
                  </div>
                  <div className="comMedalProgBar">
                    <div
                      className="comMedalProgFill"
                      style={{ width: `${streak >= 7 ? 100 : Math.min(100, streak * 14)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="comMedalCard">
              <span className="material-symbols-outlined comMedalCardIco">water_bottle</span>
              <h4 className="comMedalCardTitle">Hidrasyon</h4>
              <p className="comMedalCardSub">7 günlük hat</p>
              <div className="comMedalDots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="comMedalCard">
              <span className="material-symbols-outlined comMedalCardIco">bolt</span>
              <h4 className="comMedalCardTitle">7 günlük sıçrama</h4>
              <p className="comMedalCardSub">Momentum protokolü</p>
              <div className="comMedalDots" aria-hidden="true">
                <span />
                <span />
              </div>
            </div>

            {['Demir zihin', 'Titan güç', 'Sonsuz seri'].map((t, i) => (
              <div key={t} className="comMedalLocked">
                <span className="material-symbols-outlined">lock</span>
                <h4>{t}</h4>
                <p>{['10 meditasyon', '50 tekrar', '30 gün kilit'][i]}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="comAside">
          <div className="comBoard">
            <div className="comBoardHead">
              <h3>Demir kardeşlik</h3>
              <span className="comBoardTag">Sıralama</span>
            </div>
            <div className="comBoardList">
              {LEADERBOARD.map((row) => (
                <div key={row.rank} className={row.top ? 'comBoardRow comBoardRowTop' : 'comBoardRow'}>
                  <span className="comBoardRank">{row.rank}</span>
                  <div className="comBoardAvatar" aria-hidden="true" />
                  <div className="comBoardInfo">
                    <p className="comBoardName">{row.name}</p>
                    <p className={row.top ? 'comBoardXp comBoardXpTop' : 'comBoardXp'}>{row.xp}</p>
                  </div>
                  {row.top ? (
                    <span className="material-symbols-outlined comBoardStar">star</span>
                  ) : null}
                </div>
              ))}
            </div>
            <button type="button" className="comBoardCta">
              Tam kadroyu gör
            </button>
          </div>

          <div className="comFeed">
            <h3>İstihbarat akışı</h3>
            <p className="comFeedNote">
              Örnek içerik. Canlı feed için <code>community_posts</code> tablosu (şema) kullanılacak.
            </p>
            <div className="comFeedList">
              {FEED.map((item, i) => (
                <div key={i} className="comFeedItem">
                  <div className={item.fill ? 'comFeedIco comFeedIcoOn' : 'comFeedIco'}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <p className="comFeedText">{item.text}</p>
                    <p className="comFeedTime">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <button type="button" className="comFab" aria-label="Konsol">
        <span className="material-symbols-outlined">terminal</span>
      </button>
    </div>
  )
}
