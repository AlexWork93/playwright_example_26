import { APIRequestContext } from '@playwright/test'
import type {
  AEResponse,
  BrandsResponse,
  CreateAccountPayload,
  DeleteAccountPayload,
  LoginPayload,
  ProductsResponse,
  SearchProductPayload,
  UserDetailResponse,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// AEClient
// ─────────────────────────────────────────────────────────────────────────────

export class AEClient {
  constructor(private readonly request: APIRequestContext) {}

  // ── Accounts ────────────────────────────────────────────────────────────────

  async createAccount(payload: CreateAccountPayload): Promise<AEResponse> {
    // The AE API expects form-encoded bodies, not JSON, for mutation endpoints
    const res = await this.request.post('/api/createAccount', {
      form: payload as unknown as Record<string, string>,
    })
    return res.json() as Promise<AEResponse>
  }

  async deleteAccount(payload: DeleteAccountPayload): Promise<AEResponse> {
    const res = await this.request.delete('/api/deleteAccount', {
      form: payload as unknown as Record<string, string>,
    })
    return res.json() as Promise<AEResponse>
  }

  async verifyLogin(payload: LoginPayload): Promise<AEResponse> {
    const res = await this.request.post('/api/verifyLogin', {
      form: payload as unknown as Record<string, string>,
    })
    return res.json() as Promise<AEResponse>
  }

  async getUserByEmail(email: string): Promise<UserDetailResponse> {
    const res = await this.request.get('/api/getUserDetailByEmail', {
      params: { email },
    })
    return res.json() as Promise<UserDetailResponse>
  }

  async updateAccount(payload: CreateAccountPayload): Promise<AEResponse> {
    const res = await this.request.put('/api/updateAccount', {
      form: payload as unknown as Record<string, string>,
    })
    return res.json() as Promise<AEResponse>
  }

  // ── Products ────────────────────────────────────────────────────────────────

  async getProducts(): Promise<ProductsResponse> {
    const res = await this.request.get('/api/productsList')
    return res.json() as Promise<ProductsResponse>
  }

  async searchProducts(payload: SearchProductPayload): Promise<ProductsResponse> {
    const res = await this.request.post('/api/searchProduct', {
      form: payload as unknown as Record<string, string>,
    })
    return res.json() as Promise<ProductsResponse>
  }

  // ── Brands ──────────────────────────────────────────────────────────────────

  async getBrands(): Promise<BrandsResponse> {
    const res = await this.request.get('/api/brandsList')
    return res.json() as Promise<BrandsResponse>
  }
}
