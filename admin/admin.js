// admin/admin.js
// Admin paneļa loģika (v1)

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
      window.location.href = "/admin/panel.html";
    });

    return;
  }

  // ===== Admin paneļa lapa =====
  if (!token) {
    alert("Nav admin piekļuves. Lūdzu ielogojies.");
    window.location.href = "/admin";
    return;
  }

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("ADMIN_TOKEN");
      window.location.href = "/admin";
    });
  }
  
  // ===== Import no seed (vienreizēja operācija) =====
const btnImportSeed = document.getElementById("btnImportSeed");
if (btnImportSeed) {
  btnImportSeed.addEventListener("click", async () => {
    const yes = confirm("Importēt trūkstošos līmeņus no seed/levels.json?");
    if (!yes) return;

    btnImportSeed.disabled = true;
    const oldText = btnImportSeed.textContent;
    btnImportSeed.textContent = "Importēju…";

    try {
      const res = await fetch("/api/admin/import-seed", {
        method: "POST",
        headers: { "x-admin-token": token }
      });

      if (res.status === 401) {
        alert("Nav piekļuves (nepareiza admin atslēga).");
        localStorage.removeItem("ADMIN_TOKEN");
        window.location.href = "/admin";
        return;
      }

      const data = await res.json().catch(() => null);
      if (!data || !data.ok) {
        alert("Importa kļūda. Paskaties Railway logs.");
        return;
      }

      alert(
        `Imports pabeigts!\n` +
        `Seedā kopā: ${data.summary.totalInSeed}\n` +
        `Ielikti: ${data.summary.inserted}\n` +
        `Izlaisti (jau bija): ${data.summary.skipped}`
      );

      const levels = await fetchAdminLevels();
      renderLevels(levels);

    } catch (e) {
      console.error(e);
      alert("Neizdevās izpildīt importu (skat. Console).");
    } finally {
      btnImportSeed.disabled = false;
      btnImportSeed.textContent = oldText;
    }
  });
}

  const levelsListEl = document.getElementById("levelsList");
  const statusEl = document.getElementById("statusLine");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  async function fetchAdminLevels(){
    setStatus("Ielādēju līmeņus…");

    let res;
    try {
      res = await fetch("/api/admin/levels", {
        headers: { "x-admin-token": token }
      });
    } catch (e) {
      setStatus("Kļūda: nevaru pieslēgties serverim.");
      return [];
    }

    if (res.status === 401) {
      alert("Nav piekļuves (nepareiza admin atslēga).");
      localStorage.removeItem("ADMIN_TOKEN");
      window.location.href = "/admin";
      return [];
    }

    if (res.status === 404) {
      setStatus("Kļūda: serverī nav GET /api/admin/levels. (Jāpieliek server.js)");
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

  function renderLevels(levels){
    if (!levelsListEl) return;

    if (!levels.length){
      levelsListEl.innerHTML =
        '<div class="level-row"><div class="level-meta"><div class="name">Nav līmeņu</div><div class="desc">DB ir tukša vai /api/admin/levels nav pieejams.</div></div></div>';
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
        const levels = await fetchAdminLevels();
        renderLevels(levels);
      }

      btn.disabled = false;
    });
  }

  (async () => {
    const levels = await fetchAdminLevels();
    renderLevels(levels);
  })();

})();
