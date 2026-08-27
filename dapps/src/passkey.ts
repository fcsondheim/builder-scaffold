import {
  BrowserPasskeyProvider,
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
 * Recover an already-registered passkey into a signable `PasskeyKeypair`, given the
 * Sui address it is registered under (its alias address).
 *
 * A single `signAndRecover` returns up to 4 candidate public keys; because we already
 * know the target address we pick the candidate whose derived address matches, instead
 * of signing a second message and disambiguating with `findCommonPublicKey`. This is
 * the "check against known key" shortcut the SDK docstring calls out — one WebAuthn
 * prompt instead of two. Must be called from a direct user gesture (button click).
 */
export async function recoverPasskeyForAlias(
  knownAlias: string,
): Promise<PasskeyKeypair> {
  const provider = makePasskeyProvider()

  const message = new TextEncoder().encode('Sui alias passkey recovery')
  const candidates = await PasskeyKeypair.signAndRecover(provider, message)

  const match = candidates.find((pk) => pk.toSuiAddress() === knownAlias)
  if (!match) {
    throw new Error('No passkey candidate matches the registered alias address')
  }
  return new PasskeyKeypair(match.toRawBytes(), provider)
}
