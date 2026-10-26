import { resolveApiOrigin } from './publicEnvironment'

export const API_ORIGIN = resolveApiOrigin(import.meta.env.VITE_API_URL, import.meta.env.PROD)
