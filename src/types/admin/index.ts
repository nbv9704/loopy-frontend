export interface User {
  id: string
  email: string
  role: string
  is_admin?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface AuthResponse {
  success: boolean
  user?: User
  message?: string
}

// Header & Footer Types
export interface HeaderSettings {
  id: string
  logo_url: string | null
  logo_alt_text: string
  logo_alt_text_en: string
  created_at: string
  updated_at: string
}

export interface FooterColumn {
  id: string
  title: string
  title_en?: string
  column_type: 'company_links' | 'brand_identity'
  display_order: number
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface FooterColumnItem {
  id: string
  column_id: string
  item_type: 'navigation_link' | 'brand_content'
  content_data: NavigationLinkData | BrandContentData
  display_order: number
  created_at: string
  updated_at: string
}

export interface NavigationLinkData {
  label: string
  label_en?: string
  path: string
}

export interface BrandContentData {
  logo_url: string
  description: string
  description_en?: string
}
