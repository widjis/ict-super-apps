exports.up = (pgm) => {
  pgm.sql(`CREATE TABLE photo_sync_retry (
    employee_id text PRIMARY KEY,
    failures integer NOT NULL DEFAULT 0 CHECK (failures >= 0),
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    last_attempt_at timestamptz,
    outcome text NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending','missing','error'))
  );
  CREATE INDEX photo_sync_retry_due ON photo_sync_retry(next_attempt_at, employee_id);
  CREATE TABLE photo_sync_status (
    id integer PRIMARY KEY CHECK (id = 1),
    failures integer NOT NULL DEFAULT 0,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    counts jsonb NOT NULL DEFAULT '{}'
  );
  INSERT INTO photo_sync_status(id) VALUES (1);`);
};
exports.down = (pgm) => {
  pgm.dropTable('photo_sync_retry');
  pgm.dropTable('photo_sync_status');
};
