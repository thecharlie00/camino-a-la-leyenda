CREATE TABLE IF NOT EXISTS goat_ladder_careers (
  id TEXT PRIMARY KEY,
  career_key_hash TEXT NOT NULL UNIQUE,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('player', 'manager')),
  display_name TEXT NOT NULL,
  title TEXT NOT NULL,
  current_club TEXT NOT NULL,
  started_season INTEGER,
  latest_season INTEGER,
  created_at TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  history_json TEXT NOT NULL,
  delete_token_hash TEXT NOT NULL,
  seasons INTEGER NOT NULL DEFAULT 0,
  appearances INTEGER,
  goals INTEGER,
  assists INTEGER,
  clean_sheets INTEGER,
  trophies INTEGER NOT NULL DEFAULT 0,
  awards INTEGER NOT NULL DEFAULT 0,
  international_caps INTEGER,
  international_goals INTEGER,
  wins INTEGER,
  draws INTEGER,
  losses INTEGER,
  unbeaten_seasons INTEGER,
  promotions INTEGER,
  clubs INTEGER NOT NULL DEFAULT 0,
  win_percentage INTEGER
);

CREATE INDEX IF NOT EXISTS goat_ladder_careers_player_seasons
  ON goat_ladder_careers (game_mode, seasons DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_manager_wins
  ON goat_ladder_careers (game_mode, wins DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_trophies
  ON goat_ladder_careers (game_mode, trophies DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_appearances
  ON goat_ladder_careers (game_mode, appearances DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_goals
  ON goat_ladder_careers (game_mode, goals DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_assists
  ON goat_ladder_careers (game_mode, assists DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_clean_sheets
  ON goat_ladder_careers (game_mode, clean_sheets DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_awards
  ON goat_ladder_careers (game_mode, awards DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_international_caps
  ON goat_ladder_careers (game_mode, international_caps DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_international_goals
  ON goat_ladder_careers (game_mode, international_goals DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_clubs
  ON goat_ladder_careers (game_mode, clubs DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_draws
  ON goat_ladder_careers (game_mode, draws DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_losses
  ON goat_ladder_careers (game_mode, losses DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_unbeaten_seasons
  ON goat_ladder_careers (game_mode, unbeaten_seasons DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_promotions
  ON goat_ladder_careers (game_mode, promotions DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS goat_ladder_careers_win_percentage
  ON goat_ladder_careers (game_mode, win_percentage DESC, created_at ASC);
