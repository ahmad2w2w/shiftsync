/** Haversine distance in meters between two WGS84 coordinates. */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number
): boolean {
  return distanceMeters(userLat, userLng, targetLat, targetLng) <= radiusMeters
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocatie wordt niet ondersteund door je browser'))
      return
    }
    if (!window.isSecureContext) {
      reject(new Error('GPS werkt alleen via HTTPS (of localhost). Open de app via een beveiligde verbinding.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          reject(new Error('Locatietoegang geweigerd. Sta GPS toe in je browser of telefoon.'))
          break
        case err.POSITION_UNAVAILABLE:
          reject(new Error('GPS-locatie niet beschikbaar. Probeer het opnieuw buiten of met beter bereik.'))
          break
        case err.TIMEOUT:
          reject(new Error('GPS duurde te lang. Probeer opnieuw.'))
          break
        default:
          reject(new Error('Kon je locatie niet bepalen'))
      }
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })
  })
}
