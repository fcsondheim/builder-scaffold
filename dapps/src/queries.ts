import {
  // Assembly + Owner (most useful for EVE)
  getAssemblyWithOwner, // Assembly + character info in one call
  getObjectWithJson, // Object with JSON contents
  // Ownership queries
  getOwnedObjectsByType, // Objects of type owned by address
  // Transformation functions
  transformToAssembly,
} from '@evefrontier/dapp-kit'

/**
 * STEP 5 (optional) — When useSmartObject isn't enough.
 * getAssemblyWithOwner() for assembly + character;
 * transformToAssembly() for typed Assembly from raw move object.
 * Other helpers: executeGraphQLQuery, getOwnedObjectsByType, getObjectsByType, getSingletonObjectByType.
 */
async function fetchAssemblyInfo(assemblyId: string) {
  // 1. Fetch raw data from GraphQL
  const { moveObject, assemblyOwner } = await getAssemblyWithOwner(assemblyId)

  if (!moveObject) {
    console.error('Assembly not found')
    return null
  }

  // 2. Access raw JSON data directly
  const rawJson = moveObject.contents.json
  console.log('Raw assembly data:', rawJson)
  console.log('Character owner:', assemblyOwner)

  // 3. Or transform to typed Assembly object
  const assembly = await transformToAssembly(assemblyId, moveObject, {
    character: assemblyOwner,
  })
  console.log('Transformed assembly:', assembly)

  return { assembly, character: assemblyOwner }
}

/** STEP 5 — getObjectWithJson() for object by ID with JSON. */
async function fetchObjectData(objectId: string) {
  const result = await getObjectWithJson(objectId)

  const json = result.data?.object?.asMoveObject?.contents?.json
  const type = result.data?.object?.asMoveObject?.contents?.type?.repr

  console.log('Object type:', type)
  console.log('Object data:', json)

  return json
}

/** STEP 5 — getOwnedObjectsByType() for owned objects by type and wallet address. */
async function fetchUserAssemblies(
  walletAddress: string,
  assemblyType: string,
) {
  const result = await getOwnedObjectsByType(walletAddress, assemblyType)

  const objectAddresses = result.data?.address?.objects?.nodes.map(
    (node) => node.address,
  )

  console.log('Owned object addresses:', objectAddresses)
  return objectAddresses
}

import type { SuiGrpcClient } from '@mysten/sui/grpc'
import { ADDRESS_ALIASES_TYPE } from './transactions/addressAliasTransactions'

export interface AddressAliasesInfo {
  /** true if the address has an AddressAliases object (aliasing enabled). */
  enabled: boolean
  /** the AddressAliases object id, when enabled. */
  objectId?: string
  /** the current alias addresses. */
  aliases: string[]
}

/**
 * Read the caller's AddressAliases owned object via listOwnedObjects (its id isn't
 * known ahead of time — it's minted by `enable`). Returns enabled=false when absent.
 *
 * ⚠️ The shape of `json` depends on the Move struct — parsing is defensive. Confirm
 * the actual field name once the module ABI is known.
 */
async function getAddressAliases(
  client: SuiGrpcClient,
  owner: string,
): Promise<AddressAliasesInfo> {
  const result = await client.listOwnedObjects({
    owner,
    type: ADDRESS_ALIASES_TYPE,
    include: { json: true },
  })

  const object = result.objects[0]

  if (!object) {
    return { enabled: false, aliases: [] }
  }

  const json = object.json as Record<string, unknown> | undefined
  const aliasesField = json?.aliases as { contents?: unknown } | undefined
  const raw = aliasesField?.contents
  const aliases = Array.isArray(raw) ? (raw as string[]) : []

  return { enabled: true, objectId: object.objectId, aliases }
}

export {
  fetchAssemblyInfo,
  fetchObjectData,
  fetchUserAssemblies,
  getAddressAliases,
}
