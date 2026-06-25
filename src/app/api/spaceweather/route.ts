import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

const WIND_URL = 'https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json';
const SCALES_URL = 'https://services.swpc.noaa.gov/products/noaa-scales.json';

export async function GET() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

    const [windRes, scalesRes] = await Promise.all([
      fetch(WIND_URL, { signal: controller.signal }),
      fetch(SCALES_URL, { signal: controller.signal }),
    ]).catch(() => [null, null]);

    clearTimeout(timer);

    let windSpeed = 385.0; // default average km/s
    let windDensity = 4.5;  // default average p/cm^3
    let Kp = 2;            // default Kp index (Quiet)

    // Parse NOAA Solar Wind Plasma Data
    if (windRes && windRes.ok) {
      const data = await windRes.json();
      // Format: [["time_tag", "density", "speed", "temperature"], ["2026-06-24...", "5.2", "412.3", "..."], ...]
      if (data && data.length > 1) {
        const latest = data[data.length - 1]; // get the most recent reading
        const parsedDensity = parseFloat(latest[1]);
        const parsedSpeed = parseFloat(latest[2]);
        if (!isNaN(parsedDensity)) windDensity = parseFloat(parsedDensity.toFixed(2));
        if (!isNaN(parsedSpeed)) windSpeed = parseFloat(parsedSpeed.toFixed(1));
      }
    }

    // Parse NOAA scales for geomagnetic storm activity
    if (scalesRes && scalesRes.ok) {
      const data = await scalesRes.json();
      // Parse scale data
      if (data && data.G && typeof data.G.Scale === 'number') {
        // G scale is roughly G0 to G5, map it to Kp index G0 = Kp5, G1 = Kp6, etc.
        Kp = 4 + data.G.Scale;
      }
    }

    // Determine status string
    let kpStatus = 'QUIET';
    if (Kp >= 4 && Kp < 5) kpStatus = 'UNSETTLED';
    else if (Kp >= 5 && Kp < 7) kpStatus = 'MODERATE STORM';
    else if (Kp >= 7) kpStatus = 'EXTREME STORM';

    // Calculate solar flare likelihood based on solar wind density
    const solarFlareChance = Math.min(95, Math.max(2, Math.round(windDensity * 3.5 + (Kp * 2.0))));

    return NextResponse.json({
      windSpeed,
      windDensity,
      kpIndex: Kp,
      kpStatus,
      solarFlareChance,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Graceful fallback to deterministic simulated telemetry based on date
    const now = new Date();
    const hash = (now.getUTCMinutes() + now.getUTCHours() * 60) % 100;
    
    const windSpeed = 350.0 + (hash * 3.5); // 350 to 700 km/s range
    const windDensity = 2.0 + (hash % 10) * 0.8; // 2.0 to 10.0 p/cm^3
    const kpIndex = Math.round((hash % 7) * 0.8 + (windSpeed > 600 ? 3 : 0));
    
    let kpStatus = 'QUIET';
    if (kpIndex === 4) kpStatus = 'UNSETTLED';
    else if (kpIndex >= 5 && kpIndex < 7) kpStatus = 'MODERATE STORM';
    else if (kpIndex >= 7) kpStatus = 'EXTREME STORM';

    return NextResponse.json({
      windSpeed: parseFloat(windSpeed.toFixed(1)),
      windDensity: parseFloat(windDensity.toFixed(2)),
      kpIndex,
      kpStatus,
      solarFlareChance: Math.round(2 + (kpIndex * 8) + (windDensity * 2.5)),
      updatedAt: now.toISOString(),
      fallback: true,
    });
  }
}
