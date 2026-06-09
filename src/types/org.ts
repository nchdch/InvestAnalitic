export interface OrgInfo {
  inn: string
  name: string
  fullName: string
  ogrn: string | null
  kpp: string | null
  address: string | null
}

export interface Organization {
  id: string
  inn: string
  name: string
  full_name: string | null
  ogrn: string | null
  kpp: string | null
  address: string | null
  created_at: string
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'active' | 'rejected'
}

export interface OrgMember {
  id: string
  email: string
  name: string | null
  membership_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'active' | 'rejected'
  created_at: string
}
