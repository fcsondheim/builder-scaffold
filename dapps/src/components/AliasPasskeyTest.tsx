import { Severity, useNotification } from '@evefrontier/dapp-kit'
import type { SuiGrpcClient } from '@mysten/sui/grpc'
import { Button, Container, Flex } from '@radix-ui/themes'
import { useState } from 'react'
import { recoverPasskeyForAlias } from '../passkey'
import { aliasSignedTestTransaction } from '../transactions/addressAliasTransactions'

interface AliasPasskeyTestProps {
  client: SuiGrpcClient
  aliasedAddress: string
  selectedAlias: string | undefined
}

/**
 * Sign a test transfer FROM the aliased address using a passkey registered as
 * `selectedAlias`. One click, two WebAuthn prompts: recover the passkey (matching the
 * selected alias) then sign the transaction with it.
 */
export function AliasPasskeyTest({
  client,
  aliasedAddress,
  selectedAlias,
}: AliasPasskeyTestProps) {
  const { notify } = useNotification()
  const [loading, setLoading] = useState(false)

  const handleSignWithPasskey = async () => {
    if (!selectedAlias) return
    setLoading(true)
    try {
      const signer = await recoverPasskeyForAlias(selectedAlias) // prompt 1: recover
      const digest = await aliasSignedTestTransaction(
        client,
        aliasedAddress,
        signer,
        aliasedAddress,
      ) // prompt 2: sign
      notify({ type: Severity.Success, txHash: digest })
    } catch (e) {
      console.error(e)
      notify({
        type: Severity.Error,
        message: e instanceof Error ? e.message : 'Failed to sign with passkey',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="column" style={{ gap: '8px' }}>
      <Container>
        Sign an aliased transaction with a passkey registered as{' '}
        <span style={{ wordBreak: 'break-all' }}>
          {selectedAlias ?? '(select an alias above)'}
        </span>
      </Container>
      <Button
        onClick={handleSignWithPasskey}
        disabled={loading || !selectedAlias}
      >
        Sign aliased transaction with passkey
      </Button>
    </Flex>
  )
}
