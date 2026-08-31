export async function getIsPro(): Promise<boolean> {
  return false;
}

export async function purchasePro(): Promise<boolean> {
  throw new Error('In-app purchases are only available in native builds.');
}

export async function restorePurchases(): Promise<boolean> {
  throw new Error('In-app purchases are only available in native builds.');
}
