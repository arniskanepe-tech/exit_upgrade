// admin/admin.js
// Admin paneļa loģika (v1)
//
// ŠIS FAILS:
// - satur visu admin uzvedību (JS)
// - ir atdalīts no spēles loģikas (game.js)
//
// Šobrīd (v1):
// - Login lapā: saglabā ADMIN_TOKEN un pārsūta uz /admin/panel.html
// - Panelī: ielādē līmeņus no DB (GET /api/admin/levels)
// - Panelī: ļauj ieslēgt/izslēgt līmeni (PUT /api/admin/levels/:id, body {active})
// - Ir poga "Iziet" (logout), kas izdzēš tokenu

(function () {
  const isLoginPage = !!document.getElementById("loginForm");
  const token = localStorage.getItem("ADMIN_TOKEN");

  // ===== Login lapa (/admin) =====
  if (isLoginPage) {
    const form = document.getElementById("loginForm");
    const input = document.getElementById("token");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const t = (input.value || "").trim();

      if (!t) {
        alert("Ievadi admin atslēgu");
        return;
      }

      localStorage.setItem("ADMIN_TOKEN", t);
      // Pēc veiksmīga login ejam uz paneli
      window.location.href = "/admin/panel.html";
    });

    return; // login lapā ar to pietiek
  }

  // ===== Admin paneļa lapas (piem. /admin/panel.html) =====
  if (!token) {
    alert("Nav admin piekļuves. Lūdzu ielogojies.");
    window.location.href = "/admin";
    return;
  }

  // Logout poga (ja ir)
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("ADMIN_TOKEN");
      window.location.href = "/admin";
    });
  }

  const levelsListEl = document.getElementById("levelsList");
  const statusEl = document.getElementById("statusLine");

  function setStatus(msg){
    if (statusEl) statusEl.textContent = msg;
  }

  async function fetchAdminLevels(){
    setStatus("Ielādēju līmeņus…");
    const res = await fetch("/api/admin/levels", {
      headers: {
        "x-admin-token": token
      }
    });

    if (res.status === 401) {
      alert("Nav piekļuves (nepareiza admin atslēga).");
      localStorage.removeItem("ADMIN_TOKEN");
      window.location.href = "/admin";
      return [];
    }

    const data = await res.json().catch(() => null);
    if (!data || !data.ok) {
      setStatus("Kļūda ielādējot līmeņus.");
      return [];
    }

    setStatus(`Līmeņi ielādēti: ${data.levels.length}`);
    return data.levels;
  }

  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function renderLevels(levels){
    if (!levelsListEl) return;

    if (!levels.length){
      levelsListEl.innerHTML = '<div class="level-row"><div class="level-meta"><div class="name">Nav līmeņu</div><div class="desc">DB ir tukša vai nav seed.</div></div></div>';
      return;
    }

    levelsListEl.innerHTML = levels.map(lvl => {
      const active = !!lvl.active;
      const badge = active ? "ACTIVE" : "INACTIVE";
      const badgeClass = active ? "badge badge-on" : "badge badge-off";
      return `
        <div class="level-row" data-id="${lvl.id}" data-active="${active}">
          <div class="level-meta">
            <div class="name">${escapeHtml(lvl.title)} <span class="${badgeClass}">${badge}</span></div>
            <div class="desc">bg: ${escapeHtml(lvl.background)} • target: ${lvl.targetSlot} • sort: ${lvl.sortOrder}</div>
          </div>

          <button class="btn-toggle" type="button" data-action="toggle">
            ${active ? "Izslēgt" : "Ieslēgt"}
          </button>
        </div>
      `;
    }).join("");
  }

  async function toggleActive(id, newActive){
    const res = await fetch(`/api/admin/levels/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify({ active: newActive })
    });

    if (res.status === 401) {
      alert("Nav piekļuves (nepareiza admin atslēga).");
      localStorage.removeItem("ADMIN_TOKEN");
      window.location.href = "/admin";
      return false;
    }

    const data = await res.json().catch(() => null);
    if (!data || !data.ok) {
      alert("Neizdevās atjaunināt līmeni.");
      return false;
    }
    return true;
  }

  // Klikšķu apstrāde ar event delegation (vienkārši, droši)
  if (levelsListEl) {
    levelsListEl.addEventListener("click", async (e) => {
      const btn = e.target.closest('button[data-action="toggle"]');
      if (!btn) return;

      const row = btn.closest(".level-row");
      if (!row) return;

      const id = Number(row.dataset.id);
      const isActive = (row.dataset.active === "true");
      const nextActive = !isActive;

      btn.disabled = true;
      btn.textContent = "…";

      const ok = await toggleActive(id, nextActive);
      if (ok) {
        // Vienkāršākais: pārlādējam sarakstu no DB
        const levels = await fetchAdminLevels();
        renderLevels(levels);
      }

      btn.disabled = false;
    });
  }

  // Start: ielādē un uzzīmē līmeņus
  (async () => {
    const levels = await fetchAdminLevels();
    renderLevels(levels);
  })();

})();
