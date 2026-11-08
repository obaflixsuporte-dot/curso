/* =========================================================
   CONFIGURAÇÕES — edite só este bloco
   ========================================================= */

// Link do vídeo de apresentação (MP4/WebM). Ex.: "assets/apresentacao.mp4"
const VIDEO_URL = "";
// Capa do vídeo antes de dar play (opcional). Ex.: "assets/capa-apresentacao.jpg"
const VIDEO_POSTER = "";

// Link do checkout da Cakto. Ex.: "https://pay.cakto.com.br/XXXXXX"
const CHECKOUT_URL = "";

// Galeria de resultados: aparece o preview real do Instagram/Facebook (o post precisa ser público).
const VIDEOS = [
  { platform: "Instagram", views: "5,1 mi", url: "https://www.instagram.com/reel/DfXUo4hEcki/" },
  { platform: "Instagram", views: "532 mil", url: "https://www.instagram.com/reel/DfYIwjUCYSR/" },
  { platform: "Instagram", views: "487 mil", url: "https://www.instagram.com/reel/DfabEfRCNa5/" },
  { platform: "Instagram", views: "212 mil", url: "https://www.instagram.com/reel/DfajyC7nxJX/" },
  { platform: "Facebook", views: "503 mil", url: "https://www.facebook.com/reel/1479493334137975" },
];

/* ========================================================= */

document.documentElement.classList.add("js");

// Checkout: só aceita https; sem link, os botões levam para a seção da oferta.
function setupCheckout() {
  const ok = /^https:\/\//i.test(CHECKOUT_URL);
  if (!ok) console.warn("CHECKOUT_URL vazio ou inválido: botões apontam para #comece-agora.");
  document.querySelectorAll(".js-cta").forEach((a) => {
    if (!ok) return;
    a.href = CHECKOUT_URL;
    a.target = "_blank";
    a.rel = "noopener";
  });
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

  play.addEventListener("click", () => {
    video.controls = true;
    video.play().catch(() => {}); // navegador pode bloquear; os controles continuam disponíveis
  });
  video.addEventListener("play", () => {
    box.dataset.state = "playing";
    video.controls = true;
  });
}

function renderGallery() {
  const list = document.querySelector(".js-gallery");
  list.innerHTML = VIDEOS.map((v) => `
    <li class="embed reveal">
      <span class="embed__label">${v.views} de views · ${v.platform}</span>
      <div class="embed__frame">${v.platform === "Facebook"
        ? `<iframe class="embed__fb" src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(v.url)}&show_text=false&width=340" loading="lazy" title="Vídeo no Facebook com ${v.views} de views" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`
        : `<blockquote class="instagram-media" data-instgrm-permalink="${v.url}" data-instgrm-version="14"><a href="${v.url}" target="_blank" rel="noopener">Ver o vídeo no Instagram (${v.views} de views)</a></blockquote>`}
      </div>
    </li>`).join("");

  // Script oficial do Instagram (~1 MB) só carrega perto da galeria, para o topo abrir rápido.
  const loadInstagram = () => {
    const s = document.createElement("script");
    s.src = "https://www.instagram.com/embed.js";
    s.async = true;
    document.body.append(s);
  };
  if (!("IntersectionObserver" in window)) return loadInstagram();
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    loadInstagram();
  }, { rootMargin: "800px 0px" });
  io.observe(list);
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
renderGallery();
setupCheckout();
setupPlayer();
setupReveal();
setupStickyCta();
