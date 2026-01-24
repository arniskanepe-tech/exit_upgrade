(() => {
  // =========================================================
  // Admin JS (vienā failā: login + panel)
  // - ja lapā ir #loginForm -> login režīms
  // - citādi -> panel režīms
  // =========================================================

  const $ = (id) => document.getElementById(id);

  function getToken() {
    return localStorage.getItem("adminToken") || "";
  }

  function setToken(v) {
    localStorage.setItem("adminToken", v || "");
  }

  async function apiJSON(url, opts = {}) {
    const headers = Object.assign({}, opts.headers || {});
    const tok = getToken();
    if (tok) headers["x-admin-token"] = tok;

    if (!headers["Content-Type"] && opts.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, { ...opts, headers });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      // ignore
    }

    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  // =========================================================
  // 1) LOGIN REŽĪMS
  // =========================================================
  const loginForm = $("loginForm");
  const tokenInput = $("tokenInput");
  const btnLogin = $("btnLogin");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tok = String(tokenInput?.value || "").trim();
      setToken(tok);

      // quick ping
      try {
        await apiJSON("/api/admin/levels");
        window.location.href = "/admin/panel";
      } catch (err) {
        alert(err.message || "Neizdevās pieslēgties.");
      }
    });

    if (btnLogin) btnLogin.disabled = false;
    return; // login mode ends
  }

  // =========================================================
  // 2) PANEL REŽĪMS
  // =========================================================

  // ====== DOM ======
  const statusLine = $("statusLine");
  const levelsList = $("levelsList");
  const sortBy = $("sortBy");
  const sortDir = $("sortDir");

  const btnImportSeed = $("btnImportSeed");
  const btnAdd = $("btnAdd");
  const btnLogout = $("btnLogout");

  // modal
  const levelModal = $("levelModal");
  const modalTitle = $("modalTitle");
  const levelForm = $("levelForm");

  const f_id = $("f_id");
  const f_title = $("f_title");
  const f_bg = $("f_bg");
  const f_slot = $("f_slot");
  const f_sort = $("f_sort");
  const f_answer = $("f_answer");
  const f_card = $("f_card");
  const f_hint1 = $("f_hint1");
  const f_hint2 = $("f_hint2");
  const f_hint3 = $("f_hint3");
  const f_active = $("f_active");

  // ====== state ======
  let levelsCache = [];

  function getSortState(){
    return {
      order: localStorage.getItem("adminLevelsOrder") || "sort",
      dir: localStorage.getItem("adminLevelsDir") || "asc",
    };
  }

  function setSortState(order, dir){
    localStorage.setItem("adminLevelsOrder", order);
    localStorage.setItem("adminLevelsDir", dir);
  }

  function setStatus(msg) {
    if (statusLine) statusLine.textContent = msg;
  }

  // ====== modal helpers ======
  function openModal() {
    if (!levelModal) return;
    levelModal.classList.add("is-open");
    levelModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!levelModal) return;
    levelModal.classList.remove("is-open");
    levelModal.setAttribute("aria-hidden", "true");
  }

  function fillForm(level) {
    f_id.value = level?.id ?? "";
    f_title.value = level?.title ?? "";
    f_bg.value = level?.background ?? "";
    f_slot.value = level?.targetSlot ?? 1;
    f_sort.value = level?.sortOrder ?? 100;
    f_answer.value = level?.answer ?? "";
    f_card.value = level?.cardHtml ?? "";
    f_hint1.value = level?.hint1 ?? "";
    f_hint2.value = level?.hint2 ?? "";
    f_hint3.value = level?.hint3 ?? "";
    f_active.checked = !!level?.active;
  }

  function readForm() {
    return {
      id: f_id.value ? Number(f_id.value) : null,
      title: f_title.value.trim(),
      background: f_bg.value.trim() || null,
      targetSlot: Number(f_slot.value),
      sortOrder: Number(f_sort.value || 100),
      answer: f_answer.value.trim(),
      cardHtml: f_card.value || "",
      hint1: f_hint1.value || null,
      hint2: f_hint2.value || null,
      hint3: f_hint3.value || null,
      active: !!f_active.checked,
    };
  }

  // ====== render list ======
  function esc(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderLevels(list) {
    if (!levelsList) return;
    levelsList.innerHTML = "";

    for (const l of list) {
      const row = document.createElement("div");
      row.className = "level-row";

      const badge = l.active
        ? `<span class="pill pill--green">active</span>`
        : `<span class="pill pill--brown">off</span>`;

      row.innerHTML = `
        <div class="level-row__left">
          <div class="level-row__title">
            <strong>#${esc(l.id)} — ${esc(l.title || "")}</strong>
            ${badge}
          </div>
          <div class="level-row__meta muted">
            sort: ${esc(l.sortOrder)} · slot: ${esc(l.targetSlot)} · bg: ${esc(
        l.background || ""
      )}
          </div>
        </div>

        <div class="level-row__right">
          <button class="btn btn--ghost" data-edit-id="${esc(l.id)}">Edit</button>
          <button class="btn" data-toggle-id="${esc(l.id)}">
            ${l.active ? "Izslēgt" : "Ieslēgt"}
          </button>
        </div>
      `;
      levelsList.appendChild(row);
    }
  }

  async function loadLevels() {
    setStatus("Ielādēju līmeņus...");

    const s = getSortState();
    const url = `/api/admin/levels?order=${encodeURIComponent(s.order)}&dir=${encodeURIComponent(s.dir)}`;

    const data = await apiJSON(url);
    levelsCache = data.levels || [];
    renderLevels(levelsCache);
    setStatus(`Līmeņi: ${levelsCache.length}`);
  }

  // ====== events: list buttons ======
  if (levelsList) {
    levelsList.addEventListener("click", async (e) => {
      const toggleBtn = e.target.closest("[data-toggle-id]");
      const editBtn = e.target.closest("[data-edit-id]");

      if (toggleBtn) {
        const id = Number(toggleBtn.getAttribute("data-toggle-id"));
        try {
          await apiJSON(`/api/admin/levels/${id}/toggle`, { method: "POST" });
          await loadLevels();
        } catch (err) {
          alert(err.message || "Neizdevās pārslēgt.");
        }
      }

      if (editBtn) {
        const id = Number(editBtn.getAttribute("data-edit-id"));
        const level = levelsCache.find((x) => Number(x.id) === id);
        if (!level) return;

        modalTitle.textContent = `Edit #${id}`;
        fillForm(level);
        openModal();
      }
    });
  }

  // ====== events: modal close ======
  if (levelModal) {
    levelModal.addEventListener("click", (e) => {
      if (e.target?.dataset?.close) closeModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  // ====== add new ======
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      modalTitle.textContent = "Pievienot līmeni";
      fillForm({
        id: "",
        title: "",
        background: "bg/bg.jpg",
        targetSlot: 1,
        sortOrder: 100,
        answer: "",
        cardHtml: "",
        hint1: "",
        hint2: "",
        hint3: "",
        active: true,
      });
      openModal();
    });
  }

  // ====== save ======
  if (levelForm) {
    levelForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = readForm();

      if (!payload.title || !payload.answer) {
        alert("Nepietiek dati: title + answer ir obligāti.");
        return;
      }

      try {
        if (payload.id) {
          await apiJSON(`/api/admin/levels/${payload.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else {
          await apiJSON("/api/admin/levels", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        closeModal();
        await loadLevels();
        setStatus("Saglabāts.");
      } catch (err) {
        alert(err.message || "Saglabāšana neizdevās.");
      }
    });
  }

  // ====== import seed ======
  if (btnImportSeed) {
    btnImportSeed.addEventListener("click", async () => {
      if (!confirm("Importēt seed? (ja dublikāti, tie tiks izlaisti)")) return;

      try {
        setStatus("Importēju seed...");
        const data = await apiJSON("/api/admin/levels/import-seed", { method: "POST" });
        setStatus(`Seed imports OK. Inserted: ${data?.summary?.inserted ?? 0}, skipped: ${data?.summary?.skipped ?? 0}`);
        await loadLevels();
      } catch (err) {
        alert(err.message || "Seed imports neizdevās.");
        setStatus("Seed imports neizdevās.");
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin";
    });
  }

  // ====== init ======
  // init sorting UI
  const s = getSortState();
  if (sortBy) sortBy.value = s.order;
  if (sortDir) sortDir.value = s.dir;

  function onSortChange(){
    const order = sortBy?.value || "sort";
    const dir = sortDir?.value || "asc";
    setSortState(order, dir);
    loadLevels().catch(() => {});
  }

  if (sortBy) sortBy.addEventListener("change", onSortChange);
  if (sortDir) sortDir.addEventListener("change", onSortChange);

  loadLevels().catch((e) => {
    console.error(e);
    setStatus("Neizdevās ielādēt līmeņus (pārbaudi atslēgu / token).");
  });
})();
