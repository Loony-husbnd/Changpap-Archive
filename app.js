const $ = s => document.querySelector(s);
const grid = $('#grid'), tagsEl = $('#tags'), q = $('#q'), sortEl = $('#sort');
const wrap = $('#player-wrap'), video = $('#video');
let all = [], activeTag = null, current = null, ab = {a: null, b: null};

const fmt = s => {
  s = Math.round(s || 0);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
};
const enc = p => p.split('/').map(encodeURIComponent).join('/');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function init() {
  try {
    all = await (await fetch('videos.json', {cache: 'no-cache'})).json();
  } catch { all = []; }
  render();
  window.addEventListener('hashchange', route);
  route();
}

function render() {
  const tagSet = [...new Set(all.flatMap(v => v.tags || []))].sort();
  tagsEl.innerHTML = tagSet.map(t => `<button class="tag${t === activeTag ? ' on' : ''}" data-t="${esc(t)}">#${esc(t)}</button>`).join('');
  const kw = q.value.trim().toLowerCase();
  let list = all.filter(v =>
    (!activeTag || (v.tags || []).includes(activeTag)) &&
    (!kw || [v.title, v.artist, ...(v.tags || [])].join(' ').toLowerCase().includes(kw)));
  const s = sortEl.value;
  list.sort(s === 'title' ? (a, b) => a.title.localeCompare(b.title, 'ko')
          : s === 'long' ? (a, b) => b.duration - a.duration
          : (a, b) => (b.added || 0) - (a.added || 0));
  grid.innerHTML = list.map(v => `
    <a class="card" href="#${encodeURIComponent(v.id)}">
      <div class="thumb" style="${v.thumb ? `background-image:url('${enc(v.thumb)}')` : ''}"><span class="dur">${fmt(v.duration)}</span></div>
      <div class="t"><h3>${esc(v.title)}</h3><small>${esc(v.artist || '')}</small></div>
    </a>`).join('');
  const empty = $('#empty');
  empty.hidden = list.length > 0;
  empty.textContent = all.length ? '검색 결과가 없습니다.' : '아직 영상이 없습니다.\nvideos/ 폴더에 영상을 넣고 python3 scripts/build.py 를 실행하세요.';
}

function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  const v = all.find(x => x.id === id);
  if (!v) { closePlayer(); return; }
  current = v; resetAB();
  video.src = /^https?:/.test(v.file) ? encodeURI(v.file) : enc(v.file);
  $('#p-title').textContent = v.title;
  $('#p-meta').textContent = [v.artist, fmt(v.duration), (v.tags || []).map(t => '#' + t).join(' ')].filter(Boolean).join(' · ');
  document.title = v.title + ' · 창팝 아카이브';
  wrap.hidden = false;
  scrollTo({top: 0, behavior: 'smooth'});
  video.play().catch(() => {});
}
function closePlayer() {
  video.pause(); video.removeAttribute('src'); video.load();
  wrap.hidden = true; current = null; document.title = '창팝 아카이브';
}

// A-B 구간반복
function resetAB() { ab = {a: null, b: null}; updAB(); }
function updAB() {
  const btn = $('#ab');
  btn.classList.toggle('on', ab.a != null);
  $('#ab-state').textContent = ab.a == null ? '' : `A ${fmt(ab.a)}${ab.b != null ? ' → B ' + fmt(ab.b) : ' (B 지정 대기)'}`;
}
function toggleAB() {
  if (ab.a == null) ab.a = video.currentTime;
  else if (ab.b == null) { ab.b = video.currentTime; if (ab.b <= ab.a) ab = {a: ab.b, b: ab.a}; video.currentTime = ab.a; }
  else ab = {a: null, b: null};
  updAB();
}
video.addEventListener('timeupdate', () => {
  if (ab.a != null && ab.b != null && video.currentTime >= ab.b) video.currentTime = ab.a;
});
$('#ab').onclick = toggleAB;
$('#rate').onchange = e => video.playbackRate = +e.target.value;
$('#loop').onchange = e => video.loop = e.target.checked;
$('#mirror').onchange = e => video.classList.toggle('mirror', e.target.checked);
video.addEventListener('loadedmetadata', () => { video.playbackRate = +$('#rate').value; });

// 단축키
const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
function setRate(d) {
  const i = Math.max(0, Math.min(RATES.length - 1, RATES.indexOf(video.playbackRate) + d));
  $('#rate').value = RATES[i]; video.playbackRate = RATES[i];
}
addEventListener('keydown', e => {
  if (wrap.hidden || e.target.matches('input[type=search],select') || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(), fps = 1 / 30;
  const act = {
    ' ': () => video.paused ? video.play() : video.pause(),
    k: () => video.paused ? video.play() : video.pause(),
    arrowleft: () => video.currentTime -= 5, arrowright: () => video.currentTime += 5,
    j: () => video.currentTime -= 10, l: () => video.currentTime += 10,
    ',': () => { video.pause(); video.currentTime -= fps; }, '.': () => { video.pause(); video.currentTime += fps; },
    '[': () => setRate(-1), ']': () => setRate(1),
    m: () => video.muted = !video.muted,
    f: () => document.fullscreenElement ? document.exitFullscreen() : video.requestFullscreen(),
    a: toggleAB,
    escape: () => { location.hash = ''; },
  }[k];
  if (act) { e.preventDefault(); act(); }
});

tagsEl.onclick = e => { const t = e.target.dataset.t; if (!t) return; activeTag = activeTag === t ? null : t; render(); };
q.oninput = sortEl.onchange = render;
init();
