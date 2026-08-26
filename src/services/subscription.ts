import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBSCRIPTION_KEY = 'biofeedback:isPro';

export async function getIsPro(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setIsPro(nextValue: boolean): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, nextValue ? 'true' : 'false');
    return nextValue;
  } catch {
    return false;
  }
}
