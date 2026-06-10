/** Тикер (без суффиксов вроде "-RM") → домен компании для логотипа через Clearbit Logo API. */
const TICKER_DOMAINS: Record<string, string> = {
  // MOEX — российские акции
  SBER: 'sberbank.ru',
  SBERP: 'sberbank.ru',
  GAZP: 'gazprom.ru',
  LKOH: 'lukoil.ru',
  GMKN: 'nornickel.ru',
  ROSN: 'rosneft.ru',
  NVTK: 'novatek.ru',
  TATN: 'tatneft.ru',
  TATNP: 'tatneft.ru',
  MGNT: 'magnit.ru',
  MTSS: 'mts.ru',
  VTBR: 'vtb.ru',
  YNDX: 'yandex.ru',
  T: 'tbank.ru',
  TCSG: 'tbank.ru',
  TNAO: 'tbank.ru',
  OZON: 'ozon.ru',
  PLZL: 'polyus.com',
  CHMF: 'severstal.com',
  NLMK: 'nlmk.com',
  ALRS: 'alrosa.ru',
  AFLT: 'aeroflot.ru',
  MOEX: 'moex.com',
  PHOR: 'phosagro.ru',
  RUAL: 'rusal.ru',
  FIVE: 'x5.ru',
  POLY: 'polymetalinternational.com',
  SNGS: 'surgutneftegas.ru',
  SNGSP: 'surgutneftegas.ru',
  IRAO: 'interrao.ru',
  HYDR: 'rushydro.ru',
  FEES: 'fsk-ees.ru',
  PIKK: 'pik.ru',
  AFKS: 'sistema.ru',
  SMLT: 'samolet.ru',

  // Иностранные акции (на MOEX часто торгуются с суффиксом "-RM")
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  GOOGL: 'abc.xyz',
  GOOG: 'abc.xyz',
  AMZN: 'amazon.com',
  TSLA: 'tesla.com',
  META: 'meta.com',
  NVDA: 'nvidia.com',
  ORCL: 'oracle.com',
  NDAQ: 'nasdaq.com',
  INTC: 'intel.com',
  AMD: 'amd.com',
  NFLX: 'netflix.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  DIS: 'disney.com',
  BA: 'boeing.com',
  JPM: 'jpmorganchase.com',
}

/** URL логотипа эмитента по тикеру, либо null, если эмитент неизвестен. */
export function getTickerLogoUrl(ticker: string, assetType: 'equity' | 'bond' = 'equity'): string | null {
  if (assetType !== 'equity') return null
  const base = ticker.trim().toUpperCase().replace(/-RM$/, '')
  const domain = TICKER_DOMAINS[base]
  return domain ? `https://logo.clearbit.com/${domain}?size=64` : null
}
