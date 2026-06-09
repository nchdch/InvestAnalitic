exports.up = (pgm) => {
  pgm.createTable('auth_tokens', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    token: { type: 'text', notNull: true, unique: true },
    type: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    used_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.createIndex('auth_tokens', 'token')
}

exports.down = (pgm) => {
  pgm.dropTable('auth_tokens')
}
