exports.up = (pgm) => {
  pgm.createTable('organizations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    inn: { type: 'text', notNull: true, unique: true },
    name: { type: 'text', notNull: true },
    full_name: { type: 'text' },
    ogrn: { type: 'text' },
    kpp: { type: 'text' },
    address: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('organizations')
}
