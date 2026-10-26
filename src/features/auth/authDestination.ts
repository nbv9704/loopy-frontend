type ReturnLocation = { pathname?: string; search?: string; hash?: string }

export function getAuthDestination(from?: string | ReturnLocation): string {
  const target =
    typeof from === 'string'
      ? from
      : from?.pathname
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : '/'
  return target.startsWith('/') && !target.startsWith('//') && !target.includes('\\') ? target : '/'
}
