import {
  BrowserPasskeyProvider,
  findCommonPublicKey,
  PasskeyKeypair,
} from '@mysten/sui/keypairs/passkey'

/**
 * WebAuthn passkey helpers for alias signing.
 *
 * A passkey is origin-bound: `rpId` must be the current hostname, and the browser
 * only exposes WebAuthn over a secure origin (localhost or HTTPS). The keypair has
 * no extractable private key — its Sui address is derived from the recovered public
 * key, and that address is what must be registered as an alias.
 */

const RP_NAME = 'Sui Passkey Example'

export function makePasskeyProvider(): BrowserPasskeyProvider {
  // The provider reads `rp.id` (the origin-bound relying-party id); `rp.name`
  // defaults to the provider name. The `rpName`/`rpId` shown in the SDK docs are
  // ignored at runtime, so set `rp` directly.
  return new BrowserPasskeyProvider(RP_NAME, {
    rp: {
      name: RP_NAME,
      id: window.location.hostname,
    },
  })
}

/**
 * Recover an already-registered passkey into a signable `PasskeyKeypair`.
 *
 * WebAuthn returns 2–4 candidate public keys per signature, so we sign two distinct
 * messages and take the common key to uniquely identify the passkey. Must be called
 * from a direct user gesture (button click) — each `signAndRecover` triggers a
 * WebAuthn prompt.
 */
export async function recoverPasskeyKeypair(): Promise<PasskeyKeypair> {
  const provider = makePasskeyProvider()

  const m1 = new TextEncoder().encode('Sui alias passkey recovery 1')
  const m2 = new TextEncoder().encode('Sui alias passkey recovery 2')

  const pks1 = await PasskeyKeypair.signAndRecover(provider, m1)
  const pks2 = await PasskeyKeypair.signAndRecover(provider, m2)

  const commonPk = findCommonPublicKey(pks1, pks2)
  return new PasskeyKeypair(commonPk.toRawBytes(), provider)
}
