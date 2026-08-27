import { Severity, useNotification } from '@evefrontier/dapp-kit'
import type { SuiGrpcClient } from '@mysten/sui/grpc'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Button, Container, Flex } from '@radix-ui/themes'
import { useState } from 'react'
import { aliasSignedTestTransaction } from '../transactions/addressAliasTransactions'

interface AliasPrivateKeyTestProps {
  client: SuiGrpcClient
  aliasedAddress: string
  aliases: string[]
}

/**
 * The original private-key test path: derive an Ed25519 keypair from a pasted secret
 * key and sign a test transfer FROM the aliased address with it. The button label
 * reflects whether that derived address is currently a registered alias.
 */
export function AliasPrivateKeyTest({
  client,
  aliasedAddress,
  aliases,
}: AliasPrivateKeyTestProps) {
  const { notify } = useNotification()
  const [loading, setLoading] = useState(false)
  const [activeAliasPrivKey, setActiveAliasPrivKey] = useState<string>(
    'suiprivkey1qr2xkm8tlm2cvzhfnxp8f3nl24w0afzjuw2hndp4v97uca0kwyvasssaxkt',
  )

  const aliasKeypair = Ed25519Keypair.fromSecretKey(activeAliasPrivKey)
  const aliasIsInCurrentAliases = aliases.includes(
    aliasKeypair.getPublicKey().toSuiAddress(),
  )

  const handleTest = async () => {
    setLoading(true)
    try {
      const digest = await aliasSignedTestTransaction(
        client,
        aliasedAddress,
        aliasKeypair,
        aliasedAddress,
      )
      notify({ type: Severity.Success, txHash: digest })
    } catch (e) {
      console.error(e)
      notify({
        type: Severity.Error,
        message: e instanceof Error ? e.message : 'Failed to sign transaction',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex>
      <Container>
        Signing for an aliased transaction as{' '}
        <span style={{ wordBreak: 'break-all' }}>
          {aliasKeypair.getPublicKey().toSuiAddress()}
        </span>
        <Flex style={{ gap: '8px' }}>
          Active alias private key:{' '}
          <input
            type="text"
            placeholder="Active Alias Private Key"
            value={activeAliasPrivKey}
            onChange={(e) => setActiveAliasPrivKey(e.target.value)}
            disabled={loading}
            style={{ flex: 1 }}
          />
        </Flex>
      </Container>
      <Button onClick={handleTest} disabled={loading}>
        Test transaction when alias{' '}
        {aliasIsInCurrentAliases ? 'is registered' : 'is not registered'}
      </Button>
    </Flex>
  )
}
