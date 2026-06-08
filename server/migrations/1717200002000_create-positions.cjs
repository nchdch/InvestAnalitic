exports.up = (pgm) => {
  pgm.createTable('positions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    account_id: {
      type: 'uuid',
      notNull: true,
      references: 'accounts',
      onDelete: 'cascade',
    },
    ticker: { type: 'text', notNull: true },
    isin: { type: 'text' },
    name: { type: 'text' },
    exchange: { type: 'text', notNull: true },
    asset_type: { type: 'text', notNull: true, check: "asset_type in ('equity', 'bond')" },
    currency: { type: 'text', notNull: true },
    quantity: { type: 'numeric', notNull: true },
    average_price: { type: 'numeric', notNull: true },
    averaging_method: { type: 'text', notNull: true, default: 'WAVG' },
    face_value: { type: 'numeric' },
    coupon_rate: { type: 'numeric' },
    coupon_dates: { type: 'jsonb' },
    maturity_date: { type: 'date' },
    accrued_interest: { type: 'numeric' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createIndex('positions', 'account_id')
  pgm.createIndex('positions', ['account_id', 'ticker'])
}

exports.down = (pgm) => {
  pgm.dropTable('positions')
}
