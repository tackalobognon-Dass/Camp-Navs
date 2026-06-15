// Parse un fichier LRC en tableau de lignes horodatées
// Format : [mm:ss.xx] texte
// Section : [mm:ss.xx] ## Refrain  ou  ## Couplet 1

export function parseLRC(lrc) {
  if (!lrc || !lrc.trim()) return []
  const result = []
  for (const line of lrc.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = trimmed.match(/^\[(\d{1,2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/)
    if (match) {
      const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3].padEnd(3,'0').slice(0,3)) / 1000
      const text = match[4].trim()
      if (text) result.push({ time, text })
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

// Retourne l'index de la ligne courante
export function getCurrentIdx(lines, currentTime) {
  if (!lines.length) return -1
  let idx = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) idx = i
    else break
  }
  return idx
}

// Opacité selon la distance avec la ligne courante
export function getOpacity(lineIdx, currentIdx) {
  const d = Math.abs(lineIdx - currentIdx)
  if (d === 0) return 1
  if (d === 1) return 0.45
  if (d === 2) return 0.28
  return 0.15
}

// Est-ce une ligne de section ?
export function isSection(text)      { return text.startsWith('##') }
export function sectionLabel(text)   { return text.replace(/^##\s*/, '').trim() }

// Couleur d'une section selon son label
export function sectionColor(label) {
  const l = label.toLowerCase()
  if (l.includes('refrain') || l.includes('chorus')) return { color: '#C9A84C', bg: 'rgba(201,168,76,0.1)' }
  if (l.includes('pont') || l.includes('bridge'))    return { color: '#6D28D9', bg: 'rgba(109,40,217,0.06)' }
  return { color: '#94A3B8', bg: 'transparent' }
}
