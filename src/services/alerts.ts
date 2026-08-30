import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutoSyncResult } from './autoSync';
import { sendLocalNotification } from './notifications';
import { getIsPro } from './subscription';

const ALERT_CONFIG_KEY = 'biofeedback:alertConfig';
const ALERT_LAST_SENT_KEY = 'biofeedback:alertLastSent';

const DEFAULT_ALERT_CONFIG = {
  highPressureThreshold: 70,
  lowStabilityThreshold: 40,
  morningBriefingEnabled: true,
  heavyDragWarningEnabled: true,
  flowStateReadyEnabled: true,
} as const;

export type AlertConfig = {
  highPressureThreshold: number;
  lowStabilityThreshold: number;
  morningBriefingEnabled: boolean;
  heavyDragWarningEnabled: boolean;
  flowStateReadyEnabled: boolean;
};

type AlertEvent = 'morningBriefing' | 'heavyDragWarning' | 'flowStateReady';
type AlertLastSent = Partial<Record<AlertEvent, string>>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isoDay = (date = new Date()) => date.toISOString().slice(0, 10);

const sanitizeAlertConfig = (raw: Partial<AlertConfig>): AlertConfig => ({
  highPressureThreshold: clamp(raw.highPressureThreshold ?? DEFAULT_ALERT_CONFIG.highPressureThreshold, 45, 90),
  lowStabilityThreshold: clamp(raw.lowStabilityThreshold ?? DEFAULT_ALERT_CONFIG.lowStabilityThreshold, 20, 65),
  morningBriefingEnabled: raw.morningBriefingEnabled ?? DEFAULT_ALERT_CONFIG.morningBriefingEnabled,
  heavyDragWarningEnabled: raw.heavyDragWarningEnabled ?? DEFAULT_ALERT_CONFIG.heavyDragWarningEnabled,
  flowStateReadyEnabled: raw.flowStateReadyEnabled ?? DEFAULT_ALERT_CONFIG.flowStateReadyEnabled,
});

function parseAlertConfig(value: string | null): AlertConfig {
  if (!value) {
    return { ...DEFAULT_ALERT_CONFIG };
  }

  try {
    const parsed = JSON.parse(value) as Partial<AlertConfig>;
    return sanitizeAlertConfig(parsed);
  } catch (error) {
    console.warn('Invalid alert config found in storage. Restoring defaults.', error);
    return { ...DEFAULT_ALERT_CONFIG };
  }
}

function parseLastSent(value: string | null): AlertLastSent {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as AlertLastSent;
    return {
      morningBriefing: parsed.morningBriefing,
      heavyDragWarning: parsed.heavyDragWarning,
      flowStateReady: parsed.flowStateReady,
    };
  } catch (error) {
    console.warn('Invalid alert delivery state found in storage. Resetting cache.', error);
    return {};
  }
}

export async function getAlertConfig(): Promise<AlertConfig> {
  const rawConfig = await AsyncStorage.getItem(ALERT_CONFIG_KEY);
  return parseAlertConfig(rawConfig);
}

export async function setAlertConfig(nextConfig: AlertConfig): Promise<AlertConfig> {
  const sanitized = sanitizeAlertConfig(nextConfig);
  await AsyncStorage.setItem(ALERT_CONFIG_KEY, JSON.stringify(sanitized));
  return sanitized;
}

async function getLastSent(): Promise<AlertLastSent> {
  const raw = await AsyncStorage.getItem(ALERT_LAST_SENT_KEY);
  return parseLastSent(raw);
}

async function setLastSent(nextValue: AlertLastSent): Promise<void> {
  await AsyncStorage.setItem(ALERT_LAST_SENT_KEY, JSON.stringify(nextValue));
}

export async function evaluateAutoSyncAlerts(result: AutoSyncResult): Promise<void> {
  if (result.source !== 'live') {
    return;
  }

  const isPro = await getIsPro();
  if (!isPro) {
    return;
  }

  const [alertConfig, lastSent] = await Promise.all([
    getAlertConfig(),
    getLastSent(),
  ]);

  const today = isoDay();
  const currentHour = new Date().getHours();
  const nextLastSent: AlertLastSent = { ...lastSent };
  let changed = false;

  if (alertConfig.morningBriefingEnabled && currentHour < 12 && lastSent.morningBriefing !== today) {
    const morningSent = await sendLocalNotification(
      'Morning Brain Briefing',
      `Today starts at Pressure ${result.tension} and Stability ${result.stability}.`,
    );
    if (morningSent) {
      nextLastSent.morningBriefing = today;
      changed = true;
    }
  }

  const heavyDragTriggered =
    result.tension >= alertConfig.highPressureThreshold ||
    result.stability <= alertConfig.lowStabilityThreshold;

  if (
    alertConfig.heavyDragWarningEnabled &&
    heavyDragTriggered &&
    lastSent.heavyDragWarning !== today
  ) {
    const heavySent = await sendLocalNotification(
      'Heavy Environmental Drag Detected',
      `Brain Pressure is ${result.tension} and Brain Stability is ${result.stability}. Keep focus blocks light today.`,
    );
    if (heavySent) {
      nextLastSent.heavyDragWarning = today;
      changed = true;
    }
  }

  const flowReadyTriggered =
    result.tension <= alertConfig.highPressureThreshold - 20 &&
    result.stability >= alertConfig.lowStabilityThreshold + 20;

  if (
    alertConfig.flowStateReadyEnabled &&
    flowReadyTriggered &&
    lastSent.flowStateReady !== today
  ) {
    const flowSent = await sendLocalNotification(
      'Flow State Ready',
      `Pressure is ${result.tension} and Stability is ${result.stability}. This is a good window for hard tasks.`,
    );
    if (flowSent) {
      nextLastSent.flowStateReady = today;
      changed = true;
    }
  }

  if (changed) {
    await setLastSent(nextLastSent);
  }
}
