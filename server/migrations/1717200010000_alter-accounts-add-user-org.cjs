exports.up = (pgm) => {
  pgm.addColumns('accounts', {
    user_id: { type: 'uuid', references: '"users"', onDelete: 'SET NULL' },
    org_id: { type: 'uuid', references: '"organizations"', onDelete: 'SET NULL' },
  })
}

exports.down = (pgm) => {
  pgm.dropColumns('accounts', ['user_id', 'org_id'])
}
