exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('carddb_employee_photos', {
    employee_id: { type: 'text', primaryKey: true },
    staff_no: { type: 'text' },
    content_type: { type: 'text', notNull: true, default: 'application/octet-stream' },
    photo: { type: 'bytea', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createIndex('carddb_employee_photos', 'staff_no');
};

exports.down = (pgm) => {
  pgm.dropTable('carddb_employee_photos');
};
