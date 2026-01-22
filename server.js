// server.js
// Disku spēle + Admin v1 (serveris)
//
// ŠIS SERVERIS (šobrīd):
// 1) Servē statiskos failus (spēle un admin lapas)
// 2) Dod stabilus URL /admin un /admin/panel.html
//
// Vēlākajos soļos mēs pievienosim:
// - PostgreSQL (Railway) pieslēgumu
// - /api/levels un /api/admin/levels maršrutus

const path = require("path");
const express = require("express");
const fs = require("fs");

// DB (PostgreSQL)
const db = require("./db");

// Vienkārša migrācija: izpildām SQL failu startējoties,
// lai tabula 'levels' eksistētu.
async function runMigrations(){
  const sqlPath = path.join(__dirname, "migrations", "001_init.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await db.query(sql);
  console.log("DB migrācijas izpildītas (001_init.sql)");
}

// Ieliek 1 demo līmeni, ja DB ir tukša.
// (Lai spēle uzreiz “dzīvo”, pat ja admin vēl nav ielicis līmeņus.)
// Sākotnējie dati: ieliekam visus līmeņus no seed/levels.json,
// bet TIKAI tad, ja tabula levels ir tukša.
async function seedIfEmpty(){
  const { rows } = await db.query("SELECT COUNT(*)::int AS count FROM levels");
  const count = rows?.[0]?.count ?? 0;
  if (count > 0) {
    console.log(`Seed nav vajadzīgs (levels ieraksti: ${count})`);
    return;
  }

  const seedPath = path.join(__dirname, "seed", "levels.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  const seedLevels = JSON.parse(raw);

  console.log(`Seed: ielieku ${seedLevels.length} līmeņus...`);

  for (const lvl of seedLevels) {
    await db.query(
      `INSERT INTO levels (title, background, target_slot, answer, card_html, hint1, hint2, hint3, active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        lvl.title ?? "Uzdevums",
        lvl.background ?? "bg.jpg",
        Number(lvl.targetSlot ?? 1),
        String(lvl.answer ?? ""),
        String(lvl.cardHtml ?? ""),
        lvl.hint1 ?? null,
        lvl.hint2 ?? null,
        lvl.hint3 ?? null,
        (lvl.active !== undefined ? !!lvl.active : true),
        Number(lvl.sortOrder ?? 100),
      ]
    );
  }

  console.log("Seed pabeigts.");
}

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// 1) Statiskie faili (spēles sakne)
//    Šeit pieņemam, ka index.html un assets atrodas projekta saknē.
app.use(express.static(path.join(__dirname)));

// 2) /admin -> admin login lapa
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});

// 3) /admin/panel -> ērtāks URL (bez .html)
app.get("/admin/panel", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "panel.html"));
});

// 4) Healthcheck (ērti Railway)


// ===== Admin aizsardzība (v1) =====
// Mērķis: ļoti vienkārši aizsargāt admin API ar vienu atslēgu.
// Klients (admin panelis) sūta header:  x-admin-token: <atslēga>
// Serveris salīdzina ar ENV mainīgo: ADMIN_TOKEN
function requireAdmin(req, res, next){
  const expected = process.env.ADMIN_TOKEN;

  // Ja ADMIN_TOKEN nav uzstādīts, mēs atļaujam piekļuvi (dev režīms),
  // bet izdrukājam brīdinājumu. Railway vidē mēs noteikti uzliksim ADMIN_TOKEN.
  if (!expected) {
    console.warn("BRĪDINĀJUMS: ADMIN_TOKEN nav uzstādīts. Admin API ir atvērts (dev režīms).");
    return next();
  }

  const got = req.headers["x-admin-token"];
  if (got && String(got) === String(expected)) return next();

  return res.status(401).json({ ok: false, error: "Unauthorized" });
}

// ===== API (spēlei) =====
// Atgriež tikai aktīvos līmeņus pareizā secībā
app.get("/api/levels/active", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, title, background, target_slot AS "targetSlot", answer,
              card_html AS "cardHtml", hint1, hint2, hint3
       FROM levels
       WHERE active = TRUE
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ ok: true, levels: rows });
  } catch (err) {
    console.error("Kļūda /api/levels/active:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// Atjaunina līmeni (v1: tikai active ieslēgšana/izslēgšana)
app.put("/api/admin/levels/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "Bad id" });
    }

    // v1: pieņemam tikai { active: true/false }
    const { active } = req.body || {};
    if (typeof active !== "boolean") {
      return res.status(400).json({ ok: false, error: "Body must contain boolean 'active'" });
    }

    const { rows } = await db.query(
      `UPDATE levels
       SET active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, active, updated_at AS "updatedAt"`,
      [active, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    res.json({ ok: true, level: rows[0] });
  } catch (err) {
    console.error("Kļūda PUT /api/admin/levels/:id:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});



(async () => {
  try {
    await runMigrations();
    await seedIfEmpty();
  } catch (err) {
    console.error("Kļūda migrācijās:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Serveris darbojas: http://localhost:${PORT}`);
  });
})();
