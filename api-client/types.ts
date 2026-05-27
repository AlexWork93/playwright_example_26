
// ── Request payloads ──────────────────────────────────────────────────────────

export interface CreateAccountPayload {
  name:        string
  email:       string
  password:    string
  title:       'Mr' | 'Mrs'
  birth_date:  string
  birth_month: string
  birth_year:  string
  firstname:   string
  lastname:    string
  company?:    string
  address1:    string
  address2?:   string
  country:     string
  zipcode:     string
  state:       string
  city:        string
  mobile_number: string
}

export interface LoginPayload {
  email:    string
  password: string
}

export interface DeleteAccountPayload {
  email:    string
  password: string
}

export interface SearchProductPayload {
  search_product: string
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface AEResponse {
  responseCode: number
  message:      string
}

export interface UserDetailResponse {
  responseCode: number
  user: {
    id:           number
    name:         string
    email:        string
    title:        string
    birth_day:    string
    birth_month:  string
    birth_year:   string
    first_name:   string
    last_name:    string
    company:      string
    address1:     string
    address2:     string
    country:      string
    zipcode:      string
    state:        string
    city:         string
    mobile_number: string
  }
}

export interface Product {
  id:       number
  name:     string
  price:    string
  brand:    string
  category: { usertype: { usertype: string }; category: string }
}

export interface ProductsResponse {
  responseCode: number
  products:     Product[]
}

export interface Brand {
  id:   number
  brand: string
}

export interface BrandsResponse {
  responseCode: number
  brands:       Brand[]
}

// ── Convenience type for test user credentials ────────────────────────────────

export interface TestUser extends CreateAccountPayload {
  // Same shape as what we send to createAccount returned from the factory
}
