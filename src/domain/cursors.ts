export type StyleGroup = 'colors' | 'anime' | 'games' | 'creative'
export type CompanionGroup = 'animals' | 'magical'
export interface StyleDef { id: string; name: string; blurb: string; group: StyleGroup; art: string; hot: [number, number]; compact?: boolean }
export interface CompanionDef { id: string; name: string; blurb: string; group: CompanionGroup; art: string }
export interface CursorSel { arrow: string; companion: string }

export const STYLE_GROUPS: { id: StyleGroup; label: string }[] = [{ id: 'colors', label: 'Colors' }, { id: 'anime', label: 'Anime' }, { id: 'games', label: 'Games' }, { id: 'creative', label: 'Creative' }]
export const COMPANION_GROUPS: { id: CompanionGroup; label: string }[] = [{ id: 'animals', label: 'Animals' }, { id: 'magical', label: 'Magical & fun' }]

const K = '#2b2b2b'
const ln = `stroke="${K}" stroke-width="1.2" stroke-linejoin="round"`
const th = `stroke="${K}" stroke-width=".9" stroke-linejoin="round"`
const eyes = (c = K) => `<circle cx="17.5" cy="20" r="1.3" fill="${c}"/><circle cx="24.5" cy="20" r="1.3" fill="${c}"/>`

const ARROW_D = 'M2 2v15l4-3.6 2.8 6 2.7-1.3-2.8-5.8 5.3-.3z'
const PIX = 'M3 2h2v2h2v2h2v2h2v2h2v2H9v2H7v2H5v2H3z'
const pix = (fill: string, line: string, defs = '') => `${defs}<path d="${PIX}" fill="${fill}" stroke="${line}" stroke-width="1.2" stroke-linejoin="miter"/><rect x="3.6" y="3.2" width="1.1" height="3.2" fill="#fff" opacity=".65"/>`
const sm = (fill: string, line: string, extra = '', defs = '') => `${defs}<path d="${ARROW_D}" fill="${fill}" stroke="${line}" stroke-width="1.3" stroke-linejoin="round"/>${extra}`
const grad = (id: string, stops: string[]) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${Math.round((i / (stops.length - 1)) * 100)}%" stop-color="${c}"/>`).join('')}</linearGradient></defs>`
/** Tools are drawn pointing straight up with the tip at (16,1), then turned so the tip lands on the click point near the top-left. */
const tool = (inner: string) => `<g transform="translate(-3.4 -3.4) rotate(-45 16 16)">${inner}</g>`
const dot = (cx: number, cy: number, r: number, f: string) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`
const petals = [0, 72, 144, 216, 288].map(a => `<ellipse cx="20" cy="5.6" rx="1.6" ry="2.4" transform="rotate(${a} 20 8)" fill="#ff9ec1" stroke="#c2527f" stroke-width=".4"/>`).join('') + dot(20, 8, 1.1, '#ffd54a')

export const STYLES: StyleDef[] = [
  { id: 'classic', name: 'Classic', blurb: 'Smooth white arrow', group: 'colors', hot: [2, 2], art: sm('#fff', K) },
  { id: 'pixel', name: 'Pixel', blurb: 'Retro white pixel arrow', group: 'colors', hot: [2, 2], art: pix('#fff', K) },
  { id: 'px-pink', name: 'Pixel pink', blurb: 'Bubblegum pixels', group: 'colors', hot: [2, 2], art: pix('#ff8fc0', '#5b2145') },
  { id: 'px-mint', name: 'Pixel mint', blurb: 'Fresh mint', group: 'colors', hot: [2, 2], art: pix('#7ee8c7', '#14493c') },
  { id: 'px-gold', name: 'Pixel gold', blurb: 'Shiny gold', group: 'colors', hot: [2, 2], art: pix('#ffd54a', '#5a3d00') },
  { id: 'px-grape', name: 'Pixel grape', blurb: 'Purple pop', group: 'colors', hot: [2, 2], art: pix('#b388ff', '#2e1a5e') },
  { id: 'px-lava', name: 'Lava', blurb: 'Hot orange to red', group: 'colors', hot: [2, 2], art: pix('url(#g1)', '#3a0d10', grad('g1', ['#ffd166', '#ff7b00', '#e63946'])) },
  { id: 'px-ice', name: 'Ice', blurb: 'Frosty blue', group: 'colors', hot: [2, 2], art: pix('url(#g2)', '#123a5c', grad('g2', ['#f0fbff', '#8fd3ff', '#4aa3ff'])) },
  { id: 'px-rainbow', name: 'Rainbow', blurb: 'Every colour at once', group: 'colors', hot: [2, 2], art: pix('url(#g3)', K, grad('g3', ['#ff5d5d', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#b197fc'])) },
  { id: 'px-neon', name: 'Neon night', blurb: 'Dark with a cyan glow', group: 'colors', hot: [2, 2], art: `<path d="${PIX}" fill="#16163a" stroke="#7df9ff" stroke-width="1.4" stroke-linejoin="miter"/><rect x="3.6" y="3.2" width="1.1" height="3.2" fill="#ff7ad9"/>` },
  { id: 'sm-bubble', name: 'Bubblegum', blurb: 'Glossy pink', group: 'colors', hot: [2, 2], art: sm('#ff9ecb', '#8a2a5c', '<path d="M3.8 4.8v7.2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".75"/>') },
  { id: 'sm-sunset', name: 'Sunset', blurb: 'Gold, coral, violet', group: 'colors', hot: [2, 2], art: sm('url(#g4)', '#5a1b4a', '', grad('g4', ['#ffd36e', '#ff7e67', '#c850c0'])) },
  { id: 'sm-ocean', name: 'Ocean', blurb: 'Aqua to deep blue', group: 'colors', hot: [2, 2], art: sm('url(#g5)', '#0b3a5c', '', grad('g5', ['#9ff3ff', '#3aa0ff', '#2a4bd7'])) },
  { id: 'sm-lemon', name: 'Lemon', blurb: 'Sunny yellow', group: 'colors', hot: [2, 2], art: sm('#fff176', '#6b5b00', '<path d="M3.8 4.8v7.2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>') },
  { id: 'sm-galaxy', name: 'Galaxy', blurb: 'Deep purple with stars', group: 'colors', hot: [2, 2], art: sm('#2a1a5e', '#c9b6ff', `${dot(5, 8, .7, '#fff')}${dot(7.8, 10.5, .6, '#ffd1f5')}${dot(4.5, 13.2, .6, '#9ff3ff')}${dot(8.5, 7.2, .5, '#fff')}`) },

  { id: 'an-kawaii', name: 'Kawaii', blurb: 'A happy little face', group: 'anime', hot: [2, 2], art: sm('#ffc2dd', '#8a2a5c', `${dot(5.2, 10.5, .85, K)}${dot(8.6, 10.5, .85, K)}<path d="M5.8 12.2q1.2 1.100 2.200 0" fill="none" stroke="${K}" stroke-width=".8" stroke-linecap="round"/>${dot(4.2, 12, 1, '#ff7aa8').replace('/>', ' opacity=".6"/>')}${dot(9.8, 12, 1, '#ff7aa8').replace('/>', ' opacity=".6"/>')}`) },
  { id: 'an-chibi', name: 'Chibi eyes', blurb: 'Big shiny anime eyes', group: 'anime', hot: [2, 2], art: sm('#fff', '#5a3a7a', `<ellipse cx="5.4" cy="9.8" rx="1.5" ry="2" fill="#5a3a7a"/><ellipse cx="9" cy="9.8" rx="1.5" ry="2" fill="#5a3a7a"/>${dot(5, 9, .6, '#fff')}${dot(8.6, 9, .6, '#fff')}${dot(4.4, 12.6, .9, '#ff9ec1').replace('/>', ' opacity=".7"/>')}${dot(10, 12.6, .9, '#ff9ec1').replace('/>', ' opacity=".7"/>')}`) },
  { id: 'an-sakura', name: 'Sakura', blurb: 'Cherry blossom arrow', group: 'anime', hot: [2, 2], art: sm('#ffe3ee', '#c2527f', petals) },
  { id: 'an-sparkle', name: 'Shoujo sparkle', blurb: 'Dreamy shine', group: 'anime', hot: [2, 2], art: sm('#fff', '#4aa3ff', `<path d="M20 4l1.100 2.900L24 8l-2.900 1.100L20 12l-1.100-2.900L16 8l2.900-1.100z" fill="#8fd3ff" stroke="#4aa3ff" stroke-width=".5"/>${dot(26, 13, .9, '#ffd1f5')}${dot(17, 14, .7, '#9ff3ff')}`) },
  { id: 'an-kunai', name: 'Kunai', blurb: 'Ninja throwing knife', group: 'anime', hot: [2, 2], art: tool(`<path d="M16 1l4.200 9.500L16 19l-4.200-8.500z" fill="#cfd8e3" stroke="${K}" stroke-width="1" stroke-linejoin="round"/><path d="M16 3v14" stroke="#8fa0b5" stroke-width=".7"/><rect x="14.700" y="19" width="2.600" height="7" fill="#37474f" stroke="${K}" stroke-width=".8"/><path d="M14.700 21h2.600M14.700 23h2.600" stroke="#90a4ae" stroke-width=".6"/><circle cx="16" cy="28.500" r="2.400" fill="none" stroke="${K}" stroke-width="1.300"/>`), compact: true },
  { id: 'an-wand', name: 'Magic wand', blurb: 'Star wand for spells', group: 'anime', hot: [2, 2], art: tool(`<rect x="14.800" y="13" width="2.400" height="18" rx="1.200" fill="#ff9ecb" stroke="#8a2a5c" stroke-width=".9"/><path d="M16 1l2.300 4.900 5.300.7-3.900 3.700 1 5.300L16 13l-4.700 2.600 1-5.300L8.400 6.600l5.300-.7z" fill="#ffd54a" stroke="#8a2a5c" stroke-width=".9" stroke-linejoin="round"/>`), compact: true },
  { id: 'an-katana', name: 'Katana', blurb: 'Samurai blade', group: 'anime', hot: [2, 2], art: tool(`<path d="M16 1l2 20h-4z" fill="#e8eef5" stroke="${K}" stroke-width="1" stroke-linejoin="round"/><ellipse cx="16" cy="22.500" rx="4.500" ry="1.600" fill="#e6b34a" stroke="${K}" stroke-width=".9"/><rect x="14.600" y="24" width="2.800" height="7" rx=".8" fill="#3b2a4f" stroke="${K}" stroke-width=".8"/><path d="M14.600 26l2.800 2M17.400 26l-2.800 2" stroke="#ff5d73" stroke-width=".8"/>`), compact: true },

  { id: 'g-gold', name: 'Ancient gold', blurb: 'Dark metal, golden trim', group: 'games', hot: [2, 2], art: sm('#2a1c10', '#e6b34a', `<circle cx="5.2" cy="12.500" r="1.300" fill="#e03a3a" stroke="#e6b34a" stroke-width=".6"/><path d="M4 4.500v4" stroke="#e6b34a" stroke-width=".8" stroke-linecap="round"/>`) },
  { id: 'g-light', name: 'Light side', blurb: 'Green and gold', group: 'games', hot: [2, 2], art: sm('#8fe388', '#1d4d1c', dot(5.2, 12.5, 1.1, '#fff6a8')) },
  { id: 'g-dark', name: 'Dark side', blurb: 'Crimson and ash', group: 'games', hot: [2, 2], art: sm('#ff6b57', '#4a0f0a', dot(5.2, 12.5, 1.1, '#2b0a08')) },
  { id: 'g-blade', name: 'Broadsword', blurb: 'Steel blade, golden guard', group: 'games', hot: [2, 2], art: tool(`<path d="M16 1l3 5v14h-6V6z" fill="#cfd8e3" stroke="${K}" stroke-width="1" stroke-linejoin="round"/><path d="M16 4v16" stroke="#8fa0b5" stroke-width=".7"/><rect x="9" y="20" width="14" height="2.600" rx="1" fill="#e6b34a" stroke="${K}" stroke-width=".9"/>${dot(16, 21.3, 1.1, '#e03a3a')}<rect x="14.800" y="22.600" width="2.400" height="6" fill="#5b3a1e" stroke="${K}" stroke-width=".8"/>${dot(16, 30, 1.6, '#e6b34a')}`), compact: true },
  { id: 'g-energy', name: 'Energy blade', blurb: 'Glowing laser sword', group: 'games', hot: [2, 2], art: tool(`<rect x="13.500" y="1" width="5" height="19" rx="2.500" fill="#7df9ff" opacity=".45"/><rect x="14.700" y="1.800" width="2.600" height="18" rx="1.300" fill="#e8ffff" stroke="#00bcd4" stroke-width=".8"/><rect x="13.800" y="20" width="4.400" height="10" rx="1" fill="#546e7a" stroke="${K}" stroke-width=".9"/><path d="M13.800 23h4.400M13.800 26h4.400" stroke="#cfd8dc" stroke-width=".7"/>`), compact: true },
  { id: 'g-blaster', name: 'Blaster', blurb: 'Toy ray gun, aim with the nozzle', group: 'games', hot: [2, 2], art: tool(`<rect x="14.200" y="1" width="3.600" height="12" rx="1.400" fill="#b0bec5" ${th}/><rect x="13.500" y="1" width="5" height="2.500" rx="1" fill="#ff7043" ${th}/><rect x="11" y="12" width="10" height="10" rx="3" fill="#4dd0e1" ${th}/>${dot(16, 17, 1.8, '#fff59d')}<path d="M13 22h6v8h-6z" fill="#00838f" ${th}/>`), compact: true },
  { id: 'g-crosshair', name: 'Crosshair', blurb: 'Sniper-style, click point is the centre', group: 'games', hot: [16, 16], compact: true, art: `<g fill="none" stroke-linecap="round"><circle cx="16" cy="16" r="8" stroke="${K}" stroke-width="3.400"/><path d="M16 3v7M16 22v7M3 16h7M22 16h7" stroke="${K}" stroke-width="3.400"/><circle cx="16" cy="16" r="8" stroke="#fff" stroke-width="1.500"/><path d="M16 3v7M16 22v7M3 16h7M22 16h7" stroke="#fff" stroke-width="1.500"/></g>${dot(16, 16, 1.500, '#e03a3a')}` },

  { id: 'c-book', name: 'Open book', blurb: 'Click point is the top-left corner', group: 'creative', hot: [3, 4], compact: true, art: `<path d="M2 5q7-2.500 12 .8v17Q9 20 2 22z" fill="#fff8e1" ${ln}/><path d="M14 5.800q5-3.300 12-.8v17q-7-2-12 1.800z" fill="#fff3d0" ${ln}/><path d="M4.500 9q4-1 7 .6M4.500 12.500q4-1 7 .6M4.500 16q4-1 7 .6M16.500 9.600q3-1.600 7-.6M16.500 13.100q3-1.600 7-.6" fill="none" stroke="#c9a56a" stroke-width=".8" stroke-linecap="round"/><path d="M2 22q7-2 12 1.800 5-3.800 12-1.800" fill="none" stroke="#b5483a" stroke-width="1.800" stroke-linecap="round"/>` },
  { id: 'c-pencil', name: 'Pencil', blurb: 'Write wherever you click', group: 'creative', hot: [2, 2], art: tool(`<path d="M16 1l3 7h-6z" fill="#f1c9a0" ${th}/><path d="M16 1l1 2.500h-2z" fill="#37474f"/><rect x="13" y="8" width="6" height="17" fill="#ffd54a" ${th}/><path d="M16 8v17" stroke="#f9a825" stroke-width=".8"/><rect x="13" y="25" width="6" height="2.500" fill="#b0bec5" ${th}/><rect x="13" y="27.500" width="6" height="3.500" rx="1.200" fill="#ff8fa3" ${th}/>`), compact: true },
  { id: 'c-quill', name: 'Quill', blurb: 'Old-school feather pen', group: 'creative', hot: [2, 2], art: tool(`<path d="M16 8C25 11 25 23 16 31 7 23 7 11 16 8z" fill="#b2ebf2" ${th}/><path d="M16 8v22" stroke="${K}" stroke-width=".8"/><path d="M16 14l5-2M16 18l6-2M16 22l5-2M16 14l-5-2M16 18l-6-2M16 22l-5-2" stroke="#4db6c4" stroke-width=".6"/><path d="M16 1l1.800 7h-3.600z" fill="#37474f" ${th}/>`), compact: true },
  { id: 'c-rocket', name: 'Rocket', blurb: 'Launch into your work', group: 'creative', hot: [2, 2], art: tool(`<path d="M16 1c5 4 6 10 5 17H11c-1-7 0-13 5-17z" fill="#fff" ${th}/><path d="M16 1c2 1.600 3.300 3.800 4 6h-8c.7-2.200 2-4.400 4-6z" fill="#ff5252" ${th}/><circle cx="16" cy="11.500" r="2.400" fill="#4fc3f7" ${th}/><path d="M11 14l-4 7 4-1zM21 14l4 7-4-1z" fill="#ff5252" ${th}/><path d="M13 18h6l-3 8z" fill="#ffb300" ${th}/>`), compact: true },
]

export const COMPANIONS: CompanionDef[] = [
  { id: 'cat', name: 'Kitty', blurb: 'Orange tabby', group: 'animals', art: `<path d="M12 14 13 5l6 5zM30 14 29 5l-6 5z" fill="#f2994a" ${ln}/><circle cx="21" cy="21" r="9.500" fill="#f6a85c" ${ln}/>${eyes()}<path d="M20 23.500h2l-1 1.300z" fill="#e86f8a"/><path d="M13 23l-4-1M13 25l-4 1M29 23l4-1M29 25l4 1" stroke="${K}" stroke-width=".9" stroke-linecap="round"/>` },
  { id: 'dog', name: 'Puppy', blurb: 'Floppy-eared pup', group: 'animals', art: `<ellipse cx="12" cy="20" rx="3.600" ry="7" fill="#8b5a2b" ${ln}/><ellipse cx="30" cy="20" rx="3.600" ry="7" fill="#8b5a2b" ${ln}/><circle cx="21" cy="21" r="9" fill="#e7b877" ${ln}/>${eyes()}<ellipse cx="21" cy="24" rx="2.600" ry="1.800" fill="${K}"/><path d="M21 25.800v1.600" stroke="${K}" stroke-width=".9"/>` },
  { id: 'capybara', name: 'Capybara', blurb: 'Chill, with a yuzu on its head', group: 'animals', art: `<ellipse cx="14" cy="14.500" rx="2.200" ry="1.800" fill="#8f5f36" ${th}/><ellipse cx="26" cy="14.500" rx="2.200" ry="1.800" fill="#8f5f36" ${th}/><rect x="10.500" y="15" width="21" height="14" rx="7" fill="#b98550" ${ln}/><ellipse cx="25.500" cy="24" rx="5.500" ry="4" fill="#a2713f" ${th}/><circle cx="24" cy="23.500" r=".7" fill="${K}"/><circle cx="27" cy="23.500" r=".7" fill="${K}"/><path d="M14.500 21q1.500 1.400 3 0M20 21q1.500 1.400 3 0" fill="none" stroke="${K}" stroke-width="1" stroke-linecap="round"/><circle cx="21" cy="12.500" r="3.300" fill="#ffb627" ${th}/><path d="M21 9.300q1.800-1.600 3.200-.6-1 1.800-3.200.6z" fill="#6cc04a" ${th}/>` },
  { id: 'fox', name: 'Fox', blurb: 'Clever orange fox', group: 'animals', art: `<path d="M12 15 13 5l6 5zM30 15 29 5l-6 5z" fill="#e8742a" ${ln}/><path d="M11.500 19a9.500 9 0 0119 0c0 5-4 9.500-9.500 9.500S11.500 24 11.500 19z" fill="#f08a3c" ${ln}/><path d="M13 23.500q8-4 16 0-3 5.500-8 5.500t-8-5.500z" fill="#fff"/>${eyes()}<circle cx="21" cy="26" r="1.300" fill="${K}"/>` },
  { id: 'owl', name: 'Owl', blurb: 'Wise night owl', group: 'animals', art: `<path d="M12 14 13 6l5 4zM30 14 29 6l-5 4z" fill="#8d6e63" ${ln}/><ellipse cx="21" cy="22" rx="9.500" ry="9" fill="#a1887f" ${ln}/><circle cx="17" cy="20.500" r="3.600" fill="#fff" ${th}/><circle cx="25" cy="20.500" r="3.600" fill="#fff" ${th}/><circle cx="17" cy="20.500" r="1.500" fill="${K}"/><circle cx="25" cy="20.500" r="1.500" fill="${K}"/><path d="M19.500 24h3l-1.500 2.800z" fill="#ffb300" ${th}/>` },
  { id: 'penguin', name: 'Penguin', blurb: 'Waddling buddy', group: 'animals', art: `<circle cx="21" cy="21" r="9.500" fill="#37474f" ${ln}/><ellipse cx="21" cy="23" rx="6.600" ry="6" fill="#fff"/>${eyes()}<path d="M19 23.500h4l-2 2.800z" fill="#ff9800" ${th}/>` },
  { id: 'duck', name: 'Duckling', blurb: 'Tiny yellow duck', group: 'animals', art: `<path d="M19.500 11.500q1.500-3.200 3.500 0" fill="none" stroke="${K}" stroke-width="1.100" stroke-linecap="round"/><circle cx="21" cy="21" r="9.500" fill="#ffe14d" ${ln}/>${eyes()}<ellipse cx="21" cy="25" rx="4.500" ry="2.600" fill="#ff9800" ${th}/>` },
  { id: 'bear', name: 'Bear', blurb: 'Cuddly brown bear', group: 'animals', art: `<circle cx="13" cy="13.500" r="3.500" fill="#8f5f36" ${ln}/><circle cx="29" cy="13.500" r="3.500" fill="#8f5f36" ${ln}/><circle cx="21" cy="21" r="9.500" fill="#a9744a" ${ln}/><ellipse cx="21" cy="24.500" rx="4.500" ry="3.500" fill="#e6c29a"/>${eyes()}<ellipse cx="21" cy="23.500" rx="1.600" ry="1.100" fill="${K}"/>` },
  { id: 'panda', name: 'Panda', blurb: 'Round and calm', group: 'animals', art: `<circle cx="13" cy="13.500" r="3.600" fill="${K}"/><circle cx="29" cy="13.500" r="3.600" fill="${K}"/><circle cx="21" cy="21" r="9.500" fill="#fff" ${ln}/><ellipse cx="17" cy="20" rx="2.400" ry="3" fill="${K}" transform="rotate(-18 17 20)"/><ellipse cx="25" cy="20" rx="2.400" ry="3" fill="${K}" transform="rotate(18 25 20)"/>${dot(17.2, 19.6, .9, '#fff')}${dot(24.8, 19.6, .9, '#fff')}<ellipse cx="21" cy="24" rx="1.800" ry="1.200" fill="${K}"/>` },
  { id: 'bunny', name: 'Bunny', blurb: 'Soft, tall ears', group: 'animals', art: `<ellipse cx="16" cy="9" rx="2.800" ry="7" fill="#fff" ${ln}/><ellipse cx="26" cy="9" rx="2.800" ry="7" fill="#fff" ${ln}/><ellipse cx="16" cy="9.500" rx="1.200" ry="4.500" fill="#f7b6c8"/><ellipse cx="26" cy="9.500" rx="1.200" ry="4.500" fill="#f7b6c8"/><circle cx="21" cy="22" r="9" fill="#fff" ${ln}/>${eyes()}<path d="M20 24.400h2l-1 1.200z" fill="#e86f8a"/>` },
  { id: 'frog', name: 'Froggy', blurb: 'Cheerful green frog', group: 'animals', art: `<circle cx="14" cy="13" r="4.200" fill="#7ccf6b" ${ln}/><circle cx="28" cy="13" r="4.200" fill="#7ccf6b" ${ln}/>${dot(14, 13, 1.5, K)}${dot(28, 13, 1.5, K)}<ellipse cx="21" cy="22" rx="10" ry="8.500" fill="#8fdc7d" ${ln}/><path d="M15.500 24.500q5.500 4 11 0" fill="none" stroke="${K}" stroke-width="1.100" stroke-linecap="round"/>${dot(18.5, 20.5, .8, K)}${dot(23.5, 20.5, .8, K)}` },
  { id: 'axolotl', name: 'Axolotl', blurb: 'Smiling pink axolotl', group: 'animals', art: `<path d="M13 17L9 14M12.500 20.500H8.500M13 24l-4 3M29 17l3-3M29.500 20.500h3M29 24l3 3" stroke="#ff7aa8" stroke-width="2" stroke-linecap="round"/><circle cx="21" cy="21" r="8.500" fill="#ffc2d9" ${ln}/>${dot(17.500, 19.500, 1.200, K)}${dot(24.500, 19.500, 1.200, K)}<path d="M18 23q3 2.500 6 0" fill="none" stroke="${K}" stroke-width="1" stroke-linecap="round"/>${dot(15.500, 22.500, 1.100, '#ff7aa8').replace('/>', ' opacity=".5"/>')}${dot(26.500, 22.500, 1.100, '#ff7aa8').replace('/>', ' opacity=".5"/>')}` },
  { id: 'ghost', name: 'Ghost', blurb: 'Friendly night ghost', group: 'magical', art: `<path d="M11.500 29V20a9.500 9.500 0 0119 0v9l-3.200-2.400-3.100 2.400-3.200-2.400-3.100 2.400-3.200-2.400z" fill="#f4f1ff" ${ln}/><ellipse cx="17.500" cy="20.500" rx="1.300" ry="1.900" fill="${K}"/><ellipse cx="24.500" cy="20.500" rx="1.300" ry="1.900" fill="${K}"/><ellipse cx="21" cy="24.500" rx="1.400" ry="1.100" fill="${K}"/>` },
  { id: 'slime', name: 'Slime', blurb: 'Bouncy teal slime', group: 'magical', art: `<path d="M21 11C25 15 31 18 31 24c0 4-4.500 6-10 6s-10-2-10-6c0-6 6-9 10-13z" fill="#7be0c3" ${ln}/>${dot(17.500, 23, 1.300, K)}${dot(24.500, 23, 1.300, K)}<path d="M19 26q2 1.500 4 0" fill="none" stroke="${K}" stroke-width="1" stroke-linecap="round"/><ellipse cx="16" cy="19" rx="1.400" ry="2.200" fill="#fff" opacity=".6" transform="rotate(-25 16 19)"/>` },
  { id: 'mushroom', name: 'Mushroom', blurb: 'Tiny forest friend', group: 'magical', art: `<rect x="16" y="20" width="10" height="9" rx="3" fill="#fff3e0" ${ln}/><path d="M10 20a11 10 0 0122 0z" fill="#e53935" ${ln}/>${dot(15, 15.500, 1.700, '#fff')}${dot(22, 12.500, 1.900, '#fff')}${dot(27, 16.500, 1.500, '#fff')}${dot(19, 24, .8, K)}${dot(23, 24, .8, K)}<path d="M20 26q1 1 2 0" fill="none" stroke="${K}" stroke-width=".8" stroke-linecap="round"/>` },
  { id: 'paw', name: 'Paw print', blurb: 'A tiny cat paw', group: 'magical', art: `<g fill="#f6a85c" ${ln}><ellipse cx="21" cy="25" rx="5.800" ry="4.800"/><ellipse cx="13.500" cy="19" rx="2.300" ry="3"/><ellipse cx="18" cy="14.500" rx="2.300" ry="3"/><ellipse cx="24.500" cy="14.500" rx="2.300" ry="3"/><ellipse cx="29" cy="19" rx="2.300" ry="3"/></g><ellipse cx="21" cy="25.500" rx="3" ry="2.300" fill="#f7b6c8"/>` },
  { id: 'star', name: 'Star', blurb: 'A little magic', group: 'magical', art: `<path d="M21 9l3.200 6.900 7.500.9-5.500 5.200 1.500 7.400L21 25.700l-6.700 3.700 1.500-7.400-5.500-5.200 7.500-.9z" fill="#ffd54a" ${ln}/>${dot(29, 9, 1.200, '#ffd54a')}${dot(12, 27, .9, '#ffd54a')}` },
  { id: 'heart', name: 'Heart', blurb: 'Warm and simple', group: 'magical', art: `<path d="M21 29C10 22 11 12.500 17 12.500c2.300 0 3.400 1.400 4 2.600.6-1.200 1.700-2.600 4-2.600 6 0 7 9.500-4 16.500z" fill="#ff7a9c" ${ln}/><ellipse cx="16.500" cy="16.500" rx="1.500" ry="2.200" fill="#fff" opacity=".7" transform="rotate(-30 16.500 16.500)"/>` },
]

export const DEFAULT_SEL: CursorSel = { arrow: 'classic', companion: 'cat' }
export const styleOf = (id: string) => STYLES.find(s => s.id === id) ?? STYLES[0]
export const companionOf = (id: string) => COMPANIONS.find(c => c.id === id)

/** Older saved prefs stored a single `id`; map it onto the two-part choice. */
export function migrateCursor(c: any): CursorSel {
  if (c?.arrow) return { arrow: styleOf(c.arrow).id === c.arrow ? c.arrow : 'classic', companion: c.companion === 'none' || companionOf(c.companion) ? c.companion : 'none' }
  const id: string | undefined = c?.id
  if (id && STYLES.some(s => s.id === id)) return { arrow: id, companion: 'none' }
  if (id === 'px-neon' || id === 'sm-bubble' || id === 'sm-galaxy') return { arrow: id, companion: 'none' }
  const legacy: Record<string, string> = { 'sm-kawaii': 'an-kawaii' }
  if (id && legacy[id]) return { arrow: legacy[id], companion: 'none' }
  if (id && companionOf(id)) return { arrow: 'classic', companion: id }
  return { ...DEFAULT_SEL }
}

const SPARK = `<path d="M26 2l1 2.500 2.500 1-2.500 1-1 2.500-1-2.500-2.500-1 2.500-1z" fill="#ffd54a" stroke="${K}" stroke-width=".6"/>`
const wrap = (inner: string, px: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 32 32">${inner}</svg>`
const headArt = (sel: CursorSel) => {
  const c = companionOf(sel.companion); if (!c) return ''
  return styleOf(sel.arrow).compact ? `<g transform="translate(8 8) scale(.75)">${c.art}</g>` : c.art
}
const dataUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`

export const companionImage = (id: string, px = 48) => { const c = companionOf(id); return c ? dataUri(wrap(c.art, px)) : '' }

export const cursorImage = (sel: CursorSel, pointer = false, px = 32) => dataUri(wrap(`${headArt(sel)}${styleOf(sel.arrow).art}${pointer ? SPARK : ''}`, px))

/** Separate layers for the live cursor: the pointer tip stays exact while the companion trails behind it. */
export function cursorLayers(sel: CursorSel, pointer: boolean, px: number) {
  const s = styleOf(sel.arrow), h = headArt(sel)
  return { head: h ? dataUri(wrap(h, px)) : '', tip: dataUri(wrap(`${s.art}${pointer ? SPARK : ''}`, px)), hot: [Math.round(s.hot[0] * px / 32), Math.round(s.hot[1] * px / 32)] as [number, number] }
}

export const INTERACTIVE = 'a[href], button:not(:disabled), summary, select, label[for], [role="button"], [role="tab"], [role="radio"], [role="switch"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="color"], input[type="file"]'

export function cursorCss(sel: CursorSel, size: 'normal' | 'large'): string {
  const px = size === 'large' ? 48 : 32, [hx, hy] = styleOf(sel.arrow).hot.map(v => Math.round(v * px / 32))
  const norm = `url("${cursorImage(sel, false, px)}") ${hx} ${hy}, auto`
  const ptr = `url("${cursorImage(sel, true, px)}") ${hx} ${hy}, pointer`
  return `@media (hover: hover) and (pointer: fine) { html[data-cursor], html[data-cursor] body { cursor: ${norm}; } html[data-cursor] :is(${INTERACTIVE}) { cursor: ${ptr}; } }`
}
