exports.up = (pgm) => {
  pgm.addColumn('positions', {
    last_price: { type: 'numeric' },
    last_price_updated_at: { type: 'timestamptz' },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn('positions', 'last_price')
  pgm.dropColumn('positions', 'last_price_updated_at')
}
