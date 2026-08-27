import { Severity, useNotification } from '@evefrontier/dapp-kit'
import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from '@mysten/dapp-kit-react'
import { isValidSuiAddress } from '@mysten/sui/utils'
import { Flex } from '@radix-ui/themes'
import { useCallback, useEffect, useState } from 'react'
import { dAppKit as dAppKitInstance } from '../dappKit'
import { getAddressAliases } from '../queries'
import {
  addAliasTransaction,
  enableAliasTransaction,
} from '../transactions/addressAliasTransactions'
import { AliasPasskeyTest } from './AliasPasskeyTest'
import { AliasPrivateKeyTest } from './AliasPrivateKeyTest'

const MAX_ALIASES = 8

export function AddressAlias() {
  const account = useCurrentAccount()
  const dappKit = useDAppKit(dAppKitInstance)
  const currentClient = useCurrentClient({ dAppKit: dappKit })
  const { notify } = useNotification()

  const [enabled, setEnabled] = useState(false)
  const [objectId, setObjectId] = useState<string | undefined>()
  const [aliases, setAliases] = useState<string[]>([])
  const [selectedAlias, setSelectedAlias] = useState<string | undefined>()
  const [newAlias, setNewAlias] = useState('')
  const [loading, setLoading] = useState(false)

  const notifyError = useCallback(
    (fallback: string, e: unknown) => {
      console.error(e)
      notify({
        type: Severity.Error,
        message: e instanceof Error ? e.message : fallback,
      })
    },
    [notify],
  )

  const refresh = useCallback(async () => {
    if (!account?.address) {
      setEnabled(false)
      setObjectId(undefined)
      setAliases([])
      setSelectedAlias(undefined)
      return
    }
    try {
      const info = await getAddressAliases(currentClient, account.address)
      setEnabled(info.enabled)
      setObjectId(info.objectId)
      setAliases(info.aliases)
      // Keep the current selection if it still exists, else default to the first.
      setSelectedAlias((prev) =>
        prev && info.aliases.includes(prev) ? prev : info.aliases[0],
      )
    } catch (e) {
      notifyError('Failed to read aliases', e)
    }
  }, [account?.address, currentClient, notifyError])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleEnable = async () => {
    if (!account?.address) {
      notify({ type: Severity.Error, message: 'Connect wallet first' })
      return
    }
    setLoading(true)
    try {
      await dappKit.signAndExecuteTransaction({
        transaction: enableAliasTransaction(),
      })
      await refresh()
    } catch (e) {
      notifyError('Failed to enable aliasing', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!account?.address) {
      notify({ type: Severity.Error, message: 'Connect wallet first' })
      return
    }
    if (!objectId) {
      notify({ type: Severity.Error, message: 'Enable aliasing first' })
      return
    }
    const alias = newAlias.trim()
    if (!isValidSuiAddress(alias)) {
      notify({ type: Severity.Error, message: 'Not a valid Sui address' })
      return
    }
    if (aliases.includes(alias)) {
      notify({ type: Severity.Error, message: 'Address is already an alias' })
      return
    }
    if (aliases.length >= MAX_ALIASES) {
      notify({
        type: Severity.Error,
        message: `Maximum of ${MAX_ALIASES} aliases reached`,
      })
      return
    }
    setLoading(true)
    try {
      await dappKit.signAndExecuteTransaction({
        transaction: addAliasTransaction(objectId, alias),
      })
      setNewAlias('')
      await refresh()
    } catch (e) {
      notifyError('Failed to add alias', e)
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
              Current aliases ({aliases.length}/{MAX_ALIASES}) — select the
              passkey alias
            </strong>
            {aliases.length === 0 ? (
              <p>No aliases yet.</p>
            ) : (
              <Flex direction="column" style={{ gap: '4px', marginTop: '4px' }}>
                {aliases.map((a) => (
                  <label
                    key={a}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      wordBreak: 'break-all',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="selected-alias"
                      value={a}
                      checked={selectedAlias === a}
                      onChange={() => setSelectedAlias(a)}
                    />
                    {a}
                  </label>
                ))}
              </Flex>
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

          <AliasPasskeyTest
            client={currentClient}
            aliasedAddress={account.address}
            selectedAlias={selectedAlias}
          />

          <AliasPrivateKeyTest
            client={currentClient}
            aliasedAddress={account.address}
            aliases={aliases}
          />
        </>
      )}
    </Flex>
  )
}
