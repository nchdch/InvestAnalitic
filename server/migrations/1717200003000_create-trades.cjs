exports.up = (pgm) => {
  pgm.createTable('trades', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    account_id: {
      type: 'uuid',
      notNull: true,
      references: 'accounts',
      onDelete: 'cascade',
    },
    ticker: { type: 'text', notNull: true },
    side: { type: 'text', notNull: true, check: "side in ('buy', 'sell')" },
    quantity: { type: 'numeric', notNull: true },
    price: { type: 'numeric', notNull: true },
    fee: { type: 'numeric', notNull: true, default: 0 },
    currency: { type: 'text', notNull: true },
    executed_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createIndex('trades', 'account_id')
  pgm.createIndex('trades', ['account_id', 'ticker'])
  pgm.createIndex('trades', 'executed_at')
}

exports.down = (pgm) => {
  pgm.dropTable('trades')
}
