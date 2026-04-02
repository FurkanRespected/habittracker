/** @param {number} h 0–23 */
function timeBucket(h) {
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

const ANY_TIME = [
  'Hoş geldin.',
  'Disiplinle aran nasıl?',
  'Komuta panelinde tek bakışta hazırsın.',
  'Ritim sende; ekran sadece ayna.',
  'Bugün de çizgiyi koruyan sensin.',
]

const BY_BUCKET = {
  morning: [
    'Günaydın, komutan.',
    'Sabahın berrak olsun; güne disiplinle başla.',
    'Erken kalkan hatayı erken görür — iyi sabahlar.',
    'Gün ilk protokolle açılır.',
  ],
  afternoon: [
    'İyi öğlenler.',
    'Öğleden sonra da ritmi bırakma.',
    'Mola değil, hatırlatma: hedef hâlâ aynı.',
    'Günün ikinci yarısı da senin.',
  ],
  evening: [
    'İyi akşamlar.',
    'Günü güçlü kapat.',
    'Akşam rutini de protokolün parçası.',
    'Bugünü onurlandır, yarın rahat uyu.',
  ],
  night: [
    'Gece çalışanı değil, tutarlı olanı sever.',
    'Geç olmadan uyu; yarın sahada olursun.',
    'Dinlenme de disiplinin parçası.',
    'Kaliteli uyku, yarının hacmidir.',
  ],
}

/**
 * Rastgele bir karşılama (sayfa/yerleşim açılışında bir kez seçilir).
 * @param {Date} [now]
 * @returns {string}
 */
export function pickPanelGreeting(now = new Date()) {
  const bucket = timeBucket(now.getHours())
  const pool = [...ANY_TIME, ...BY_BUCKET[bucket]]
  const i = Math.floor(Math.random() * pool.length)
  return pool[i]
}
