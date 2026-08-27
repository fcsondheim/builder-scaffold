import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from '@mysten/dapp-kit-react'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import type { PasskeyKeypair } from '@mysten/sui/keypairs/passkey'
import { isValidSuiAddress } from '@mysten/sui/utils'
import { Button, Container, Flex } from '@radix-ui/themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { dAppKit as dAppKitInstance } from '../dappKit'
import { recoverPasskeyKeypair } from '../passkey'
import { getAddressAliases } from '../queries'
import {
  addAliasTransaction,
  aliasSignedTestTransaction,
  enableAliasTransaction,
} from '../transactions/addressAliasTransactions'

const MAX_ALIASES = 8

export function AddressAlias() {
  const account = useCurrentAccount()
  const dappKit = useDAppKit(dAppKitInstance)
  const currentClient = useCurrentClient({ dAppKit: dappKit })

  const [enabled, setEnabled] = useState(false)
  const [objectId, setObjectId] = useState<string | undefined>()
  const [aliases, setAliases] = useState<string[]>([])
  const [newAlias, setNewAlias] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeAliasPrivKey, setActiveAliasPrivKey] = useState<string>(
    'suiprivkey1qr2xkm8tlm2cvzhfnxp8f3nl24w0afzjuw2hndp4v97uca0kwyvasssaxkt',
  )

  const aliasKeypair = Ed25519Keypair.fromSecretKey(activeAliasPrivKey)

  const aliasIsInCurrentAliases = aliases.includes(
    aliasKeypair.getPublicKey().toSuiAddress(),
  )

  // Recovered passkey signer. The keypair itself is non-serializable, so it lives in
  // a ref; only its derived address is mirrored into state for rendering.
  const passkeyKeypairRef = useRef<PasskeyKeypair | null>(null)
  const [passkeyAddress, setPasskeyAddress] = useState<string | undefined>()

  const passkeyIsInCurrentAliases =
    !!passkeyAddress && aliases.includes(passkeyAddress)

  const refresh = useCallback(async () => {
    if (!account?.address) {
      setEnabled(false)
      setObjectId(undefined)
      setAliases([])
      return
    }
    try {
      const info = await getAddressAliases(currentClient, account.address)
      setEnabled(info.enabled)
      setObjectId(info.objectId)
      setAliases(info.aliases)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to read aliases')
    }
  }, [account?.address, currentClient])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleEnable = async () => {
    if (!account?.address) {
      setError('Connect wallet first')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await dappKit.signAndExecuteTransaction({
        transaction: enableAliasTransaction(),
      })
      await refresh()
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to enable aliasing')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!account?.address) {
      setError('Connect wallet first')
      return
    }
    if (!objectId) {
      setError('Enable aliasing first')
      return
    }
    const alias = newAlias.trim()
    if (!isValidSuiAddress(alias)) {
      setError('Not a valid Sui address')
      return
    }
    if (aliases.includes(alias)) {
      setError('Address is already an alias')
      return
    }
    if (aliases.length >= MAX_ALIASES) {
      setError(`Maximum of ${MAX_ALIASES} aliases reached`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await dappKit.signAndExecuteTransaction({
        transaction: addAliasTransaction(objectId, alias),
      })
      setNewAlias('')
      await refresh()
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to add alias')
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverPasskey = async () => {
    setLoading(true)
    setError(null)
    try {
      const keypair = await recoverPasskeyKeypair()
      passkeyKeypairRef.current = keypair
      setPasskeyAddress(keypair.getPublicKey().toSuiAddress())
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to recover passkey')
    } finally {
      setLoading(false)
    }
  }

  const handleSignWithPasskey = async () => {
    if (!account?.address) {
      setError('Connect wallet first')
      return
    }
    if (!passkeyKeypairRef.current) {
      setError('Recover a passkey first')
      return
    }
    if (aliases.length === 0) {
      setError('No aliases to send to')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await aliasSignedTestTransaction(
        currentClient,
        account.address,
        passkeyKeypairRef.current,
        aliases[0],
      )
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to sign with passkey')
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || !account?.address

  return (
    <Flex
      style={{
        padding: '16px',
        margin: '16px 0',
        border: '1px solid #ccc',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        justifyContent: 'space-between',
      }}
    >
      <strong>Address Aliasing</strong>

      <p style={{ color: '#b45309', margin: 0 }}>
        ⚠️ Any alias can unilaterally control this address and all its assets.
      </p>

      {!account?.address && <p>Connect your wallet to manage aliases.</p>}

      {account?.address && !enabled && (
        <button onClick={handleEnable} disabled={disabled}>
          Enable aliasing
        </button>
      )}

      {account?.address && enabled && (
        <>
          <div>
            <strong>
              Current aliases ({aliases.length}/{MAX_ALIASES})
            </strong>
            {aliases.length === 0 ? (
              <p>No aliases yet.</p>
            ) : (
              <ul>
                {aliases.map((a) => (
                  <li key={a} style={{ wordBreak: 'break-all' }}>
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Flex style={{ gap: '8px' }}>
            <input
              type="text"
              placeholder="0x… alias Sui address"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              disabled={disabled}
              style={{ flex: 1 }}
            />
            <button
              onClick={handleAdd}
              disabled={disabled || aliases.length >= MAX_ALIASES}
            >
              Add alias
            </button>
          </Flex>

          <Flex>
            <Container>
              Signing for an aliased transaction as{' '}
              {aliasKeypair.getPublicKey().toSuiAddress()}
              <Flex style={{ gap: '8px' }}>
                Active alias private key:{' '}
                <input
                  type="text"
                  placeholder="Active Alias Private Key"
                  value={activeAliasPrivKey}
                  onChange={(e) => setActiveAliasPrivKey(e.target.value)}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
              </Flex>
            </Container>
            <Button
              onClick={async () =>
                aliasSignedTestTransaction(
                  currentClient,
                  account.address,
                  aliasKeypair,
                  aliases[0],
                )
              }
            >
              Test transaction when alias{' '}
              {aliasIsInCurrentAliases ? 'is registered' : 'is not registered'}
            </Button>
          </Flex>

          <Flex direction="column" style={{ gap: '8px' }}>
            <Container>
              Signing for an aliased transaction with a passkey
              {passkeyAddress ? (
                <div style={{ wordBreak: 'break-all' }}>
                  Recovered passkey address: {passkeyAddress} —{' '}
                  {passkeyIsInCurrentAliases
                    ? 'is registered'
                    : 'is not registered'}
                </div>
              ) : (
                <div>No passkey recovered yet.</div>
              )}
            </Container>
            <Flex style={{ gap: '8px' }}>
              <Button onClick={handleRecoverPasskey} disabled={disabled}>
                Recover passkey
              </Button>
              <Button
                onClick={handleSignWithPasskey}
                disabled={disabled || !passkeyAddress || aliases.length === 0}
              >
                Sign aliased transaction with passkey
              </Button>
            </Flex>
          </Flex>
        </>
      )}

      {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
    </Flex>
  )
}
