-- migrations/001_init.sql
-- DB inicializācija: tabula "levels" (Disku spēle)

CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,

  -- Cilvēkam saprotams nosaukums (admin panelī)
  title TEXT NOT NULL DEFAULT 'Uzdevums',

  -- Fona attēla fails (piem.: "bg.jpg" vai "bg1.jpg")
  background TEXT NOT NULL DEFAULT 'bg.jpg',

  -- Kurš "slots" ir mērķis (1..9)
  target_slot INTEGER NOT NULL DEFAULT 1,

  -- Pareizā atbilde (piem.: "345")
  answer TEXT NOT NULL,

  -- Galvenās kārts HTML saturs (tas, ko redz spēlētājs)
  card_html TEXT NOT NULL DEFAULT '',

  -- 3 padomi (hint) konkrētajam līmenim
  hint1 TEXT,
  hint2 TEXT,
  hint3 TEXT,

  -- Vai līmenis ir aktīvs šajā spēles sesijā
  active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Kārtība (mazāks skaitlis = agrāk spēlē)
  sort_order INTEGER NOT NULL DEFAULT 100,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ātrākai atlasīšanai spēlei (active + sort)
CREATE INDEX IF NOT EXISTS idx_levels_active_sort ON levels (active, sort_order, id);
