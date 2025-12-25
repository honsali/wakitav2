import tzlookup from '@photostructure/tz-lookup';
import { getTimes } from 'pray-calc';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import './App.css';

// Solar event times (in hours)
interface SolarEvents {
  dawn: number
  sunrise: number
  doha: number
  noon: number
  asr: number
  sunset: number
  dusk: number
}

// Default location (Rabat, Morocco) - used as fallback
const DEFAULT_LOCATION = { lat: 33.915, lng: -6.867 }

// Get timezone offset in hours for a given location and date
const getTimezoneOffset = (lat: number, lng: number, date: Date): number => {
  try {
    const timeZone = tzlookup(lat, lng);
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }))
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
  } catch (err) {
    return -date.getTimezoneOffset() / 60
  }
}

// Calculate solar events using pray-calc library
const calculateSolarEvents = (lat: number, lng: number, date: Date): SolarEvents => {
  const tz = getTimezoneOffset(lat, lng, date)
  const times = getTimes(date, lat, lng, tz)

  // Calculate Doha as symmetric to Asr relative to noon
  // Asr is after noon, Doha is before noon by the same duration
  const asrOffset = times.Asr - times.Dhuhr
  const doha = times.Dhuhr - asrOffset

  return {
    dawn: times.Fajr,
    sunrise: times.Sunrise,
    doha: doha,
    noon: times.Dhuhr,
    asr: times.Asr,
    sunset: times.Maghrib,
    dusk: times.Isha
  }
}

// Convert hours to degrees (24 hours = 360 degrees)
// Offset so that noon (12:00) is at the top (0 degrees)
const hoursToDegrees = (hours: number, noonOffset: number = 12): number => {
  return ((hours - noonOffset) / 24) * 360
}

// Get current time as decimal hours
const getCurrentTimeInHours = (): number => {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
}

// Get label transform style based on marker name
const getLabelTransform = (markerName: string, markerRotation: number): CSSProperties => {
  const baseRotate = `rotate(${-markerRotation}deg)`
  switch (markerName) {
    case 'Fajr':
      return { transform: `${baseRotate} translateX(-30%) translateY(8px)` }
    case 'Chourouk':
      return { transform: `${baseRotate} translateX(-60%) translateY(24px)` }
    case 'Doha':
      return { transform: `${baseRotate} translateX(-90%) translateY(5px)` }
    case 'Dohr':
      return { transform: `${baseRotate} translateX(-50%) translateY(-8px)` }
    case 'Asr':
      return { transform: `${baseRotate} translateX(10%) translateY(-10px)` }
    case 'Ghouroub':
      return { transform: `${baseRotate} translateX(30%) translateY(-34px)` }
    case 'Icha':
      return { transform: `${baseRotate} translateX(40%) translateY(-18px)` }
    default:
      return { transform: `${baseRotate} translateX(0) translateY(0)` }
  }
}

// Get sky color based on time
// The gradient is rotated so noon is at top (0 degrees)
const getSkyGradient = (solarEvents: SolarEvents): string => {
  const { dawn, sunrise, noon, sunset, dusk } = solarEvents

  const nightColor = '#0a1628'
  const dawnColor = '#1e3a5f'
  const sunriseColor1 = '#ff6b35'
  const sunriseColor2 = '#ffc947'
  const dayColor = '#4fa4e0'
  const noonColor = '#87ceeb'
  const sunsetColor1 = '#ff8c42'
  const sunsetColor2 = '#ff5252'
  const duskColor = '#2d3561'

  // Calculate degrees with noon at top (0°)
  // Noon is at 0°, so we offset from noon
  const noonOffset = noon
  const dawnDeg = hoursToDegrees(dawn, noonOffset)
  const sunriseDeg = hoursToDegrees(sunrise, noonOffset)
  const sunsetDeg = hoursToDegrees(sunset, noonOffset)
  const duskDeg = hoursToDegrees(dusk, noonOffset)
  const midnightDeg = hoursToDegrees(0, noonOffset)

  // Normalize degrees to 0-360 range
  const normalizeDeg = (deg: number) => ((deg % 360) + 360) % 360

  return `conic-gradient(
    from 0deg,
    ${noonColor} 0deg,
    ${dayColor} ${normalizeDeg(sunsetDeg - 30)}deg,
    ${sunsetColor1} ${normalizeDeg(sunsetDeg - 10)}deg,
    ${sunsetColor2} ${normalizeDeg(sunsetDeg)}deg,
    ${duskColor} ${normalizeDeg(duskDeg)}deg,
    ${nightColor} ${normalizeDeg(duskDeg + 15)}deg,
    ${nightColor} ${normalizeDeg(midnightDeg)}deg,
    ${nightColor} ${normalizeDeg(dawnDeg - 15)}deg,
    ${dawnColor} ${normalizeDeg(dawnDeg)}deg,
    ${sunriseColor1} ${normalizeDeg(sunriseDeg)}deg,
    ${sunriseColor2} ${normalizeDeg(sunriseDeg + 10)}deg,
    ${dayColor} ${normalizeDeg(sunriseDeg + 30)}deg,
    ${noonColor} 360deg
  )`
}

type LocationStatus = 'loading' | 'success' | 'fallback'

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading')
  const [solarEvents, setSolarEvents] = useState<SolarEvents>(() =>
    calculateSolarEvents(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, new Date())
  )

  // Get location from browser on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setSolarEvents(calculateSolarEvents(latitude, longitude, new Date()))
          setLocationStatus('success')
        },
        () => {
          // On error, keep default location
          console.log('Geolocation not available, using default location')
          setLocationStatus('fallback')
        }
      )
    } else {
      setLocationStatus('fallback')
    }
  }, [])

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Recalculate solar events when date changes (at midnight)
  useEffect(() => {
    const events = calculateSolarEvents(location.lat, location.lng, currentTime)
    setSolarEvents(events)
  }, [location, currentTime.getDate()])

  // Recalculate solar events when tab becomes visible (handles DST changes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = new Date()
        setCurrentTime(now)
        setSolarEvents(calculateSolarEvents(location.lat, location.lng, now))
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [location])

  const currentHours = getCurrentTimeInHours()
  const noonOffset = solarEvents.noon
  const sunRotation = hoursToDegrees(currentHours, noonOffset)
  const skyGradient = getSkyGradient(solarEvents)

  const markers = [
    { name: 'Fajr', time: solarEvents.dawn, className: 'dawn' },
    { name: 'Chourouk', time: solarEvents.sunrise, className: 'sunrise' },
    { name: 'Doha', time: solarEvents.doha, className: 'doha' },
    { name: 'Dohr', time: solarEvents.noon, className: 'noon' },
    { name: 'Asr', time: solarEvents.asr, className: 'asr' },
    { name: 'Ghouroub', time: solarEvents.sunset, className: 'sunset' },
    { name: 'Icha', time: solarEvents.dusk, className: 'dusk' },
  ]

  return (
    <div className="watch-container">
      {locationStatus === 'fallback' && (
        <div className="location-warning">
          Using default location (Rabat, Morocco)
        </div>
      )}
      <div className="watch">
        {/* Markers in the border area with labels */}
        {markers.map((marker) => {
          const markerRotation = hoursToDegrees(marker.time, noonOffset)
          return (
            <div
              key={marker.name}
              className={`marker ${marker.className}`}
              style={{
                transform: `rotate(${markerRotation}deg)`
              }}
            >
              <div className="marker-label-container" style={getLabelTransform(marker.name, markerRotation)}>
                <span className="marker-label">{marker.name}</span>
              </div>
              <div className="marker-line" />
            </div>
          )
        })}

        {/* Current time red marker on outer circle */}
        <div
          className="marker current-time"
          style={{
            transform: `rotate(${sunRotation}deg)`
          }}
        >
          <div className="marker-line" />
        </div>

        {/* Sun rotating in the middle of the donut */}
        <div
          className="sun-orbit"
          style={{
            transform: `rotate(${sunRotation}deg)`
          }}
        >
          <div className="sun" />
        </div>

        <div className="watch-face">
          <div
            className="sky-gradient"
            style={{ background: skyGradient }}
          />

          <div className="center-hole" />
        </div>
      </div>
    </div>
  )
}

export default App
