exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createType('appearance_mode', ['light', 'dark', 'system']);

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    ad_dn: { type: 'text', notNull: true, unique: true },
    username: { type: 'text', notNull: true },
    upn: { type: 'text' },
    email: { type: 'text' },
    display_name: { type: 'text' },
    job_title: { type: 'text' },
    department: { type: 'text' },
    avatar_url: { type: 'text' },
    is_active: { type: 'boolean', notNull: true, default: true },
    last_login_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createIndex('users', 'username');
  pgm.createIndex('users', 'email');

  pgm.createTable(
    'user_group_memberships',
    {
      user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
      group_dn: { type: 'text', notNull: true },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
    },
    {
      constraints: {
        primaryKey: ['user_id', 'group_dn']
      }
    }
  );

  pgm.createIndex('user_group_memberships', 'group_dn');

  pgm.createTable('user_profiles', {
    user_id: { type: 'uuid', primaryKey: true, references: 'users(id)', onDelete: 'cascade' },
    bio: { type: 'text' },
    phone: { type: 'text' },
    location: { type: 'text' },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createTable('user_settings', {
    user_id: { type: 'uuid', primaryKey: true, references: 'users(id)', onDelete: 'cascade' },
    appearance: { type: 'appearance_mode', notNull: true, default: 'system' },
    notification_prefs: { type: 'jsonb', notNull: true, default: '{}' },
    biometric_enabled: { type: 'boolean', notNull: true, default: false },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createTable('auth_login_events', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'set null' },
    username: { type: 'text' },
    success: { type: 'boolean', notNull: true },
    failure_reason: { type: 'text' },
    ip: { type: 'text' },
    user_agent: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createIndex('auth_login_events', ['user_id', 'created_at']);
  pgm.createIndex('auth_login_events', ['username', 'created_at']);
};

exports.down = (pgm) => {
  pgm.dropTable('auth_login_events');
  pgm.dropTable('user_settings');
  pgm.dropTable('user_profiles');
  pgm.dropTable('user_group_memberships');
  pgm.dropTable('users');
  pgm.dropType('appearance_mode');
  pgm.dropExtension('pgcrypto', { ifExists: true });
};

