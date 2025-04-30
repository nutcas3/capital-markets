export * from './swap';
export * from './quote';
export * from './liquidity';

export const PRODUCTION_POOLS = {
  susd: 'susdPoolAddress123456789',
  tripool: 'tripoolAddress123456789',
  usds: 'usdsPoolAddress123456789'
};

export function init(options: any = {}) {
  return {
    initialized: true,
    options,
    timestamp: new Date().toISOString()
  };
}

export function loadKeypairFromFile(path: string) {
  return {
    publicKey: 'mockPublicKey',
    secretKey: 'mockSecretKey'
  };
}

export function buildOptimalTransaction(options: any = {}) {
  return {
    ...options,
    priorityFee: options.priorityFee || 'auto',
    computeUnitLimit: options.computeUnitLimit || 1500000
  };
}
