# Solar Watch

A React web app that displays Islamic prayer times on a donut-shaped watch face with a dynamic sky gradient.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- pray-calc (prayer time calculations)
- @photostructure/tz-lookup (timezone from coordinates)

## Project Structure

```
src/
  App.tsx       # Main component - watch rendering, prayer time logic
  App.css       # All styling - watch face, markers, responsive design
  main.tsx      # React entry point
index.html      # HTML template
```

## Key Concepts

### Prayer Times
The app calculates 7 prayer times: Fajr, Chourouk (sunrise), Doha, Dohr (noon), Asr, Ghouroub (sunset), Icha. Doha is calculated as symmetric to Asr relative to noon.

### Watch Face
- Donut shape with conic gradient representing sky colors throughout the day
- Noon is at the top (12 o'clock position)
- Sun orbits in the middle of the donut ring
- Red marker indicates current time
- Labels positioned outside the watch via `getLabelTransform()` switch statement

### Geolocation
- Uses browser Geolocation API
- Falls back to Rabat, Morocco if denied/unavailable
- Shows warning banner when using fallback location

### Timezone Handling
- Uses @photostructure/tz-lookup to get timezone from coordinates (works offline)
- Recalculates on date change (midnight) and visibility change (handles DST)

## Commands

```bash
npm install    # Install dependencies
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # Run ESLint
```

## Notes

- Label positions in `getLabelTransform()` are manually tuned per marker
- Watch uses fluid responsive sizing with `vmin` units
- Sky gradient colors transition through night/dawn/day/sunset/dusk
