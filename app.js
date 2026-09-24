// ====== CONFIGURA AQUÍ ======
// Tu número con código de país, sin + ni espacios. Ej: "5491122334455"
const WHATSAPP = "51999039460";
// Sonido de los botones (archivo dentro de la carpeta Sound; cambia la extensión si es .wav u .ogg)
const SOUND = "Sound/Sound1.mp3";
// Música de fondo en bucle (Sound2) y su volumen: 0.1 = 10%
const MUSIC = "Sound/Sound2.mp3";
const MUSIC_VOLUME = 0.1;
// ============================

let products = [], cart = {}, current = null, idx = 0;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const find = n => products.find(p => p.Name === n);
const src = f => "Images/" + f;
// Acepta Price como 10 o como "$10"; si no hay precio, no muestra nada
const money = v => v === undefined ? "" : (typeof v === "number" ? "$" + v : v);
const num = v => parseFloat(String(v).replace(/[^0-9.]/g, "")) || 0;

// Ofertas: "Oferta": "YES" con "Descuento": "30%"   (o "Oferta": "NO")
const isOffer = p => { const o = String(p.Oferta ?? "NO").trim().toUpperCase(); return o !== "NO" && o !== ""; };
const pct = p => isOffer(p) ? (parseFloat(p.Descuento) || parseFloat(p.Oferta) || 0) : 0;
const unit = p => +(num(p.Price) * (1 - pct(p) / 100)).toFixed(2);   // precio final
const badge = p => "OFERTA" + (pct(p) ? " -" + pct(p) + "%" : "");
const priceHTML = p => p.Price === undefined ? "" : pct(p) ? `<s>${money(p.Price)}</s> $${unit(p)}` : money(p.Price);
const offerHTML = p => isOffer(p) ? `<span class="oferta">${badge(p)}</span><i class="sp s1">✨</i><i class="sp s2">✨</i><i class="sp s3">✨</i>` : "";

// Sonido al hacer clic en cualquier botón
const clickSound = new Audio(SOUND);
document.addEventListener("click", e => {
  if (e.target.closest("button")) { clickSound.currentTime = 0; clickSound.play().catch(() => {}); }
});

// Música de fondo: el navegador bloquea el sonido automático, así que si no arranca
// al entrar, empieza en el primer clic o toque de la persona.
const bgm = new Audio(MUSIC);
bgm.loop = true; bgm.volume = MUSIC_VOLUME;
const evs = ["click", "keydown", "touchstart"];
const startMusic = () => bgm.play().then(() => evs.forEach(e => document.removeEventListener(e, startMusic))).catch(() => {});
startMusic();
evs.forEach(e => document.addEventListener(e, startMusic));

// Galería de Home (debajo de Pres1: Pres2, Pres3, Pres4)
const PRES = ["Pres2.png", "Pres3.png", "Pres4.png"];
let pi = 0;
const showPres = () => $("#hImg").src = src(PRES[pi]);
$("#hPrev").onclick = () => { pi = (pi - 1 + PRES.length) % PRES.length; showPres(); };
$("#hNext").onclick = () => { pi = (pi + 1) % PRES.length; showPres(); };

// Navegación entre Home / Productos / Contáctanos
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  document.querySelectorAll("nav button, .page").forEach(e => e.classList.remove("active"));
  b.classList.add("active");
  $("#" + b.dataset.page).classList.add("active");
});

// Cargar productos
fetch("products.json").then(r => r.json()).then(d => { products = d; render(); })
  .catch(() => $("#grid").innerHTML = "<p>No se pudo cargar products.json. Abre la página con Live Server.</p>");

function render() {
  const q = $("#search").value.trim().toLowerCase();
  const list = products.filter(p => p.Name.toLowerCase().includes(q));
  $("#grid").innerHTML = list.length ? list.map(p => `
    <div class="card" data-n="${esc(p.Name)}">
      <img src="${src(p.Image)}" alt="${esc(p.Name)}">
      <div class="hover"><b>${esc(p.Name)}</b><span>${esc(p.information)}</span></div>
      <span class="price">${priceHTML(p)}</span>${offerHTML(p)}
      <div class="tags"><span class="stock">x${p.Stock}</span><button class="add" data-n="${esc(p.Name)}">🛒</button></div>
    </div>`).join("") : "<p>Sin resultados.</p>";
}
$("#search").oninput = render;

$("#grid").onclick = e => {
  const add = e.target.closest(".add");
  if (add) return addCart(add.dataset.n);
  const card = e.target.closest(".card");
  if (card) openModal(card.dataset.n);
};

// Carrito (vive solo en memoria: al recargar se pierde)
function addCart(n) {
  const p = find(n);
  if ((cart[n] || 0) >= p.Stock) return alert("No hay más stock de este producto.");
  cart[n] = (cart[n] || 0) + 1;
  renderCart(); $("#cart").classList.add("open");
}
function renderCart() {
  const names = Object.keys(cart);
  $("#cartCount").textContent = names.reduce((s, n) => s + cart[n], 0);
  const sub = n => unit(find(n)) * cart[n];
  const total = names.reduce((s, n) => s + sub(n), 0);
  $("#cartTotal").textContent = total ? "Total: $" + +total.toFixed(2) : "";
  $("#cartItems").innerHTML = names.length ? names.map(n => `
    <div class="item"><span>${esc(n)}<br><small>${sub(n) ? "$" + +sub(n).toFixed(2) : ""}</small></span>
      <span><button data-a="-" data-n="${esc(n)}">−</button> ${cart[n]} <button data-a="+" data-n="${esc(n)}">+</button></span>
    </div>`).join("") : "<p>El carrito está vacío.</p>";
}
$("#cartItems").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  const n = b.dataset.n;
  if (b.dataset.a === "+") { if (cart[n] < find(n).Stock) cart[n]++; }
  else if (--cart[n] <= 0) delete cart[n];
  renderCart();
};
$("#cartBtn").onclick = () => $("#cart").classList.toggle("open");
$("#closeCart").onclick = () => $("#cart").classList.remove("open");
$("#orderCart").onclick = () => order(Object.keys(cart).map(n => ({ name: n, qty: cart[n] })));

// Ventana grande del producto
function openModal(n) {
  current = find(n); idx = 0;
  $("#mName").textContent = current.Name;
  $("#mInfo").textContent = current.details || current.information;
  $("#mPrice").innerHTML = priceHTML(current) + (isOffer(current) ? ` <span class="oferta static">${badge(current)}</span>` : "");
  $("#mStock").textContent = "Stock: " + current.Stock;
  showImg(); $("#overlay").classList.add("open");
}
const imgs = () => (current.Images && current.Images.length) ? current.Images : [current.Image];
function showImg() { $("#mImg").src = src(imgs()[idx]); }
$("#prev").onclick = () => { idx = (idx - 1 + imgs().length) % imgs().length; showImg(); };
$("#next").onclick = () => { idx = (idx + 1) % imgs().length; showImg(); };
$("#addModal").onclick = () => addCart(current.Name);
$("#buy").onclick = () => order([{ name: current.Name, qty: 1 }]);
const closeModal = () => $("#overlay").classList.remove("open");
$("#closeModal").onclick = closeModal;
$("#overlay").onclick = e => { if (e.target.id === "overlay") closeModal(); };
document.onkeydown = e => { if (e.key === "Escape") closeModal(); };

// Advertencia + WhatsApp
function order(items) {
  if (!items.length) return alert("Tu carrito está vacío.");
  const aviso = Object.keys(cart).length
    ? "¿Quieres salir? Tienes productos seleccionados en el carrito. Si sales, perderás todo el progreso."
    : "Al aceptar, pasarás a un chat para continuar conversando sobre el producto. Si sales del chat, perderás el progreso de los productos que aún no hayas seleccionado.";
  if (!confirm(aviso)) return;
  let total = 0;
  const lines = items.map(i => {
    const p = find(i.name), sub = unit(p) * i.qty;
    total += sub;
    return `- ${i.name} x${i.qty}` + (sub ? ` ($${+sub.toFixed(2)})` : "") + (isOffer(p) ? " [OFERTA]" : "");
  });
  const text = "Hola, quiero pedir:\n" + lines.join("\n") + (total ? `\nTotal: $${+total.toFixed(2)}` : "");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
}
renderCart();
