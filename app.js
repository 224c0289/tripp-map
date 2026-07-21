var SUPABASE_URL = "https://pmqbkzmoldnrxsgcilaq.supabase.co";
var SUPABASE_KEY = "sb_publishable_-peFoHZjmmEYafHuNrTFqw_f4BUoTNp";
var TABLE_NAME = "tripp";

var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var HOME = { name: "江戸川区", lat: 35.7066, lng: 139.8684 };

var TRANSPORT = {
  plane:      { icon: "\u2708\uFE0F", label: "\u30D5\u30E9\u30A4\u30C8",   color: "#60a5fa", dash: "12, 8" },
  shinkansen: { icon: "\uD83D\uDE84", label: "\u65B0\u5E79\u7DDA",   color: "#a78bfa", dash: "4, 4" },
  train:      { icon: "\uD83D\uDE83", label: "\u96FB\u8ECA",     color: "#34d399", dash: "6, 4" },
  car:        { icon: "\uD83D\uDE97", label: "\u8ECA",       color: "#fbbf24", dash: "8, 6" },
  bus:        { icon: "\uD83D\uDE8C", label: "\u30D0\u30B9",     color: "#f472b6", dash: "4, 6" },
  walk:       { icon: "\uD83D\uDEB6", label: "\u5F92\u6B69",     color: "#9ca3af", dash: "2, 4" }
};

var map = L.map("map", {
  center: [36.5, 138.0],
  zoom: 5,
  zoomControl: true,
  attributionControl: true
});

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 19
}).addTo(map);

var pinIcon = L.divIcon({
  className: "custom-pin",
  html: '<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="url(#g)" stroke="#fff" stroke-width="1.5"/><circle cx="14" cy="13" r="6" fill="#fff" opacity="0.9"/></svg>',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -38]
});

var homeIcon = L.divIcon({
  className: "home-pin",
  html: '<div style="background:#ef4444;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)">&#x1F3E0;</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

L.marker([HOME.lat, HOME.lng], { icon: homeIcon, zIndexOffset: 1000 })
  .addTo(map)
  .bindPopup('<div class="popup-body"><div class="popup-name" style="color:#fca5a5">&#x1F3E0; \u6C5F\u6238\u5DDD\u533A\uFF08\u51FA\u767A\u5730\uFF09</div></div>');

var trips = [];
var markerMap = {};
var routeLines = [];
var routeLabels = [];

var sampleTrips = [
  { id: "sample-1", name: "\u6771\u4EAC\u30BF\u30EF\u30FC", lat: 35.6586, lng: 139.7454, address: "\u6771\u4EAC\u90FD\u6E2F\u533A\u82A6\u516C\u57124-2-8", comment: "\u6771\u4EAC\u306E\u30B7\u30F3\u30DC\u30EB\u3002\u591C\u666F\u304C\u7279\u306B\u7DAD\u9E97\u3060\u3063\u305F\u3002", date: "2024-08-15", time: "18:30", photo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop", transport: "train" },
  { id: "sample-2", name: "\u30C6\u30FC\u30E0\u30E9\u30DC\u30D7\u30E9\u30CD\u30C4", lat: 35.3906, lng: 139.7946, address: "\u6771\u4EAC\u90FD\u6C5F\u6771\u533A\u8C4A\u6D326-1-16", comment: "\u5149\u3068\u30C7\u30B8\u30BF\u30EB\u30A2\u30FC\u30C8\u306E\u6CA1\u5165\u578B\u4F53\u9A13\u304C\u975E\u5E38\u306B\u5E7B\u60F3\u7684\u3060\u3063\u305F\u3002", date: "2024-10-20", time: "14:00", photo: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop", transport: "train" },
  { id: "sample-3", name: "\u30BB\u30EC\u30F3\u30B2\u30C6\u30A3\u7ACB\u56FD\u516C\u5712", lat: -2.333, lng: 34.833, address: "\u30BF\u30F3\u30B6\u30CB\u30A2", comment: "\u91CE\u751F\u52D5\u7269\u306E\u5927\u79FB\u52D5\u3092\u9593\u8FD1\u3067\u898B\u3089\u308C\u305F\u3002\u5927\u81EA\u7136\u306E\u8FFD\u529B\u306B\u5727\u5012\u3055\u308C\u305F\u3002", date: "2023-07-10", time: "09:00", photo: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&h=400&fit=crop", transport: "plane" },
  { id: "sample-4", name: "\u30AE\u30B6\u306E\u30D4\u30E9\u30DF\u30C3\u30C9", lat: 29.9792, lng: 31.1342, address: "\u30A8\u30B8\u30%D7\u30C8\u30FB\u30AE\u30B6", comment: "\u7D00\u5143\u524D\u306E\u5EFA\u9020\u7269\u306E\u30B9\u30B1\u30FC\u30EB\u306B\u9A5A\u3044\u305F\u3002\u30D5\u30F3\u30CC\u738B\u306E\u30D4\u30E9\u30DF\u30C3\u30C9\u306F\u58EE\u5927\u3060\u3063\u305F\u3002", date: "2023-03-05", time: "11:00", photo: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=600&h=400&fit=crop", transport: "plane" },
  { id: "sample-5", name: "\u6771\u4EAC\u30C7\u30A3\u30BA\u30CB\u30FC\u30E9\u30F3\u30C9", lat: 35.6329, lng: 139.8804, address: "\u5343\u8449\u770C\u6D66\u5B89\u5E02\u821E\u822E1-1", comment: "\u9B54\u6CD5\u306E\u3088\u3046\u306A\u4E00\u65E5\u3060\u3063\u305F\u3002\u30D5\u30A1\u30A4\u30A2\u30A6\u30A9\u30FC\u30AF\u30B9\u304C\u611F\u52D5\u7684\u3002", date: "2024-05-03", time: "10:00", photo: "https://images.unsplash.com/photo-1570750605820-8755e1a9b5c5?w=600&h=400&fit=crop", transport: "train" },
  { id: "sample-6", name: "\u5BCC\u58EB\u5C71", lat: 35.3606, lng: 138.7274, address: "\u9759\u5CA1\u770C/\u5C71\u68A8\u770C", comment: "\u671D\u65E5\u306E\u51FA\u3068\u540C\u6642\u306B\u898B\u305F\u5BCC\u58EB\u5C71\u306F\u606F\u3092\u5410\u3080\u307B\u3069\u7F8E\u3057\u304B\u3063\u305F\u3002", date: "2024-01-01", time: "06:30", photo: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&h=400&fit=crop", transport: "car" },
  { id: "sample-7", name: "\u4F0F\u898B\u7A3C\u8377\u5927\u793E", lat: 34.9671, lng: 135.7727, address: "\u4EAC\u90FD\u5E9C\u4EAC\u90FD\u5E02\u4F0F\u898B\u533A\u6DF1\u8349\u8594\u4E4B\u5185\u753A68", comment: "\u5343\u672C\u9CE5\u5C45\u306E\u4E26\u3076\u9053\u306F\u307E\u3068\u3067\u7570\u4E16\u754C\u3002\u5C71\u9802\u307E\u3067\u767B\u3063\u305F\u3002", date: "2024-04-10", time: "08:00", photo: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&h=400&fit=crop", transport: "shinkansen" },
  { id: "sample-8", name: "\u5BCC\u826F\u91CE\u30E9\u30D9\u30F3\u30C0\u30FC\u756A\u5712", lat: 43.3421, lng: 142.3831, address: "\u5317\u6D77\u9053\u5BCC\u826F\u91CE\u5E02", comment: "\u7D2B\u8272\u306B\u67D3\u307E\u308B\u756A\u5712\u3068\u5BCC\u58EB\u5C71\u306E\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u304C\u7D50\u666F\u3060\u3063\u305F\u3002", date: "2024-07-20", time: "11:00", photo: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&h=400&fit=crop", transport: "plane" }
];

function buildPopupHtml(trip) {
  var h = "";
  if (trip.photo) {
    h += '<img class="popup-photo" src="' + trip.photo + '" alt="' + trip.name + '" onerror="this.style.display=\'none\'">';
  }
  h += '<div class="popup-body">';
  h += '<div class="popup-name">' + trip.name + '</div>';
  h += '<div class="popup-address">' + (trip.address || "") + '</div>';
  if (trip.transport) {
    var ti = TRANSPORT[trip.transport] || TRANSPORT.train;
    h += '<div class="popup-transport"><span class="ti">' + ti.icon + '</span><span>\u6C5F\u6238\u5DDD\u533A\u304B\u3089' + ti.label + '\u3067\u79FB\u52D5</span></div>';
  }
  h += '<div class="popup-comment">' + (trip.comment || "") + '</div>';
  h += '<div class="popup-meta">';
  h += '<span>\uD83D\uDCC5 ' + (trip.date || "-") + '</span>';
  h += '<span>\uD83D\uDD50 ' + (trip.time || "-") + '</span>';
  h += '</div>';
  h += '<div class="popup-actions">';
  h += '<button class="btn-edit" data-action="edit" data-id="' + trip.id + '">\u270F\uFE0F \u7DE8\u96C6</button>';
  h += '<button class="btn-delete" data-action="delete" data-id="' + trip.id + '">\uD83D\uDDD1 \u524A\u9664</button>';
  h += '</div></div>';
  return h;
}

function isOverseas(lat, lng) {
  return lat < 24 || lat > 46 || lng < 122 || lng > 154;
}

function createRoute(trip) {
  var ti = TRANSPORT[trip.transport] || TRANSPORT.train;
  var color = isOverseas(trip.lat, trip.lng) ? "#60a5fa" : ti.color;
  var ll;
  if (isOverseas(trip.lat, trip.lng)) {
    ll = [[HOME.lat, HOME.lng], [HOME.lat, trip.lng], [trip.lat, trip.lng]];
  } else {
    ll = [[HOME.lat, HOME.lng], [trip.lat, trip.lng]];
  }
  var line = L.polyline(ll, { color: color, weight: 2, opacity: 0.5, dashArray: ti.dash || "8, 6" }).addTo(map);
  routeLines.push(line);

  var mLat = (HOME.lat + trip.lat) / 2;
  var mLng = (HOME.lng + trip.lng) / 2;
  if (isOverseas(trip.lat, trip.lng)) {
    mLat = trip.lat * 0.6;
    mLng = (HOME.lng + trip.lng) / 2;
  }
  var label = L.marker([mLat, mLng], {
    icon: L.divIcon({ className: "route-label", html: ti.icon + " " + ti.label, iconSize: [80, 24], iconAnchor: [40, 12] }),
    interactive: false
  }).addTo(map);
  routeLabels.push(label);
}

function createMarker(trip) {
  var marker = L.marker([trip.lat, trip.lng], { icon: pinIcon }).addTo(map);
  marker.bindPopup(buildPopupHtml(trip), { maxWidth: 320, minWidth: 260, closeButton: true });
  markerMap[trip.id] = marker;
  createRoute(trip);
}

function clearRoutes() {
  routeLines.forEach(function(l) { map.removeLayer(l); });
  routeLabels.forEach(function(l) { map.removeLayer(l); });
  routeLines = [];
  routeLabels = [];
}

function rebuildAll() {
  Object.keys(markerMap).forEach(function(k) { map.removeLayer(markerMap[k]); });
  markerMap = {};
  clearRoutes();
  trips.forEach(function(t) { createMarker(t); });
}

function updateStats() {
  document.getElementById("spotCount").textContent = "\uD83D\uDCCD " + trips.length + " spots";
}

function buildTimeline() {
  var sorted = trips.slice().sort(function(a, b) { return (a.date || "").localeCompare(b.date || ""); });
  var h = '<div class="tl-home"><div class="tl-home-dot"></div><div class="tl-home-label">\uD83C\uDFE0 \u6C5F\u6238\u5DDD\u533A\uFF08\u51FA\u767A\u5730\uFF09</div></div>';
  sorted.forEach(function(trip) {
    var ti = TRANSPORT[trip.transport] || TRANSPORT.train;
    h += '<div class="tl-item" data-trip-id="' + trip.id + '">';
    h += '<div class="tl-dot"></div>';
    h += '<div class="tl-icon">' + ti.icon + '</div>';
    h += '<div class="tl-name">' + trip.name + '</div>';
    h += '<div class="tl-date">' + (trip.date || "\u65E5\u4ED8\u672A\u5B9A") + '</div>';
    h += '<div class="tl-tag">' + ti.icon + " " + ti.label + '</div>';
    h += '</div>';
  });
  document.getElementById("timelineContainer").innerHTML = h;

  document.querySelectorAll(".tl-item").forEach(function(el) {
    el.addEventListener("click", function() {
      var id = el.getAttribute("data-trip-id");
      var trip = trips.find(function(t) { return t.id === id; });
      if (!trip) return;
      map.setView([trip.lat, trip.lng], 10);
      if (markerMap[id]) markerMap[id].openPopup();
      document.getElementById("sidebar").classList.remove("open");
    });
  });
}

async function fetchTrips() {
  var res = await sb.from(TABLE_NAME).select("*").order("created_at", { ascending: false });
  if (res.error) { console.error("\u53D6\u5F97\u30A8\u30E9\u30FC:", res.error); }
  trips = (!res.error && res.data && res.data.length > 0) ? res.data : sampleTrips;
  rebuildAll();
  updateStats();
  buildTimeline();
}

async function insertTrip(data) {
  var res = await sb.from(TABLE_NAME).insert(data).select().single();
  if (res.error) { console.error("\u767B\u9332\u30A8\u30E9\u30FC:", res.error); showToast("\u767B\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F: " + res.error.message); return null; }
  return res.data;
}

async function updateTrip(id, data) {
  var res = await sb.from(TABLE_NAME).update(data).eq("id", id).select().single();
  if (res.error) { console.error("\u66F4\u65B0\u30A8\u30E9\u30FC:", res.error); showToast("\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F: " + res.error.message); return null; }
  return res.data;
}

async function deleteTripFromDB(id) {
  var res = await sb.from(TABLE_NAME).delete().eq("id", id);
  if (res.error) { console.error("\u524A\u9664\u30A8\u30E9\u30FC:", res.error); showToast("\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F: " + res.error.message); return false; }
  return true;
}

var tripOverlay = document.getElementById("tripModalOverlay");
var tripModalClose = document.getElementById("tripModalClose");
var registerBtn = document.getElementById("registerBtn");
var fabBtn = document.getElementById("fabBtn");
var mapHint = document.getElementById("mapHint");
var toastEl = document.getElementById("toast");
var modalTitle = document.getElementById("modalTitle");
var fLat = document.getElementById("fLat");
var fLng = document.getElementById("fLng");
var editId = null;

function openTripModal(title) { modalTitle.textContent = title; tripOverlay.classList.add("active"); }
function closeTripModal() { tripOverlay.classList.remove("active"); editId = null; }

function clearForm() {
  document.getElementById("fName").value = "";
  document.getElementById("fAddress").value = "";
  fLat.value = "";
  fLng.value = "";
  document.getElementById("fComment").value = "";
  document.getElementById("fPhoto").value = "";
  document.getElementById("fDate").value = "";
  document.getElementById("fTime").value = "";
  document.getElementById("fTransport").value = "train";
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  toastEl.classList.add("show");
  setTimeout(function() { toastEl.classList.remove("show"); setTimeout(function() { toastEl.style.display = "none"; }, 300); }, 2000);
}

document.getElementById("sidebarToggle").addEventListener("click", function() {
  document.getElementById("sidebar").classList.toggle("open");
  buildTimeline();
});
document.getElementById("sidebarClose").addEventListener("click", function() {
  document.getElementById("sidebar").classList.remove("open");
});

fabBtn.addEventListener("click", function() {
  editId = null;
  clearForm();
  openTripModal("\u65C5\u884C\u5148\u3092\u767B\u9332");
  mapHint.style.display = "block";
  mapHint.style.animation = "none";
  mapHint.offsetHeight;
  mapHint.style.animation = "fadeHint 3s forwards";
});

tripModalClose.addEventListener("click", closeTripModal);
tripOverlay.addEventListener("click", function(e) { if (e.target === tripOverlay) closeTripModal(); });

map.on("click", function(e) {
  fLat.value = e.latlng.lat.toFixed(4);
  fLng.value = e.latlng.lng.toFixed(4);
  mapHint.style.display = "none";
});

document.addEventListener("click", async function(e) {
  var btn = e.target.closest("[data-action]");
  if (!btn) return;
  var action = btn.getAttribute("data-action");
  var id = btn.getAttribute("data-id");
  if (action === "edit") { startEdit(id); }
  else if (action === "delete") { await handleDelete(id); }
});

registerBtn.addEventListener("click", async function() {
  var name = document.getElementById("fName").value.trim();
  var address = document.getElementById("fAddress").value.trim();
  var lat = parseFloat(fLat.value);
  var lng = parseFloat(fLng.value);
  var comment = document.getElementById("fComment").value.trim();
  var photo = document.getElementById("fPhoto").value.trim();
  var date = document.getElementById("fDate").value;
  var time = document.getElementById("fTime").value;
  var transport = document.getElementById("fTransport").value;

  if (!name) { alert("\u5834\u6240\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044"); return; }
  if (isNaN(lat) || isNaN(lng)) { alert("\u5730\u56F3\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u4F4D\u7F6E\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044"); return; }

  var tripData = { name: name, lat: lat, lng: lng, address: address, comment: comment, photo: photo, date: date, time: time, transport: transport };

  if (editId) {
    var updated = await updateTrip(editId, tripData);
    if (!updated) return;
    var idx = trips.findIndex(function(t) { return t.id === editId; });
    if (idx >= 0) trips[idx] = updated;
    rebuildAll();
    updateStats();
    buildTimeline();
    closeTripModal();
    showToast("\u30D4\u30F3\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\uFF01");
  } else {
    var inserted = await insertTrip(tripData);
    if (!inserted) return;
    trips.unshift(inserted);
    rebuildAll();
    updateStats();
    buildTimeline();
    closeTripModal();
    showToast("\u30D4\u30F3\u3092\u767B\u9332\u3057\u307E\u3057\u305F\uFF01");
  }
  clearForm();
  map.setView([lat, lng], 10);
});

function startEdit(id) {
  var t = trips.find(function(trip) { return trip.id === id; });
  if (!t) return;
  editId = id;
  document.getElementById("fName").value = t.name;
  document.getElementById("fAddress").value = t.address || "";
  fLat.value = t.lat;
  fLng.value = t.lng;
  document.getElementById("fComment").value = t.comment || "";
  document.getElementById("fPhoto").value = t.photo || "";
  document.getElementById("fDate").value = t.date || "";
  document.getElementById("fTime").value = t.time || "";
  document.getElementById("fTransport").value = t.transport || "train";
  openTripModal("\u65C5\u884C\u5148\u3092\u7DE8\u96C6");
  map.closePopup();
}

async function handleDelete(id) {
  var t = trips.find(function(trip) { return trip.id === id; });
  if (!t) return;
  if (!confirm("\u300C" + t.name + "\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F")) return;
  var ok = await deleteTripFromDB(id);
  if (!ok) return;
  trips = trips.filter(function(trip) { return trip.id !== id; });
  rebuildAll();
  updateStats();
  buildTimeline();
  map.closePopup();
  showToast("\u30D4\u30F3\u3092\u524A\u9664\u3057\u307E\u3057\u305F");
}

(async function init() {
  await fetchTrips();
  document.getElementById("loadingOverlay").classList.add("hidden");
})();
