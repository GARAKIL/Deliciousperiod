let cart = {};
let activeCat = "all";
let RESTS = [];
let selectedRest = 0;
function renderMenu() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  PRODUCTS.forEach(p => {
    if (activeCat !== "all" && p.cat !== activeCat) return;
    const qty = cart[p.id] || 0;
    const card = document.createElement("article");
    card.className = "card";
    let btn;
    if (qty > 0) {
      btn = '<div class="stepper"><button class="qty-btn" data-dec="' + p.id + '">−</button><b>' + qty + '</b><button class="qty-btn plus" data-inc="' + p.id + '">+</button></div>';
    } else {
      btn = '<button class="btn btn-primary" data-inc="' + p.id + '">+ Додати</button>';
    }
    card.innerHTML =
      '<div class="card-img"><img loading="lazy" src="' + p.img + '" alt="' + p.name + '">' +
      (p.badge ? '<span class="card-badge">' + p.badge + '</span>' : '') + '</div>' +
      '<div class="card-body"><h3>' + p.name + '</h3>' +
      '<p class="card-desc">' + p.desc + '</p>' +
      '<div class="card-row"><span class="card-price">' + p.price + ' ₴</span>' + btn + '</div></div>';
    grid.appendChild(card);
  });
}
function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}
async function fetchJSON(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms || 6000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return await r.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}
async function detectByIP() {
  const j = await fetchJSON("https://ipapi.co/json/", 6000);
  if (j && j.latitude && j.longitude) return { lat: j.latitude, lon: j.longitude, city: j.city };
  return null;
}
function detectGPS(timeout) {
  return new Promise(ok => {
    if (!navigator.geolocation) return ok(null);
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; ok(null); } }, timeout || 5000);
    navigator.geolocation.getCurrentPosition(
      p => { if (!done) { done = true; clearTimeout(timer); ok({ lat: p.coords.latitude, lon: p.coords.longitude, city: "" }); } },
      () => { if (!done) { done = true; clearTimeout(timer); ok(null); } },
      { timeout: timeout || 5000, maximumAge: 600000 }
    );
  });
}
let map = null;
let markers = [];
let meMarker = null;

function pinIcon(selected) {
  return L.divIcon({
    className: "",
    html: '<div class="m-pin' + (selected ? " sel" : "") + '">С</div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

let pinClicked = false;

function initMap(center) {
  if (!window.L) return;
  if (!map) {
    map = L.map("map", { scrollWheelZoom: false }).setView([center.lat, center.lon], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap"
    }).addTo(map);
    map.on("click", e => {
      if (pinClicked) return;
      const pos = { lat: e.latlng.lat, lon: e.latlng.lng, city: "" };
      saveCenter(pos);
      applyCenter(pos, "Місце поставили ви — ресторани поруч.");
    });
  }
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if (meMarker) map.removeLayer(meMarker);
  meMarker = L.marker([center.lat, center.lon], {
    icon: L.divIcon({ className: "", html: '<div class="me-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
  }).addTo(map).bindPopup("Ви тут");
  RESTS.forEach((r, i) => {
    const m = L.marker([r.lat, r.lon], { icon: pinIcon(i === selectedRest) }).addTo(map);
    m.bindPopup("<b>" + r.name + "</b><br>" + r.addr);
    m.on("click", () => {
      pinClicked = true;
      setTimeout(() => { pinClicked = false; }, 0);
      selectRest(i);
    });
    markers.push(m);
  });
  const bounds = L.latLngBounds([[center.lat, center.lon]]);
  RESTS.forEach(r => bounds.extend([r.lat, r.lon]));
  map.fitBounds(bounds.pad(0.25));
}
function renderRests(filter) {
  const box = document.getElementById("restList");
  box.innerHTML = "";
  RESTS.forEach((r, i) => {
    if (filter && (r.name + " " + r.addr).toLowerCase().indexOf(filter.toLowerCase()) === -1) return;
    const btn = document.createElement("button");
    btn.className = "rest-item" + (i === selectedRest ? " selected" : "");
    btn.innerHTML = '<span class="km">' + r.km.toFixed(1) + ' км</span><b>' + r.name + '</b><small>' + r.addr + ' · ' + r.hours + '</small>';
    btn.onclick = () => selectRest(i);
    box.appendChild(btn);
  });
  if (!box.children.length) box.innerHTML = "<p>Нічого не знайдено</p>";
}

function selectRest(i, pan) {
  selectedRest = i;
  const r = RESTS[i];
  document.getElementById("mapName").textContent = r.name + " · " + r.km.toFixed(1) + " км";
  document.getElementById("mapAddr").textContent = r.addr + " · " + r.hours;
  renderRests(document.getElementById("restSearch").value);
  markers.forEach((m, j) => m.setIcon(pinIcon(j === selectedRest)));
  if (pan !== false && map) map.panTo([r.lat, r.lon], { animate: true });
}
async function reverseName(lat, lon) {
  const j = await fetchJSON("https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&accept-language=uk&lat=" + lat + "&lon=" + lon, 6000);
  if (!j) return { place: "", road: "" };
  const a = j.address || {};
  return {
    place: a.village || a.town || a.city || a.hamlet || a.suburb || "",
    road: a.road || ""
  };
}
async function fillPlaceNames() {
  await Promise.all(RESTS.map(async r => {
    const n = await reverseName(r.lat, r.lon);
    if (n.place) {
      r.addr = (n.road ? n.road + ", " : "") + n.place;
    } else {
      r.addr = r.km.toFixed(1) + " км від вас";
    }
  }));
  renderRests(document.getElementById("restSearch").value);
  selectRest(selectedRest, false);
}
function saveCenter(p) {
  try { localStorage.setItem("mypos", JSON.stringify(p)); } catch (e) {}
}
function loadCenter() {
  try {
    const s = localStorage.getItem("mypos");
    return s ? JSON.parse(s) : null;
  } catch (e) { return null; }
}
function applyCenter(pos, msg) {
  document.getElementById("geoNote").textContent = msg;
  RESTS = REST_DEFS.map(d => {
    const lat = pos.lat + d.dLat;
    const lon = pos.lon + d.dLon;
    return { name: d.name, addr: "поруч із вами", hours: d.hours, lat, lon, km: distKm(pos.lat, pos.lon, lat, lon) };
  }).sort((a, b) => a.km - b.km);
  selectedRest = 0;
  document.getElementById("restSearch").value = "";
  initMap(pos);
  renderRests("");
  selectRest(0);
  fillPlaceNames();
}
async function locate(fromButton) {
  const note = document.getElementById("geoNote");
  if (!fromButton) {
    const saved = loadCenter();
    if (saved) {
      applyCenter(saved, "Ваше місце" + (saved.city ? ": " + saved.city : "") + ".");
      return;
    }
  }
  note.textContent = "Визначаємо ваше місто…";
  let pos = await detectGPS(fromButton ? 8000 : 5000);
  if (pos) {
    saveCenter(pos);
    applyCenter(pos, "Знайшли вас по GPS — ресторани поруч.");
    return;
  }
  pos = await detectByIP();
  if (pos && pos.city) {
    applyCenter(pos, "Приблизно: " + pos.city + " (по IP).");
    return;
  }
  applyCenter({ lat: FALLBACK_POS.lat, lon: FALLBACK_POS.lon }, "Не вийшло визначити місце — показуємо Київ.");
}
function cartCount() {
  let n = 0;
  for (const id in cart) n += cart[id];
  return n;
}
function cartSum() {
  let s = 0;
  PRODUCTS.forEach(p => { s += p.price * (cart[p.id] || 0); });
  return s;
}
function renderCart() {
  const n = cartCount();
  const sum = cartSum();
  const del = sum >= FREE_FROM || n === 0 ? 0 : DELIVERY_FEE;

  document.getElementById("cartBadge").hidden = n === 0;
  document.getElementById("cartBadge").textContent = n;
  document.getElementById("tabBadge").hidden = n === 0;
  document.getElementById("tabBadge").textContent = n;
  document.getElementById("drawerSub").textContent = n === 0 ? "порожньо" : n + " шт";

  const list = document.getElementById("cartList");
  list.innerHTML = "";
  PRODUCTS.forEach(p => {
    if (!cart[p.id]) return;
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = '<img src="' + p.img + '" alt="' + p.name + '"><div class="grow">' +
      '<div class="row-top"><h4>' + p.name + '</h4><button class="rm" data-del="' + p.id + '">×</button></div>' +
      '<p class="unit">' + p.price + ' ₴ за шт</p>' +
      '<div class="row-bot"><div class="stepper"><button class="qty-btn" data-dec="' + p.id + '">−</button><b>' + cart[p.id] + '</b><button class="qty-btn plus" data-inc="' + p.id + '">+</button></div>' +
      '<span class="line-total">' + (p.price * cart[p.id]) + ' ₴</span></div></div>';
    list.appendChild(row);
  });

  document.getElementById("cartEmpty").style.display = n === 0 ? "flex" : "none";
  document.getElementById("orderForm").hidden = n === 0;
  document.getElementById("deliveryVal").textContent = del === 0 ? "безкоштовно" : del + " ₴";
  document.getElementById("cartTotal").textContent = (sum + del) + " ₴";
  renderMenu();
}
document.addEventListener("click", e => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const delBtn = e.target.closest("[data-del]");
  const go = e.target.closest("[data-scroll]");
  const add = e.target.closest("[data-add]");
  if (inc) {
    const id = +inc.dataset.inc;
    cart[id] = (cart[id] || 0) + 1;
    renderCart();
  }
  if (dec) {
    const id = +dec.dataset.dec;
    cart[id]--;
    if (cart[id] <= 0) delete cart[id];
    renderCart();
  }
  if (delBtn) {
    delete cart[+delBtn.dataset.del];
    renderCart();
  }
  if (go) {
    if (go.dataset.close) closeCart();
    document.querySelector(go.dataset.scroll).scrollIntoView({ behavior: "smooth" });
  }
  if (add) {
    const id = +add.dataset.add;
    cart[id] = (cart[id] || 0) + 1;
    renderCart();
    openCart();
  }
});
document.querySelectorAll("#tabs .btn-tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#tabs .btn-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCat = btn.dataset.cat;
    renderMenu();
  };
});
document.getElementById("restSearch").addEventListener("input", e => renderRests(e.target.value));
document.getElementById("geoBtn").onclick = () => locate(true);
document.getElementById("orderHere").onclick = () => {
  const r = RESTS[selectedRest];
  if (r) document.getElementById("fAddr").value = r.name + ", " + r.addr;
  openCart();
};
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("overlay");
function openCart() {
  overlay.hidden = false;
  drawer.classList.add("open");
  document.body.style.overflow = "hidden";
  showStep("cart");
}
function closeCart() {
  drawer.classList.remove("open");
  document.body.style.overflow = "";
  overlay.hidden = true;
}
function showStep(mode) {
  document.getElementById("cartView").hidden = mode !== "cart";
  document.getElementById("successView").hidden = mode !== "success";
  document.getElementById("drawerTitle").textContent = mode === "success" ? "Дякуємо" : "Кошик";
  document.getElementById("drawerSub").hidden = mode === "success";
}
document.getElementById("cartOpen").onclick = openCart;
document.getElementById("tabCart").onclick = openCart;
document.getElementById("drawerClose").onclick = closeCart;
overlay.onclick = closeCart;
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeCart();
});
document.getElementById("orderForm").onsubmit = e => {
  e.preventDefault();
  document.getElementById("orderNum").textContent = "№ " + Math.floor(1000 + Math.random() * 9000);
  showStep("success");
};
document.getElementById("successOk").onclick = () => {
  cart = {};
  document.getElementById("orderForm").reset();
  renderCart();
  closeCart();
  setTimeout(() => showStep("cart"), 300);
};
document.getElementById("burgerBtn").onclick = () => {
  const nav = document.getElementById("mobileNav");
  nav.classList.toggle("open");
  document.getElementById("burgerBtn").textContent = nav.classList.contains("open") ? "✕" : "☰";
};
document.querySelectorAll("#mobileNav a").forEach(a => {
  a.onclick = () => {
    document.getElementById("mobileNav").classList.remove("open");
    document.getElementById("burgerBtn").textContent = "☰";
  };
});
renderCart();
locate(false);

