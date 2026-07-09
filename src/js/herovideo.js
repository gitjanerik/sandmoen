// Hero-bakgrunnsvideo: start pauset, med play/pause-toggle (trekant / to streker).
(() => {
  const hero = document.querySelector('.hero-video');
  const pp = document.querySelector('.hero-playpause');
  if (!hero || !pp) return;
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 5v14l11-7z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
  const sync = () => {
    const playing = !hero.paused;
    pp.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    pp.setAttribute('aria-label', playing ? 'Pause bakgrunnsvideo' : 'Spill av bakgrunnsvideo');
  };
  // Husk brukerens valg mellom besøk.
  const KEY = 'sandmoen:hero-video';
  const savePref = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  const readPref = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };

  pp.addEventListener('click', () => {
    if (hero.paused) { savePref('playing'); hero.play().catch(() => {}); }
    else { savePref('paused'); hero.pause(); }
  });
  hero.addEventListener('play', sync);
  hero.addEventListener('pause', sync);
  sync();

  // Autospill (muted) som standard, men respekter «redusert bevegelse» og lagret valg.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pref = readPref();
  const wantPlay = pref ? pref === 'playing' : !reduceMotion;
  if (wantPlay) hero.play().catch(() => {});
})();
