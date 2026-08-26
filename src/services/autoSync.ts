import * as Location from 'expo-location';

export type AutoSyncResult = {
  tension: number;
  stability: number;
  statusText: string;
  source: 'live' | 'fallback';
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const fallbackAutoSync = (): AutoSyncResult => {
  const seed = new Date().getHours() + new Date().getDate();
  const tension = clamp(52 + (seed % 19) + 6, 30, 94);
  const stability = clamp(74 - (seed % 16) + 3, 22, 96);

  return {
    tension: Math.round(tension),
    stability: Math.round(stability),
    statusText: 'Offline calibration active — using ambient fallback estimate',
    source: 'fallback',
  };
};

export async function runAutoSync(): Promise<AutoSyncResult> {
  try {
    const permissionStatus = await Location.requestForegroundPermissionsAsync();
    if (permissionStatus.status !== 'granted') {
      return {
        ...fallbackAutoSync(),
        statusText: 'Location permission unavailable — using fallback field calibration',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,pressure_msl,weather_code&timezone=auto`;

    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error('Weather fetch failed');
    }

    const weather = await response.json();
    const current = weather.current ?? {};
    const pressure = Number(current.pressure_msl ?? 1013);
    const temperature = Number(current.temperature_2m ?? 21);
    const humidity = Number(current.relative_humidity_2m ?? 50);
    const weatherCode = Number(current.weather_code ?? 0);

    const pressureShift = Math.abs(pressure - 1013);
    const tempLoad = Math.abs(temperature - 22) * 2.5;
    const humidityLoad = humidity * 0.35;
    const environmentalLoad = clamp(
      pressureShift / 3 + tempLoad + humidityLoad + (weatherCode >= 3 ? 12 : 0),
      12,
      88,
    );

    const tension = clamp(
      Math.round(30 + environmentalLoad + (pressure < 1008 ? 10 : 0)),
      18,
      96,
    );
    const stability = clamp(
      Math.round(92 - pressureShift / 2.2 - tempLoad / 1.3 - humidityLoad / 1.8),
      14,
      96,
    );

    let statusText = 'Atmospheric pressure stable — low friction flow';
    if (pressure < 1008) {
      statusText = 'Barometric shift detected — higher environmental load';
    } else if (pressure > 1020 || humidity > 68) {
      statusText = 'Humidity and pressure are elevated — tension is leaning heavier';
    } else if (weatherCode >= 3) {
      statusText = 'Weather fronts are active — external flow is less stable';
    }

    return {
      tension,
      stability,
      statusText,
      source: 'live',
    };
  } catch (error) {
    return {
      ...fallbackAutoSync(),
      statusText: 'Connection drift detected — fallback field calibration applied',
    };
  }
}
