exports.up = (pgm) => {
  pgm.createTable('org_memberships', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    org_id: { type: 'uuid', notNull: true, references: '"organizations"', onDelete: 'CASCADE' },
    role: { type: 'text', notNull: true, default: "'member'" },
    status: { type: 'text', notNull: true, default: "'pending'" },
    invited_by: { type: 'uuid', references: '"users"' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.addConstraint('org_memberships', 'org_memberships_user_org_unique', 'UNIQUE(user_id, org_id)')

  pgm.createTable('org_invites', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    org_id: { type: 'uuid', notNull: true, references: '"organizations"', onDelete: 'CASCADE' },
    email: { type: 'text', notNull: true },
    token: { type: 'text', notNull: true, unique: true },
    invited_by: { type: 'uuid', references: '"users"' },
    expires_at: { type: 'timestamptz', notNull: true },
    used_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.createIndex('org_invites', 'token')
}

exports.down = (pgm) => {
  pgm.dropTable('org_invites')
  pgm.dropTable('org_memberships')
}
