/* InvestAnalitic — UI kit demo data (in the house number style) */
window.IA_DATA = {
  portfolio: {
    total: '2 480 350,00 ₽',
    dayDelta: 12480, dayPct: 0.51,
    allDelta: 684600, allPct: 38.18,
    invested: '1 795 750,00 ₽',
  },
  alloc: [
    { label: 'Акции', value: 1680000 },
    { label: 'Облигации', value: 620000 },
    { label: 'Деньги', value: 180350 },
  ],
  accounts: [
    {
      id: 'sber', name: 'Сбер Инвестиции', kind: 'ИИС',
      value: '1 412 800,00 ₽', dayDelta: 8120, dayPct: 0.58, allDelta: 384200, allPct: 37.3,
    },
    {
      id: 'tbank', name: 'Т-Банк Инвестиции', kind: 'Брокерский',
      value: '1 067 550,00 ₽', dayDelta: 4360, dayPct: 0.41, allDelta: 300400, allPct: 39.2,
    },
  ],
  equities: [
    { ticker: 'SBER', name: 'Сбербанк', isin: 'RU0009029540', qty: 500, avg: 218.40, price: 286.40, value: 143200, dayPct: 1.24, pnl: 34000, pnlPct: 31.1, weight: 9.2 },
    { ticker: 'LKOH', name: 'Лукойл', isin: 'RU0009024277', qty: 100, avg: 6240.00, price: 7184.50, value: 718450, dayPct: 0.42, pnl: 94450, pnlPct: 15.1, weight: 28.9 },
    { ticker: 'GAZP', name: 'Газпром', isin: 'RU0007661625', qty: 750, avg: 162.10, price: 128.06, value: 96045, dayPct: -0.88, pnl: -25530, pnlPct: -21.0, weight: 3.9 },
    { ticker: 'GMKN', name: 'Норникель', isin: 'RU0007288411', qty: 80, avg: 132.50, price: 158.20, value: 12656, dayPct: 0.64, pnl: 2056, pnlPct: 19.4, weight: 0.5 },
    { ticker: 'YDEX', name: 'Яндекс', isin: 'RU000A107T19', qty: 60, avg: 3820.00, price: 4488.00, value: 269280, dayPct: 2.10, pnl: 40080, pnlPct: 17.5, weight: 10.9 },
  ],
  bonds: [
    { ticker: 'ОФЗ 26244', name: 'ОФЗ-ПД', isin: 'RU000A1078S5', qty: 200, price: 932.40, value: 186480, coupon: 56.10, ytm: 13.8, maturity: '15.03.2034', weight: 7.5 },
    { ticker: 'ОФЗ 26238', name: 'ОФЗ-ПД', isin: 'RU000A1038V6', qty: 150, price: 612.80, value: 91920, coupon: 35.40, ytm: 13.2, maturity: '15.05.2041', weight: 3.7 },
    { ticker: 'РЖД 1Р-28R', name: 'РЖД', isin: 'RU000A106ZL5', qty: 300, price: 988.20, value: 296460, coupon: 41.10, ytm: 12.4, maturity: '20.11.2028', weight: 11.9 },
  ],
  payments: [
    { type: 'dividend', ticker: 'SBER', name: 'Сбербанк', date: '12.07', amount: '6 250,00 ₽', perShare: '12,50 ₽', status: 'upcoming', days: 4 },
    { type: 'coupon', ticker: 'ОФЗ 26244', name: 'ОФЗ-ПД', date: '15.07', amount: '11 220,00 ₽', perShare: '56,10 ₽', status: 'upcoming', days: 7 },
    { type: 'dividend', ticker: 'LKOH', name: 'Лукойл', date: '24.07', amount: '49 800,00 ₽', perShare: '498,00 ₽', status: 'upcoming', days: 16 },
    { type: 'coupon', ticker: 'РЖД 1Р-28R', name: 'РЖД', date: '20.06', amount: '12 330,00 ₽', perShare: '41,10 ₽', status: 'paid', days: -3 },
  ],
};
