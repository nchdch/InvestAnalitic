exports.up = (pgm) => {
  pgm.createTable('position_notes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    position_id: {
      type: 'uuid',
      notNull: true,
      references: 'positions',
      onDelete: 'cascade',
    },
    body: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createIndex('position_notes', 'position_id')
}

exports.down = (pgm) => {
  pgm.dropTable('position_notes')
}
