exports.up = (pgm) => {
  pgm.addColumn('positions', {
    lot_size: { type: 'numeric' },
    next_coupon_date: { type: 'date' },
    next_coupon_value: { type: 'numeric' },
    current_accrued_interest: { type: 'numeric' },
    initial_face_value: { type: 'numeric' },
    amortization: { type: 'jsonb' },
    offer_date: { type: 'date' },
    bond_info_updated_at: { type: 'timestamptz' },
  })
}

exports.down = (pgm) => {
  pgm.dropColumn('positions', [
    'lot_size',
    'next_coupon_date',
    'next_coupon_value',
    'current_accrued_interest',
    'initial_face_value',
    'amortization',
    'offer_date',
    'bond_info_updated_at',
  ])
}
