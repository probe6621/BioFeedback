import AsyncStorage from '@react-native-async-storage/async-storage';

export type DailyCheckIn = {
  date: string;
  tension: number;
  stability: number;
};

const STORAGE_KEY = 'tension-checkin-history';

export async function saveDailyCheckIn(entry: DailyCheckIn) {
  const current = await getRecentCheckIns();
  const next = [entry, ...current.filter((item) => item.date !== entry.date)].slice(0, 30);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function getRecentCheckIns(): Promise<DailyCheckIn[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DailyCheckIn[]) : [];
  } catch (error) {
    console.warn('Could not load check-ins', error);
    return [];
  }
}
