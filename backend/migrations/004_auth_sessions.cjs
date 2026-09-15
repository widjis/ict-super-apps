exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.createTable('auth_sessions', {
    id: { type: 'uuid', primaryKey: true },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    claims: { type: 'jsonb', notNull: true },
    current_hash: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    idle_expires_at: { type: 'timestamptz', notNull: true },
    revoked_at: { type: 'timestamptz' }
  });
  pgm.createIndex('auth_sessions', 'user_id');
  pgm.createIndex('auth_sessions', 'expires_at');
  pgm.createTable('auth_refresh_tokens', {
    token_hash: { type: 'text', primaryKey: true },
    session_id: { type: 'uuid', notNull: true, references: 'auth_sessions(id)', onDelete: 'cascade' },
    used_at: { type: 'timestamptz' }
  });
  pgm.createIndex('auth_refresh_tokens', 'session_id');
};
exports.down = (pgm) => {
  pgm.dropTable('auth_refresh_tokens');
  pgm.dropTable('auth_sessions');
};
