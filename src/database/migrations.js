export const MIGRATIONS = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('expense','income')),
          sort_order INTEGER DEFAULT 0,
          is_preset INTEGER DEFAULT 0,
          is_deleted INTEGER DEFAULT 0,
          created_at TEXT NOT NULL
        );
      `);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          amount REAL NOT NULL CHECK(amount > 0),
          category_id TEXT REFERENCES categories(id),
          type TEXT NOT NULL CHECK(type IN ('expense','income')),
          note TEXT,
          date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );
      `);
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category_id);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tx_type_date ON transactions(type, date);');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS images (
          id TEXT PRIMARY KEY,
          transaction_id TEXT REFERENCES transactions(id),
          file_path TEXT NOT NULL,
          thumbnail_path TEXT,
          width INTEGER,
          height INTEGER,
          created_at TEXT NOT NULL
        );
      `);
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_img_tx ON images(transaction_id);');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at TEXT NOT NULL
        );
      `);
    },
  },
];

export async function runMigrations(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = await db.getAllAsync('SELECT version FROM _migrations ORDER BY version');
  const appliedVersions = new Set(applied.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO _migrations (version, applied_at) VALUES (?, ?)',
        [migration.version, new Date().toISOString()]
      );
    }
  }
}
