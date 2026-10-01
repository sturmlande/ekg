// ============================================================
// Liste aller Seiten in der richtigen Reihenfolge.
// Nur hier ändern – Seitenleiste und Vor/Zurück passen sich
// auf allen Seiten automatisch an.
// ============================================================
const SEITEN = [
  { datei: "index.html",     titel: "Einleitung" },
  { datei: "fall-1.html",    titel: "Fall 1" },
  { datei: "fall-2.html",    titel: "Fall 2" },
  { datei: "fall-3.html",    titel: "Fall 3" },
  { datei: "fall-4a.html",   titel: "Fall 4a" },
  { datei: "fall-4b.html",   titel: "Fall 4b" },
  { datei: "fall-5.html",    titel: "Fall 5" },
  { datei: "fall-6.html",    titel: "Fall 6" },
  { datei: "fall-7.html",    titel: "Fall 7" },
  { datei: "abschluss.html", titel: "Abschluss" },
];

(function () {
  // Welche Seite ist gerade offen?
  let aktuell = location.pathname.split("/").pop();
  if (!aktuell) aktuell = "index.html";                    // .../ekg/
  else if (!aktuell.includes(".")) aktuell += ".html";     // .../ekg/fall-1
  const index = SEITEN.findIndex((s) => s.datei === aktuell);

  // Seitenleiste füllen
  const leiste = document.getElementById("seitenleiste");
  if (leiste) {
    // Titel oben in der Seitenleiste (wird gezeigt, wenn die Kopfzeile ausgeblendet ist)
    const titel = document.createElement("a");
    titel.className = "leiste-titel";
    titel.href = "index.html";
    const kopfTitel = document.querySelector(".seitentitel");
    titel.textContent = kopfTitel ? kopfTitel.textContent : "EKG-Vortrag";
    leiste.appendChild(titel);

    const liste = document.createElement("ul");
    SEITEN.forEach((seite, i) => {
      const eintrag = document.createElement("li");
      const link = document.createElement("a");
      link.href = seite.datei;
      link.textContent = seite.titel;
      if (i === index) link.setAttribute("aria-current", "page");
      eintrag.appendChild(link);
      liste.appendChild(eintrag);
    });
    leiste.appendChild(liste);
  }

  // Vor- und Zurückblättern am Seitenende
  const blaettern = document.getElementById("blaettern");
  if (blaettern && index !== -1) {
    const vorher = SEITEN[index - 1];
    const nachher = SEITEN[index + 1];
    if (vorher) blaettern.appendChild(blaetterLink(vorher, "Vorheriges Thema", "zurueck"));
    if (nachher) blaettern.appendChild(blaetterLink(nachher, "Nächstes Thema", "weiter"));
  }

  function blaetterLink(seite, hinweis, klasse) {
    const link = document.createElement("a");
    link.href = seite.datei;
    link.className = klasse;
    const klein = document.createElement("span");
    klein.className = "hinweis";
    klein.textContent = hinweis;
    const titel = document.createElement("span");
    titel.className = "titel";
    titel.textContent = seite.titel;
    link.append(klein, titel);
    return link;
  }

  // Aufklappbares Menü auf dem Handy
  const knopf = document.getElementById("menu-knopf");
  if (knopf && leiste) {
    const schleier = document.createElement("div");
    schleier.className = "schleier";
    document.body.appendChild(schleier);

    const menue = (offen) => {
      document.body.classList.toggle("menue-offen", offen);
      knopf.setAttribute("aria-expanded", String(offen));
      knopf.setAttribute("aria-label", offen ? "Menü schließen" : "Menü öffnen");
    };

    knopf.addEventListener("click", () =>
      menue(!document.body.classList.contains("menue-offen"))
    );
    schleier.addEventListener("click", () => menue(false));
    leiste.addEventListener("click", (e) => {
      if (e.target.closest("a")) menue(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") menue(false);
    });
  }
})();
