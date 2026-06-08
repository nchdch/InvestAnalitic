exports.up = (pgm) => {
  pgm.createTable('payments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    account_id: {
      type: 'uuid',
      notNull: true,
      references: 'accounts',
      onDelete: 'cascade',
    },
    ticker: { type: 'text', notNull: true },
    type: { type: 'text', notNull: true, check: "type in ('dividend', 'coupon')" },
    payment_date: { type: 'date', notNull: true },
    gross_amount: { type: 'numeric', notNull: true },
    tax_withheld: { type: 'numeric', notNull: true, default: 0 },
    net_amount: { type: 'numeric', notNull: true },
    currency: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createIndex('payments', 'account_id')
  pgm.createIndex('payments', ['account_id', 'ticker'])
  pgm.createIndex('payments', 'payment_date')
}

exports.down = (pgm) => {
  pgm.dropTable('payments')
}
