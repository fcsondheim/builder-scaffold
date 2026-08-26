import { getWallets } from '@wallet-standard/app'

/**
 * Wallet Standard feature that reports the Eve Vault extension's build version
 * (e.g. "0.0.15"). Distinct from `wallet.version`, which is the Wallet Standard
 * spec version ('1.0.0') and identical across every standard wallet.
 */
export const EVEFRONTIER_VAULT_VERSION = 'evefrontier:vaultVersion' as const

type VaultVersionFeature = {
  version: string
  vaultVersion: string
  commit: string
  platform: string
}

/**
 * Reads the Eve Vault build version from the registered Wallet Standard wallet
 * with the given name. Returns null when no such wallet is registered or the
 * wallet is a Vault build predating the feature — so null reads as "outdated or
 * non-Vault wallet".
 *
 * Resolves the wallet via getWallets() (window-event discovery) rather than a
 * dapp-kit UiWallet handle: the handle resolves through @wallet-standard/ui's
 * registry, and this dependency tree contains two copies of that registry, so
 * handle lookups throw "No underlying Wallet Standard wallet could be found".
 */
export function getVaultVersion(
  walletName: string | null | undefined,
): { vaultVersion: string | null; commit: string | null; platform: string | null } | null {
  if (!walletName) return null

  const wallet = getWallets()
    .get()
    .find((w) => w.name === walletName)
  const feature = wallet?.features[EVEFRONTIER_VAULT_VERSION] as
    | VaultVersionFeature
    | undefined

  return {vaultVersion: feature?.vaultVersion || null, commit: feature?.commit || null, platform: feature?.platform || null}
}
