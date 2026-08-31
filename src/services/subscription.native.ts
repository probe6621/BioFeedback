import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const CACHE_KEY = 'biofeedback:isPro';
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'pro';
const PACKAGE_ID = process.env.EXPO_PUBLIC_REVENUECAT_PACKAGE_ID?.trim();

const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim(),
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim(),
  default: undefined,
});

let configurationPromise: Promise<boolean> | null = null;

function hasEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
}

function cacheProState(nextValue: boolean): Promise<void> {
  return AsyncStorage.setItem(CACHE_KEY, nextValue ? 'true' : 'false');
}

async function readCachedProState(): Promise<boolean> {
  return (await AsyncStorage.getItem(CACHE_KEY)) === 'true';
}

async function ensureConfigured(): Promise<boolean> {
  if (!apiKey) {
    return false;
  }

  if (!configurationPromise) {
    configurationPromise = (async () => {
      Purchases.configure({ apiKey });
      return true;
    })();
  }

  return configurationPromise;
}

async function getCurrentCustomerInfo(): Promise<CustomerInfo> {
  await ensureConfigured();
  return Purchases.getCustomerInfo();
}

async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

function selectPackage(availablePackages: PurchasesPackage[] | undefined): PurchasesPackage | undefined {
  if (!availablePackages || availablePackages.length === 0) {
    return undefined;
  }

  if (PACKAGE_ID) {
    const configuredPackage = availablePackages.find((currentPackage) => currentPackage.identifier === PACKAGE_ID);
    if (configuredPackage) {
      return configuredPackage;
    }
  }

  return availablePackages[0];
}

export async function getIsPro(): Promise<boolean> {
  if (!(await ensureConfigured())) {
    return readCachedProState();
  }

  try {
    const customerInfo = await getCurrentCustomerInfo();
    const isPro = hasEntitlement(customerInfo);
    await cacheProState(isPro);
    return isPro;
  } catch (error) {
    console.warn('RevenueCat entitlement check failed. Falling back to the cached subscription state.', error);
    return readCachedProState();
  }
}

export async function purchasePro(): Promise<boolean> {
  if (!(await ensureConfigured())) {
    throw new Error('RevenueCat is not configured. Set the EXPO_PUBLIC_REVENUECAT_* keys before purchasing.');
  }

  const currentOffering = await getCurrentOffering();
  if (!currentOffering) {
    throw new Error('RevenueCat has no current offering configured.');
  }

  const selectedPackage = selectPackage(currentOffering.availablePackages);
  if (!selectedPackage) {
    throw new Error('RevenueCat has no package configured for the current offering.');
  }

  const purchaseResult = await Purchases.purchasePackage(selectedPackage);
  const customerInfo = 'customerInfo' in purchaseResult ? purchaseResult.customerInfo : purchaseResult;
  const isPro = hasEntitlement(customerInfo);
  await cacheProState(isPro);
  return isPro;
}

export async function restorePurchases(): Promise<boolean> {
  if (!(await ensureConfigured())) {
    throw new Error('RevenueCat is not configured. Set the EXPO_PUBLIC_REVENUECAT_* keys before restoring purchases.');
  }

  const customerInfo = await Purchases.restorePurchases();
  const isPro = hasEntitlement(customerInfo);
  await cacheProState(isPro);
  return isPro;
}
