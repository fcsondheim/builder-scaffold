import { coinWithBalance, Transaction } from '@mysten/sui/transactions'

export function createTestTransaction(recipient: string) {
  const transaction = new Transaction()

  transaction.transferObjects([coinWithBalance({ balance: 100 })], recipient)

  return transaction
}
