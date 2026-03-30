exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('prf_item_checks', {
    prf_item_id: { type: 'int', primaryKey: true },
    prf_id: { type: 'int', notNull: true },
    prf_no: { type: 'text' },
    check_status: { type: 'text', notNull: true, default: 'Pending' },
    notes: { type: 'text' },
    checked_by_user_id: { type: 'uuid', references: 'users(id)', onDelete: 'set null' },
    checked_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createIndex('prf_item_checks', 'prf_id');
  pgm.createIndex('prf_item_checks', 'checked_at');
};

exports.down = (pgm) => {
  pgm.dropTable('prf_item_checks');
};

