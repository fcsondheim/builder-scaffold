import {
  Assemblies,
  SponsoredTransactionActions,
  TenantId,
  useSponsoredTransaction,
  type AssemblyType,
} from '@evefrontier/dapp-kit'
import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from '@mysten/dapp-kit-react'
import { fromBase64 } from '@mysten/sui/utils'
import {
  verifyPersonalMessageSignature,
  verifyTransactionSignature,
} from '@mysten/sui/verify'
import { Flex } from '@radix-ui/themes'
import { useState } from 'react'
import { dAppKit as dAppKitInstance } from '../dappKit'

import { createTestTransaction } from '../transactions/createTestTransaction'

export function WalletActions() {
  /** STEP 3 — useCurrentAccount() (@mysten/dapp-kit-react) → account for wallet status block. */
  const account = useCurrentAccount()

  const dappKit = useDAppKit(dAppKitInstance)
  const currentClient = useCurrentClient({ dAppKit: dappKit })

  /**
   * STEP 4 — Sponsored transaction (gas paid by the EVE Frontier backend).
   * useSponsoredTransaction() (@evefrontier/dapp-kit) drives an UPDATE_METADATA
   * action against an assembly. Requires an EVE Vault wallet that implements the
   * `evefrontier:sponsoredTransaction` feature.
   */
  const { mutateAsync: sendSponsoredTransaction, isPending: sponsorPending } =
    useSponsoredTransaction()

  // Tenant defaults to Tetra (test) but is switchable.
  const [tenant, setTenant] = useState<TenantId>(TenantId.TETRA)
  const [itemId, setItemId] = useState('')
  const [metaName, setMetaName] = useState('Test Assembly')
  const [metaDescription, setMetaDescription] = useState(
    'Updated via sponsored transaction',
  )
  const [metaUrl, setMetaUrl] = useState('')

  return (
    <Flex
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        justifyContent: 'space-between',
      }}
    >
      <button
        onClick={async () => {
          if (!account?.address) {
            return
          }

          const personalMessage = new TextEncoder().encode('Hello, world!')
          await dappKit
            .signPersonalMessage({
              message: personalMessage,
            })
            .then(async (signature) => {
              console.log(signature)
              console.log('account?.address', account?.address)

              verifyPersonalMessageSignature(
                personalMessage,
                signature.signature,
                {
                  client: currentClient,
                },
              )
                .then((publicKey) => {
                  console.log(publicKey, account?.address)
                  console.log(publicKey.verifyAddress(account?.address))
                })
                .catch((error) => {
                  console.error(error)
                })
            })
        }}
      >
        Sign personal message
      </button>

      <button
        onClick={async () => {
          if (!account?.address) {
            console.error('Connect wallet first')
            return
          }

          const transaction = createTestTransaction(account.address)

          dappKit
            .signTransaction({
              transaction,
            })
            .then(async (signedTx) => {
              const verify = verifyTransactionSignature(
                fromBase64(signedTx.bytes),
                signedTx.signature,
                {
                  client: currentClient,
                },
              )
              console.log(verify)
            })
            .catch((error) => {
              console.error(error)
            })
        }}
      >
        Sign-only transaction
      </button>

      <button
        onClick={async () => {
          if (!account?.address) {
            console.error('Connect wallet first')
            return
          }

          const transaction = createTestTransaction(account.address)

          dappKit
            .signAndExecuteTransaction({
              transaction,
            })
            .then(async (signature) => {
              console.log(signature)
            })
            .catch((error) => {
              console.error(error)
            })
        }}
      >
        Sign and execute test transactions
      </button>

      {/* STEP 4 — Sponsored update-metadata transaction. Gas is paid by the EVE
          Frontier backend for the selected tenant; the connected wallet only
          signs. Requires an EVE Vault wallet with the sponsoredTransaction
          feature and an assembly item_id the wallet is allowed to edit. */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px',
          border: '1px solid #ccc',
          borderRadius: '8px',
        }}
      >
        <div>
        <strong>Sponsored transaction (edit metadata)</strong>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          Tenant
          <select
            value={tenant}
            onChange={(e) => setTenant(e.target.value as TenantId)}
          >
            {Object.values(TenantId).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          Assembly item_id
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 12345"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          Name
          <input
            type="text"
            placeholder="Metadata name"
            value={metaName}
            onChange={(e) => setMetaName(e.target.value)}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          Description
          <input
            type="text"
            placeholder="Metadata description"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          URL
          <input
            type="text"
            placeholder="Metadata url (optional)"
            value={metaUrl}
            onChange={(e) => setMetaUrl(e.target.value)}
          />
        </label>
        </div>

        <button
          disabled={sponsorPending}
          onClick={async () => {
            if (!account?.address) {
              console.error('Connect wallet first')
              return
            }

            const parsedItemId = Number(itemId.trim())
            if (!Number.isInteger(parsedItemId) || parsedItemId < 0) {
              console.error(
                'Assembly item_id must be a non-negative integer; got',
                itemId,
              )
              return
            }

            const assembly = {
              item_id: parsedItemId,
              type: Assemblies.Assembly,
            } as AssemblyType<Assemblies>

            try {
              const result = await sendSponsoredTransaction({
                txAction: SponsoredTransactionActions.UPDATE_METADATA,
                assembly,
                tenant,
                account: account.address,
                metadata: {
                  name: metaName.trim() || undefined,
                  description: metaDescription.trim() || undefined,
                  url: metaUrl.trim() || undefined,
                },
              })
              console.log('Sponsored transaction digest:', result.digest)
              console.log('Sponsored transaction result:', result)
            } catch (error) {
              console.error(error)
            }
          }}
        >
          {sponsorPending
            ? 'Sending sponsored transaction…'
            : 'Sponsored edit-metadata transaction'}
        </button>
      </div>
    </Flex>
  )
}
