// ============================================================
// Sprechblasen für Begriffe im Text
// Verwendung im HTML:
//   Unterstrichener Begriff:
//   <span class="begriff">Deltawelle<span class="info">Kurze Erklärung …</span></span>
//   Sprechblasen-Symbol hinter dem Text:
//   Aortenenge <span class="notiz"><span class="info">Anmerkung …</span></span>
// Desktop: Maus darüber -> Blase erscheint, Klick -> Blase bleibt offen
// Handy:   Antippen -> Blase erscheint, erneut tippen oder daneben -> zu
// ============================================================
(function () {
  const begriffe = document.querySelectorAll(".begriff, .notiz");
  if (!begriffe.length) return;

  const SYMBOL = '<svg class="notiz-symbol" viewBox="0 0 24 22" aria-hidden="true">' +
    '<path d="M3.5 2.5h17a1 1 0 0 1 1 1v10.5a1 1 0 0 1-1 1H10.5l-4.5 4v-4H3.5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"/></svg>';

  const blase = document.createElement("div");
  blase.className = "sprechblase";
  blase.id = "sprechblase";
  blase.setAttribute("role", "tooltip");
  blase.hidden = true;
  blase.innerHTML = '<div class="sprechblase-inhalt"></div><span class="sprechblase-pfeil"></span>';
  document.body.appendChild(blase);
  const inhalt = blase.querySelector(".sprechblase-inhalt");
  const pfeil = blase.querySelector(".sprechblase-pfeil");

  let aktiv = null;      // Begriff, dessen Blase gerade offen ist
  let fixiert = false;   // per Klick/Tippen geöffnet -> bleibt offen
  let timer = null;

  begriffe.forEach((begriff) => {
    if (!begriff.querySelector(".info")) return;
    if (begriff.classList.contains("notiz")) {
      begriff.insertAdjacentHTML("afterbegin", SYMBOL);
      begriff.setAttribute("aria-label", "Anmerkung anzeigen");
      bleibtAmWort(begriff);
    }
    begriff.tabIndex = 0;
    begriff.setAttribute("role", "button");
    begriff.setAttribute("aria-expanded", "false");

    begriff.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || fixiert) return;
      clearTimeout(timer);
      zeigen(begriff);
    });
    begriff.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse" && !fixiert) spaeterVerstecken();
    });
    begriff.addEventListener("click", (e) => {
      e.preventDefault();
      if (aktiv === begriff && fixiert) {
        verstecken();
      } else {
        zeigen(begriff);
        fixiert = true;
      }
    });
    begriff.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        begriff.click();
      }
    });
  });

  // Maus darf in die Blase wandern, ohne dass sie verschwindet
  blase.addEventListener("pointerenter", () => clearTimeout(timer));
  blase.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && !fixiert) spaeterVerstecken();
  });

  // Klick oder Tippen daneben schließt
  document.addEventListener("click", (e) => {
    if (!aktiv) return;
    if (blase.contains(e.target) || aktiv.contains(e.target)) return;
    verstecken();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aktiv) {
      const warFixiert = fixiert, begriff = aktiv;
      verstecken();
      if (warFixiert) begriff.focus();
    }
  });

  window.addEventListener("resize", () => { if (aktiv) positionieren(); });

  // Das Symbol soll nie allein in eine neue Zeile rutschen:
  // letztes Wort davor und Symbol werden zusammengehalten.
  function bleibtAmWort(notiz) {
    const vorher = notiz.previousSibling;
    if (!vorher || vorher.nodeType !== Node.TEXT_NODE) return;
    const treffer = vorher.textContent.match(/(\S+\s*)$/);
    if (!treffer) return;
    vorher.textContent = vorher.textContent.slice(0, -treffer[1].length);
    const klammer = document.createElement("span");
    klammer.style.whiteSpace = "nowrap";
    notiz.before(klammer);
    klammer.append(document.createTextNode(treffer[1]), notiz);
  }

  function zeigen(begriff) {
    if (aktiv && aktiv !== begriff) aktiv.setAttribute("aria-expanded", "false");
    aktiv = begriff;
    fixiert = false;
    inhalt.innerHTML = begriff.querySelector(".info").innerHTML;
    blase.hidden = false;
    begriff.setAttribute("aria-expanded", "true");
    begriff.setAttribute("aria-describedby", "sprechblase");
    positionieren();
  }

  function verstecken() {
    clearTimeout(timer);
    blase.hidden = true;
    if (aktiv) {
      aktiv.setAttribute("aria-expanded", "false");
      aktiv.removeAttribute("aria-describedby");
    }
    aktiv = null;
    fixiert = false;
  }

  function spaeterVerstecken() {
    clearTimeout(timer);
    timer = setTimeout(verstecken, 150);
  }

  function positionieren() {
    // Bei Begriffen über zwei Zeilen an der ersten Zeile ausrichten
    const r = aktiv.getClientRects()[0] || aktiv.getBoundingClientRect();
    const rand = 8, abstand = 10;
    const breite = blase.offsetWidth, hoehe = blase.offsetHeight;
    const sichtB = document.documentElement.clientWidth;
    const kopf = document.querySelector(".kopf");
    const kopfUnten = kopf ? kopf.getBoundingClientRect().bottom : 0;

    let links = r.left + r.width / 2 - breite / 2;
    links = Math.max(rand, Math.min(sichtB - breite - rand, links));

    // Normalerweise unter dem Begriff, bei zu wenig Platz darüber
    const platzUnten = window.innerHeight - r.bottom;
    const platzOben = r.top - kopfUnten;
    const nachOben = platzUnten < hoehe + abstand + rand && platzOben > hoehe + abstand + rand;
    const oben = nachOben ? r.top - hoehe - abstand : r.bottom + abstand;

    blase.classList.toggle("oben", nachOben);
    blase.style.left = links + window.scrollX + "px";
    blase.style.top = oben + window.scrollY + "px";

    const pfeilX = Math.max(14, Math.min(breite - 14, r.left + r.width / 2 - links));
    pfeil.style.left = pfeilX + "px";
  }
})();
