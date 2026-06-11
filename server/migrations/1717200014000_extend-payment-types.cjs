exports.up = (pgm) => {
  pgm.dropConstraint('payments', 'payments_type_check')
  pgm.addConstraint('payments', 'payments_type_check', "CHECK (type in ('dividend', 'coupon', 'amortization', 'redemption'))")
}

exports.down = (pgm) => {
  pgm.dropConstraint('payments', 'payments_type_check')
  pgm.addConstraint('payments', 'payments_type_check', "CHECK (type in ('dividend', 'coupon'))")
}
