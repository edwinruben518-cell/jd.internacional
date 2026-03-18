/** Parse basic device info from User-Agent string */
export function parseUserAgent(ua: string): { browser: string; os: string; deviceType: string } {
  const uaLow = ua.toLowerCase()

  // Device type
  const deviceType = /mobile|android|iphone|ipod/.test(uaLow)
    ? 'Mobile'
    : /tablet|ipad/.test(uaLow)
    ? 'Tablet'
    : 'Desktop'

  // OS
  const os = /windows nt 10/.test(uaLow) ? 'Windows 10'
    : /windows nt 11/.test(uaLow) ? 'Windows 11'
    : /windows/.test(uaLow) ? 'Windows'
    : /mac os x/.test(uaLow) ? 'macOS'
    : /android/.test(uaLow) ? (() => {
        const m = ua.match(/Android\s([\d.]+)/i)
        return m ? `Android ${m[1]}` : 'Android'
      })()
    : /iphone|ipad|ipod/.test(uaLow) ? (() => {
        const m = ua.match(/OS\s([\d_]+)/i)
        return m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS'
      })()
    : /linux/.test(uaLow) ? 'Linux'
    : /chromeos/.test(uaLow) ? 'ChromeOS'
    : 'Desconocido'

  // Browser — order matters: check specific engines before generic Chrome
  const browser = /samsungbrowser/.test(uaLow) ? 'Samsung Browser'
    : /edg\//.test(uaLow) ? 'Edge'         // Edge Chromium (contains "chrome" too)
    : /opr\/|opera/.test(uaLow) ? 'Opera'  // Opera (contains "chrome" too)
    : /firefox\//.test(uaLow) ? (() => {
        const m = ua.match(/Firefox\/([\d.]+)/i)
        return m ? `Firefox ${m[1].split('.')[0]}` : 'Firefox'
      })()
    : /chrome\//.test(uaLow) ? (() => {
        const m = ua.match(/Chrome\/([\d.]+)/i)
        return m ? `Chrome ${m[1].split('.')[0]}` : 'Chrome'
      })()
    : /safari\//.test(uaLow) ? 'Safari'
    : 'Desconocido'

  return { browser, os, deviceType }
}

/** Get IP geo info via ip-api.com (free, no key required) */
export async function getIpGeo(ip: string): Promise<{
  city: string | null
  country: string | null
  lat: number | null
  lng: number | null
}> {
  // Skip for local/private IPs
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
    return { city: 'Local', country: 'Local', lat: null, lng: null }
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,lat,lon,status`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { city: null, country: null, lat: null, lng: null }
    const data = await res.json()
    if (data.status !== 'success') return { city: null, country: null, lat: null, lng: null }
    return { city: data.city ?? null, country: data.country ?? null, lat: data.lat ?? null, lng: data.lon ?? null }
  } catch {
    return { city: null, country: null, lat: null, lng: null }
  }
}
