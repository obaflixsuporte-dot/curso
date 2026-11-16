/* =========================================================
   CONFIGURAÇÕES — edite só este bloco
   ========================================================= */

// Link de checkout da aula (R$ 47) na nova plataforma de pagamento.
// Vazio = botões levam à oferta e mostram "pagamento em configuração". Não publique sem preencher.
const CHECKOUT_URL = "";

// Vídeo do topo. Quando o novo vídeo de vendas ficar pronto, troque src/poster e a legenda.
// vertical: true para 9:16 (celular), false para 16:9.
const VIDEO_TOPO = {
  src: "assets/v-numero3.mp4",
  poster: "assets/v-numero3.jpg",
  vertical: true,
  legenda: "Vídeo real do nosso perfil: 7,3 mi de visualizações",
};

// Carrossel de resultados: vídeos verticais (9:16) na pasta assets. Use só números comprovados.
const VIDEOS = [
  { views: "7,3 mi", label: "o mistério do número 3", src: "assets/v-numero3.mp4", poster: "assets/v-numero3.jpg" },
  { views: "534 mil", label: "o homem que viveu 969 anos", src: "assets/v-matusalem.mp4", poster: "assets/v-matusalem.jpg" },
  { views: "490 mil", label: "os dois Judas", src: "assets/v-judas.mp4", poster: "assets/v-judas.jpg" },
];

// Medição (opcional). Com um ID preenchido, aparece o aviso de cookies e a ferramenta só carrega após "Aceitar".
const GA4_ID = ""; // ex.: "G-XXXXXXXXXX"

/* ========================================================= */

document.documentElement.classList.add("js");

// ---- Medição do funil: eventos vão para window.dataLayer (e para o GA4, se configurado) ----
window.dataLayer = window.dataLayer || [];
function track(evento, dados = {}) {
  window.dataLayer.push({ event: evento, ...dados });
  if (typeof window.gtag === "function") window.gtag("event", evento, dados);
}

// UTMs da visita: guardadas na sessão e repassadas ao checkout, para a plataforma registrar a origem da compra.
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function utms() {
  const q = new URLSearchParams(location.search);
  let salvo = {};
  try { salvo = JSON.parse(sessionStorage.getItem("utms") || "{}"); } catch {}
  const atuais = Object.fromEntries(UTM_KEYS.filter((k) => q.get(k)).map((k) => [k, q.get(k)]));
  const todos = Object.keys(atuais).length ? atuais : salvo;
  try { sessionStorage.setItem("utms", JSON.stringify(todos)); } catch {}
  return todos;
}

function setupCheckout() {
  const origem = utms();
  const ok = /^https:\/\//i.test(CHECKOUT_URL);
  let destino = "";
  if (ok) {
    const u = new URL(CHECKOUT_URL);
    Object.entries(origem).forEach(([k, v]) => u.searchParams.set(k, v));
    destino = u.toString();
  } else {
    console.warn("CHECKOUT_URL vazio: os botões levam à oferta. Não publique sem configurar.");
    document.querySelector(".js-checkout-pendente").hidden = false;
    document.querySelector(".js-checkout-final").setAttribute("aria-disabled", "true");
  }
  document.querySelectorAll(".js-cta").forEach((a) => {
    if (ok) { a.href = destino; a.rel = "noopener"; }
    a.addEventListener("click", (e) => {
      track("cta_click", { local: a.dataset.local });
      if (ok) track("begin_checkout", { local: a.dataset.local, value: 47, currency: "BRL" });
      else if (a.classList.contains("js-checkout-final")) e.preventDefault();
    });
  });
  // A compra só é registrada pela plataforma de pagamento, nunca por clique.
}

// Quantas pessoas chegam a ver a oferta (para saber se abandonam antes de ler o preço).
function setupFunil() {
  track("landing_view", utms());
  const preco = document.querySelector(".compra__preco"); // o preço é pequeno: aparece inteiro em qualquer tela
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    track("view_offer");
    io.disconnect();
  }, { threshold: 1 });
  io.observe(preco);
}

// Aviso de cookies: só existe se houver ferramenta de medição configurada.
function setupConsent() {
  if (!GA4_ID) return;
  const box = document.querySelector(".js-consent");
  const carregar = () => {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
    document.head.append(s);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID);
  };
  let escolha = null;
  try { escolha = localStorage.getItem("consent"); } catch {}
  if (escolha === "sim") return carregar();
  if (escolha === "nao") return;
  box.hidden = false;
  const decidir = (v) => { try { localStorage.setItem("consent", v); } catch {} box.hidden = true; if (v === "sim") carregar(); };
  box.querySelector(".js-consent-sim").addEventListener("click", () => decidir("sim"));
  box.querySelector(".js-consent-nao").addEventListener("click", () => decidir("nao"));
}

// Vídeo do topo: toca mudo em loop; o botão liga o som (conta como reprodução).
function setupVideoTopo() {
  const v = document.querySelector(".js-hero-video");
  const fig = v.closest(".hero2__video");
  const btn = document.querySelector(".js-hero-som");
  v.src = VIDEO_TOPO.src;
  v.poster = VIDEO_TOPO.poster;
  fig.classList.toggle("hero2__video--deitado", !VIDEO_TOPO.vertical);
  document.querySelector(".js-hero-legenda").textContent = VIDEO_TOPO.legenda;
  let contou = false;
  const setSom = (on) => {
    v.muted = !on;
    btn.setAttribute("aria-pressed", on);
    btn.querySelector("span").textContent = on ? "som ligado" : "toque para ouvir";
    if (on) {
      v.play().catch(() => {});
      if (!contou) { contou = true; track("video_play", { video: VIDEO_TOPO.src }); }
    }
  };
  btn.addEventListener("click", () => setSom(v.muted));
  v.addEventListener("click", () => setSom(v.muted));
  // Só roda quando está na tela, para não gastar dados à toa.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => (e[0].isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.3 }).observe(v);
  } else v.play().catch(() => {});
}

const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

// Carrossel: o da frente toca mudo em loop; arrastar ou tocar num de trás traz ele pra frente.
function setupPhones() {
  const box = document.querySelector(".js-phones");
  const snd = box.querySelector(".js-snd");
  const sndLabel = snd.querySelector("span");
  const dotsBox = box.querySelector(".js-dots");
  const hero = document.querySelector(".js-hero-video");

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
    if (on) { videos[cur].currentTime = 0; if (hero) hero.muted = true; }
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
  if (hero) hero.addEventListener("volumechange", () => { if (!hero.muted && sound) setSound(false); }); // nunca dois áudios ao mesmo tempo

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

// CTA fixo no celular: aparece depois do botão do topo e some na oferta.
function setupStickyCta() {
  const bar = document.querySelector(".sticky-cta");
  const hero = document.querySelector(".hero2__cta");
  const offer = document.querySelector("#oferta");
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
setupConsent();
setupCheckout();
setupFunil();
setupVideoTopo();
setupPhones();
setupReveal();
setupStickyCta();
