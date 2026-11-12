/* =========================================================
   CONFIGURAÇÕES — edite só este bloco
   ========================================================= */

// Link do vídeo de apresentação (MP4/WebM). Ex.: "assets/apresentacao.mp4"
const VIDEO_URL = "assets/apresentacao.mp4";
// Capa do vídeo antes de dar play (opcional). Ex.: "assets/capa-apresentacao.jpg"
const VIDEO_POSTER = "assets/apresentacao.jpg";

// Fim da Black Friday (horário de Brasília). Depois dessa hora, selos, contagem e "de R$ 197" somem sozinhos.
const BLACK_FRIDAY_FIM = "2026-11-25T23:59:59-03:00";

// Links de checkout da Cakto de cada plano.
const PLANOS = {
  manual: "https://pay.cakto.com.br/qzj3yyy_1301898",
  completo: "https://pay.cakto.com.br/36kmwmy_1297578",
  youtube: "https://pay.cakto.com.br/pi4rjbf_1301908",
};

// Carrossel de resultados: vídeos verticais (9:16) na pasta assets.
const VIDEOS = [
  { views: "7,3 mi", label: "o mistério do número 3", src: "assets/v-numero3.mp4", poster: "assets/v-numero3.jpg" },
  { views: "534 mil", label: "o homem que viveu 969 anos", src: "assets/v-matusalem.mp4", poster: "assets/v-matusalem.jpg" },
  { views: "490 mil", label: "os dois Judas", src: "assets/v-judas.mp4", poster: "assets/v-judas.jpg" },
];

/* ========================================================= */

document.documentElement.classList.add("js");

// Botões dos planos: só aceita https; sem link, ficam na seção de planos.
function setupCheckout() {
  document.querySelectorAll(".js-plano").forEach((a) => {
    const url = PLANOS[a.dataset.plano];
    if (!/^https:\/\//i.test(url || "")) return console.warn(`Link do plano "${a.dataset.plano}" vazio ou inválido.`);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
  });
}

// Contagem regressiva da Black Friday; nos últimos 3 dias ganha destaque.
function setupCountdown() {
  const fim = new Date(BLACK_FRIDAY_FIM).getTime();
  const els = [...document.querySelectorAll(".js-countdown")];
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const ms = fim - Date.now();
    if (!(ms > 0)) { document.querySelectorAll(".js-bf").forEach((el) => (el.hidden = true)); return clearInterval(timer); }
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    const txt = `${d > 0 ? `${d}d ` : ""}${pad(h)}h ${pad(m)}m ${pad(s % 60)}s`;
    els.forEach((el) => { el.querySelector(".js-cd-time").textContent = txt; el.classList.toggle("is-urgent", d < 3); });
  };
  const timer = setInterval(tick, 1000);
  tick();
}

function setupPlayer() {
  const box = document.querySelector(".player");
  const video = box.querySelector("video");
  const play = box.querySelector(".player__play");
  if (!VIDEO_URL) return; // continua com o placeholder "em breve"

  video.src = VIDEO_URL;
  if (VIDEO_POSTER) video.poster = VIDEO_POSTER;
  box.dataset.state = "ready";
  play.disabled = false;

  // Sem barra de controles: clicar no vídeo (ou no botão) só reproduz/pausa.
  const toggle = () => (video.paused ? video.play().catch(() => {}) : video.pause());
  play.addEventListener("click", toggle);
  video.addEventListener("click", toggle);
  video.addEventListener("play", () => {
    box.dataset.state = "playing";
    play.setAttribute("aria-label", "Pausar vídeo de apresentação");
  });
  video.addEventListener("pause", () => {
    box.dataset.state = "ready";
    play.setAttribute("aria-label", "Reproduzir vídeo de apresentação");
  });
}

const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

// Carrossel: o da frente toca mudo em loop; arrastar ou tocar num de trás traz ele pra frente.
function setupPhones() {
  const box = document.querySelector(".js-phones");
  const snd = box.querySelector(".js-snd");
  const sndLabel = snd.querySelector("span");
  const dotsBox = box.querySelector(".js-dots");
  const hero = document.querySelector(".player__video");

  box.insertAdjacentHTML("afterbegin", VIDEOS.map((v, i) => `
    <div class="phone" aria-label="Vídeo ${i + 1}: ${v.label}, ${v.views} de views">
      <video src="${v.src}" poster="${v.poster}" muted loop playsinline preload="none"></video>
      <span class="phone__views">${EYE}<b>${v.views}</b>&nbsp;views</span>
      <span class="phone__lab">${v.label}</span>
    </div>`).join(""));
  dotsBox.innerHTML = VIDEOS.map((v, i) => `<button type="button" aria-label="Mostrar vídeo ${i + 1}: ${v.label}"></button>`).join("");

  const phones = [...box.querySelectorAll(".phone")];
  const videos = phones.map((p) => p.querySelector("video"));
  const dots = [...dotsBox.children];
  const n = phones.length;
  let cur = 0, sound = false, visible = false;

  const sync = () => {
    videos.forEach((v, k) => {
      v.muted = !(sound && k === cur);
      if (k === cur && visible) v.play().catch(() => {});
      else v.pause();
    });
    snd.setAttribute("aria-pressed", sound);
    sndLabel.textContent = sound ? "som ligado" : "toque para ouvir";
  };
  const setSound = (on) => {
    sound = on;
    if (on) { videos[cur].currentTime = 0; if (hero) hero.pause(); }
    sync();
  };
  const go = (i) => {
    cur = (i + n) % n;
    phones.forEach((p, k) => {
      const d = (k - cur + n) % n;
      p.className = "phone " + (d === 0 ? "pos-c" : d === 1 ? "pos-r" : d === n - 1 ? "pos-l" : "pos-h");
    });
    dots.forEach((d, k) => d.setAttribute("aria-current", k === cur));
    if (sound) videos[cur].currentTime = 0;
    sync();
  };

  snd.addEventListener("click", () => setSound(!sound));
  dots.forEach((d, k) => d.addEventListener("click", () => go(k)));
  if (hero) hero.addEventListener("play", () => setSound(false)); // nunca dois áudios ao mesmo tempo

  let sx = null, sy = 0;
  box.addEventListener("pointerdown", (e) => { if (!e.target.closest(".phones__ctrl")) { sx = e.clientX; sy = e.clientY; } });
  box.addEventListener("pointercancel", () => { sx = null; });
  box.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) return go(cur + (dx < 0 ? 1 : -1));
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) return;
    const k = phones.indexOf(e.target.closest(".phone"));
    if (k === -1) return;
    k === cur ? setSound(!sound) : go(k);
  });

  // Só baixa e toca quando o carrossel está na tela.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe(box);
  } else visible = true;
  go(0);
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach((el) => io.observe(el));
}

// CTA fixo no celular: aparece depois do botão do herói e some na oferta.
function setupStickyCta() {
  const bar = document.querySelector(".sticky-cta");
  const hero = document.querySelector(".hero__cta");
  const offer = document.querySelector("#comece-agora");
  if (!("IntersectionObserver" in window)) return;
  const seen = { hero: true, offer: false };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { seen[e.target === hero ? "hero" : "offer"] = e.isIntersecting; });
    const on = !seen.hero && !seen.offer && hero.getBoundingClientRect().top < 0;
    bar.classList.toggle("is-on", on);
  });
  io.observe(hero);
  io.observe(offer);
}

document.querySelector(".js-year").textContent = new Date().getFullYear();
setupPhones();
setupCheckout();
setupCountdown();
setupPlayer();
setupReveal();
setupStickyCta();
