exports.up = (pgm) => {
  pgm.createTable('cash_balances', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    account_id: {
      type: 'uuid',
      notNull: true,
      references: 'accounts',
      onDelete: 'cascade',
    },
    currency: { type: 'text', notNull: true },
    amount: { type: 'numeric', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.addConstraint('cash_balances', 'cash_balances_account_currency_unique', 'UNIQUE(account_id, currency)')
}

exports.down = (pgm) => {
  pgm.dropTable('cash_balances')
}
