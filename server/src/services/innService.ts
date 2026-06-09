export interface OrgInfo {
  inn: string
  name: string
  fullName: string
  ogrn: string | null
  kpp: string | null
  address: string | null
}

interface DadataParty {
  inn: string
  ogrn?: string
  kpp?: string
  address?: { unrestricted_value?: string }
  name?: { full_with_opf?: string; short_with_opf?: string }
}

export async function lookupByInn(inn: string): Promise<OrgInfo | null> {
  if (!/^\d{10}$|^\d{12}$/.test(inn)) return null

  const apiKey = process.env.DADATA_API_KEY
  if (!apiKey) return getMockOrg(inn)

  const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Token ${apiKey}`,
    },
    body: JSON.stringify({ query: inn, count: 1 }),
  })

  if (!response.ok) throw new Error('Ошибка при запросе к базе ФНС')

  const data = await response.json() as { suggestions?: Array<{ value: string; data: DadataParty }> }
  if (!data.suggestions?.length) return null

  const { value, data: d } = data.suggestions[0]
  return {
    inn: d.inn,
    name: d.name?.short_with_opf ?? value,
    fullName: d.name?.full_with_opf ?? value,
    ogrn: d.ogrn ?? null,
    kpp: d.kpp ?? null,
    address: d.address?.unrestricted_value ?? null,
  }
}

function getMockOrg(inn: string): OrgInfo | null {
  const mocks: Record<string, OrgInfo> = {
    '7707083893': { inn: '7707083893', name: 'Сбербанк', fullName: 'ПАО Сбербанк', ogrn: '1027700132195', kpp: '773601001', address: 'г Москва, ул Вавилова, д 19' },
    '7736207543': { inn: '7736207543', name: 'Газпром', fullName: 'ПАО Газпром', ogrn: '1027700070518', kpp: '997250001', address: 'г Москва, ул Намёткина, д 16' },
    '0000000000': { inn: '0000000000', name: 'Тестовая компания', fullName: 'ООО "Тестовая компания"', ogrn: '1234567890123', kpp: '123456789', address: 'г Москва, ул Примерная, д 1' },
  }
  return mocks[inn] ?? null
}
