exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true })

  pgm.createTable('accounts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    broker: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('accounts')
}
