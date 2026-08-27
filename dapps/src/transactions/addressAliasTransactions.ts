import type { Signer } from '@mysten/sui/cryptography'
import type { SuiGrpcClient } from '@mysten/sui/grpc'
import { coinWithBalance, Transaction } from '@mysten/sui/transactions'
import { fromBase64 } from '@mysten/sui/utils'

/**
 * Address alias management PTBs (sui::address_alias).
 *
 * ⚠️ CONFIRM AGAINST THE ACTUAL MODULE ABI — the doc page is CLI-oriented, so the
 * package address, function names, argument order, and whether `enable` returns an
 * object to transfer are best-guesses below. Adjust as needed.
 *
 * Docs: https://docs.sui.io/develop/transactions/transaction-auth/address-aliases
 */

/** Shared AddressAliasState singleton. */
export const ADDRESS_ALIAS_STATE = '0xa'

/** `sui` framework package (0x2) — confirm the module lives here. */
export const ADDRESS_ALIAS_MODULE = '0x2::address_alias'

/** Fully-qualified type of the per-address AddressAliases owned object. */
export const ADDRESS_ALIASES_TYPE = '0x2::address_alias::AddressAliases'

/** CLI examples use a 50,000,000 gas budget. */
const GAS_BUDGET = 50_000_000

/**
 * Enable alias configuration for the sender. Creates the caller's AddressAliases
 * object. Assumes `enable` transfers the object internally (matching the CLI, which
 * does not transfer a returned value). If it instead RETURNS the object, capture the
 * result and `tx.transferObjects([result], sender)`.
 */
export function enableAliasTransaction(): Transaction {
  const tx = new Transaction()

  tx.moveCall({
    target: `${ADDRESS_ALIAS_MODULE}::enable`,
    arguments: [tx.object(ADDRESS_ALIAS_STATE)],
  })

  tx.setGasBudget(GAS_BUDGET)
  return tx
}

/**
 * Add a new alias address to the caller's AddressAliases object.
 *
 * @param aliasesObjectId the caller's AddressAliases object id (from the read path)
 * @param alias the address to add as an alias
 */
export function addAliasTransaction(
  aliasesObjectId: string,
  alias: string,
): Transaction {
  const tx = new Transaction()

  tx.moveCall({
    target: `${ADDRESS_ALIAS_MODULE}::add`,
    arguments: [
      // tx.object(ADDRESS_ALIAS_STATE),
      tx.object(aliasesObjectId),
      tx.pure.address(alias),
    ],
  })

  tx.setGasBudget(GAS_BUDGET)
  return tx
}

/**
 * Build, sign, and execute a test transfer that is FROM `aliasedAddress`
 * but SIGNED by one of its alias keypairs. Returns the transaction digest on
 * success; throws with the failed digest/status otherwise.
 */
export async function aliasSignedTestTransaction(
  client: SuiGrpcClient,
  aliasedAddress: string, // the address whose coins are spent (NOT the signer's address),
  aliasSigner: Signer, // any Signer registered as an alias (Ed25519Keypair, PasskeyKeypair, …)
  recipient: string,
): Promise<string> {
  const tx = new Transaction()
  tx.setSender(aliasedAddress) // tx is FROM the aliased address
  tx.setGasOwner(aliasedAddress) // gas also paid by it → one alias sig covers both

  tx.transferObjects([coinWithBalance({ balance: 100 })], recipient)

  // sign() needs the client to resolve gas coins / object versions.
  const { bytes, signature } = await tx.sign({ client, signer: aliasSigner })

  const result = await client.executeTransaction({
    transaction: fromBase64(bytes),
    signatures: [signature],
  })

  if (result.$kind !== 'Transaction') {
    const { digest, status } = result.FailedTransaction
    const reason = status.error ? JSON.stringify(status.error) : 'unknown error'
    throw new Error(`Transaction failed (${digest}): ${reason}`)
  }

  return result.Transaction.digest
}
