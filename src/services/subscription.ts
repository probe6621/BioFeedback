import { Platform } from 'react-native';

type SubscriptionModule = typeof import('./subscription.native');

const implementation: SubscriptionModule =
  Platform.OS === 'web'
    ? require('./subscription.web')
    : require('./subscription.native');

export const getIsPro = implementation.getIsPro;
export const purchasePro = implementation.purchasePro;
export const restorePurchases = implementation.restorePurchases;
