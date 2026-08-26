import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit-react'
import { Box, Container, Flex, Text } from '@radix-ui/themes'
import { getVaultVersion } from '../vaultVersion'
import { AssemblyInfo } from './AssemblyInfo'

export function WalletStatus() {
  /** STEP 3 — useCurrentAccount() (@mysten/dapp-kit-react) → account for wallet status block. */
  const account = useCurrentAccount()
  /** STEP 3 — useCurrentWallet() → connected wallet handle; read its Eve Vault build version by name. */
  const wallet = useCurrentWallet()
  const vaultVersion = getVaultVersion(wallet?.name)

  return (
    <Container my="2">
      {/* STEP 3 — Reading state: connected vs not, address (full or abbreviated). */}
      {account ? (
        <Flex direction="column">
          <Box>Wallet connected</Box>
          <Box>Address: {account.address}</Box>
          {/* STEP 3 — Eve Vault build version (evefrontier:vaultVersion feature),
              distinct from wallet.version (the '1.0.0' spec version). Absent ⇒
              outdated Vault or a non-Vault wallet. */}
          <Box>
            Vault version: {vaultVersion?.vaultVersion ?? 'unavailable (update Eve Vault)'}
          </Box>
          <Box>
            Commit: {vaultVersion?.commit ?? 'unavailable (update Eve Vault)'}
          </Box>
          <Box>
            Platform: {vaultVersion?.platform ?? 'unavailable (update Eve Vault)'}
          </Box>
        </Flex>
      ) : (
        <Text>Wallet not connected</Text>
      )}

      <div className="divider" />

      <AssemblyInfo />
    </Container>
  )
}
