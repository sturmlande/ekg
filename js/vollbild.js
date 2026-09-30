// ============================================================
// Vollbildansicht für EKG-Bilder
// Jedes <img class="ekg"> lässt sich anklicken und öffnet sich
// im Vollbild. Dort gilt:
//   Mausrad / Trackpad / zwei Finger  -> zoomen
//   Ziehen                            -> verschieben
//   Doppelklick / Doppeltippen        -> auf 3-fach zoomen bzw. zurück
//   Esc, ✕ oder Tippen neben das Bild -> schließen
// Optional: data-gross="bilder/xyz-gross.jpg" am <img> lädt im
// Vollbild eine höher aufgelöste Version.
// ============================================================
(function () {
  const MAX_ZOOM = 8;

  let box, buehne, bild, schliessenKnopf, ausloeser;
  let zoom = 1, x = 0, y = 0, basisBreite = 0, basisHoehe = 0;

  const zeiger = new Map();
  let letzteDistanz = 0, letzteMitte = null;
  let bewegung = 0, startZiel = null;
  let letzterTipp = 0, letzterTippOrt = null;

  // ---------- Hilfsfunktionen ----------
  const begrenzeZoom = (z) => Math.min(MAX_ZOOM, Math.max(1, z));
  const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mitte = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const istOffen = () => box && box.classList.contains("offen");

  // ---------- Aufbau (einmalig beim ersten Öffnen) ----------
  function aufbauen() {
    box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Bild in Vollansicht");
    box.innerHTML = `
      <div class="lightbox-buehne"><img alt="" draggable="false"></div>
      <div class="lightbox-leiste">
        <button type="button" data-aktion="raus" aria-label="Verkleinern">−</button>
        <button type="button" data-aktion="rein" aria-label="Vergrößern">+</button>
        <button type="button" data-aktion="ganz" aria-label="Ganzes Bild zeigen">⤢</button>
        <button type="button" data-aktion="zu" aria-label="Schließen">✕</button>
      </div>
      <p class="lightbox-hinweis">Zoomen mit Mausrad, Doppelklick oder zwei Fingern. Ziehen verschiebt das Bild.</p>`;
    document.body.appendChild(box);

    buehne = box.querySelector(".lightbox-buehne");
    bild = buehne.querySelector("img");
    schliessenKnopf = box.querySelector('[data-aktion="zu"]');

    box.querySelector(".lightbox-leiste").addEventListener("click", (e) => {
      const knopf = e.target.closest("button");
      if (!knopf) return;
      const mx = buehne.clientWidth / 2, my = buehne.clientHeight / 2;
      if (knopf.dataset.aktion === "rein") zoomeAuf(mx, my, zoom * 1.5);
      if (knopf.dataset.aktion === "raus") zoomeAuf(mx, my, zoom / 1.5);
      if (knopf.dataset.aktion === "ganz") einpassen();
      if (knopf.dataset.aktion === "zu") schliessen();
    });

    buehne.addEventListener("wheel", mausrad, { passive: false });
    buehne.addEventListener("pointerdown", zeigerRunter);
    buehne.addEventListener("pointermove", zeigerBewegt);
    buehne.addEventListener("pointerup", zeigerHoch);
    buehne.addEventListener("pointercancel", zeigerHoch);
    document.addEventListener("keydown", tasten);
    window.addEventListener("resize", () => { if (istOffen()) einpassen(); });
  }

  // ---------- Öffnen und Schließen ----------
  function oeffnen(quelle) {
    if (!box) aufbauen();
    ausloeser = quelle;
    const adresse = quelle.dataset.gross || quelle.currentSrc || quelle.src;

    bild.alt = quelle.alt || "";
    bild.style.visibility = "hidden";
    box.classList.add("offen");
    document.documentElement.classList.add("lightbox-aktiv");

    bild.onload = einpassen;
    if (bild.getAttribute("src") !== adresse) bild.src = adresse;
    if (bild.complete && bild.naturalWidth) einpassen();

    schliessenKnopf.focus();
  }

  function schliessen() {
    box.classList.remove("offen");
    document.documentElement.classList.remove("lightbox-aktiv");
    zeiger.clear();
    if (ausloeser) ausloeser.focus();
  }

  // ---------- Größe und Position ----------
  function einpassen() {
    const breite = bild.naturalWidth || 1000;
    const hoehe = bild.naturalHeight || 600;
    const platzB = Math.max(100, buehne.clientWidth - 32);
    const platzH = Math.max(100, buehne.clientHeight - 128);   // Platz für Knöpfe und Hinweis
    const faktor = Math.min(platzB / breite, platzH / hoehe);
    basisBreite = breite * faktor;
    basisHoehe = hoehe * faktor;
    zoom = 1;
    begrenzePosition();
    anwenden();
    bild.style.visibility = "visible";
  }

  function zoomeAuf(px, py, neuerZoom) {
    neuerZoom = begrenzeZoom(neuerZoom);
    // Der Bildpunkt unter dem Finger/Mauszeiger bleibt an seiner Stelle
    const bildX = (px - x) / zoom;
    const bildY = (py - y) / zoom;
    x = px - bildX * neuerZoom;
    y = py - bildY * neuerZoom;
    zoom = neuerZoom;
    begrenzePosition();
    anwenden();
  }

  function begrenzePosition() {
    const b = basisBreite * zoom, h = basisHoehe * zoom;
    const vb = buehne.clientWidth, vh = buehne.clientHeight;
    // Kleiner als der Bildschirm: mittig. Größer: Rand darf nicht ins Bild rutschen.
    x = b <= vb ? (vb - b) / 2 : Math.min(0, Math.max(vb - b, x));
    y = h <= vh ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, y));
  }

  function anwenden() {
    // Breite/Höhe statt scale(), damit das Bild auch stark vergrößert scharf bleibt
    bild.style.width = basisBreite * zoom + "px";
    bild.style.height = basisHoehe * zoom + "px";
    bild.style.transform = `translate(${x}px, ${y}px)`;
    buehne.classList.toggle("gezoomt", zoom > 1.01);
  }

  // ---------- Maus, Trackpad, Finger ----------
  function mausrad(e) {
    e.preventDefault();
    const tempo = e.ctrlKey ? 0.01 : 0.0015;          // ctrlKey = Trackpad-Pinch am Mac
    const schritte = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    zoomeAuf(e.clientX, e.clientY, zoom * Math.exp(-schritte * tempo));
  }

  function zeigerRunter(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (zeiger.size === 0) {
      bewegung = 0;
      startZiel = e.target;
    }
    buehne.setPointerCapture(e.pointerId);
    zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.size === 2) {
      const [a, b] = [...zeiger.values()];
      letzteDistanz = abstand(a, b);
      letzteMitte = mitte(a, b);
    }
    buehne.classList.add("zieht");
  }

  function zeigerBewegt(e) {
    if (!zeiger.has(e.pointerId)) return;
    const alt = zeiger.get(e.pointerId);
    const neu = { x: e.clientX, y: e.clientY };
    zeiger.set(e.pointerId, neu);

    if (zeiger.size === 1) {
      // Verschieben
      const dx = neu.x - alt.x, dy = neu.y - alt.y;
      bewegung += Math.abs(dx) + Math.abs(dy);
      x += dx;
      y += dy;
      begrenzePosition();
      anwenden();
    } else if (zeiger.size === 2) {
      // Zwei Finger: zoomen und gleichzeitig verschieben
      const [a, b] = [...zeiger.values()];
      const d = abstand(a, b), m = mitte(a, b);
      const neuerZoom = begrenzeZoom(zoom * (d / letzteDistanz));
      const bildX = (letzteMitte.x - x) / zoom;
      const bildY = (letzteMitte.y - y) / zoom;
      x = m.x - bildX * neuerZoom;
      y = m.y - bildY * neuerZoom;
      zoom = neuerZoom;
      letzteDistanz = d;
      letzteMitte = m;
      bewegung += 100;   // kein Tippen mehr
      begrenzePosition();
      anwenden();
    }
  }

  function zeigerHoch(e) {
    if (!zeiger.has(e.pointerId)) return;
    const warEinzeln = zeiger.size === 1;
    zeiger.delete(e.pointerId);
    if (zeiger.size === 0) buehne.classList.remove("zieht");
    if (warEinzeln && e.type === "pointerup" && bewegung < 8) getippt(e);
  }

  function getippt(e) {
    const jetzt = Date.now();
    const ort = { x: e.clientX, y: e.clientY };
    const doppelt = jetzt - letzterTipp < 320 && letzterTippOrt && abstand(ort, letzterTippOrt) < 30;

    if (doppelt) {
      letzterTipp = 0;
      if (zoom > 1.01) einpassen();
      else zoomeAuf(ort.x, ort.y, 3);
      return;
    }
    letzterTipp = jetzt;
    letzterTippOrt = ort;

    // Einfaches Tippen neben das (nicht gezoomte) Bild schließt
    if (startZiel === buehne && zoom <= 1.01) schliessen();
  }

  // ---------- Tastatur ----------
  function tasten(e) {
    if (!istOffen()) return;
    const mx = buehne.clientWidth / 2, my = buehne.clientHeight / 2;
    if (e.key === "Escape") schliessen();
    else if (e.key === "+" || e.key === "=") zoomeAuf(mx, my, zoom * 1.5);
    else if (e.key === "-") zoomeAuf(mx, my, zoom / 1.5);
    else if (e.key === "0") einpassen();
    else if (e.key === "Tab") {
      // Fokus bleibt in der Vollbildansicht
      const knoepfe = [...box.querySelectorAll("button")];
      const i = knoepfe.indexOf(document.activeElement);
      e.preventDefault();
      const naechster = e.shiftKey ? (i <= 0 ? knoepfe.length - 1 : i - 1) : (i + 1) % knoepfe.length;
      knoepfe[naechster].focus();
    }
  }

  // ---------- Alle EKG-Bilder anklickbar machen ----------
  document.querySelectorAll("img.ekg").forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.title = "Zum Vergrößern anklicken";
    img.addEventListener("click", () => oeffnen(img));
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        oeffnen(img);
      }
    });
  });
})();
