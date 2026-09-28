import { useCallback, useEffect, useState } from "react";
import { Button, Container, Flex } from "@radix-ui/themes";

import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { isValidSuiAddress } from "@mysten/sui/utils";

import { dAppKit as dAppKitInstance } from "../dappKit";
import { getAddressAliases } from "../queries";
import {
  addAliasTransaction,
  aliasSignedTestTransaction,
  enableAliasTransaction,
} from "../transactions/addressAliasTransactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const MAX_ALIASES = 8;

export function AddressAlias() {
  const account = useCurrentAccount();
  const dappKit = useDAppKit(dAppKitInstance);
  const currentClient = useCurrentClient({ dAppKit: dappKit });

  const [enabled, setEnabled] = useState(false);
  const [objectId, setObjectId] = useState<string | undefined>();
  const [aliases, setAliases] = useState<string[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A fresh throwaway alias key per session; paste your own to reuse an alias.
  const [activeAliasPrivKey, setActiveAliasPrivKey] = useState<string>(() =>
    new Ed25519Keypair().getSecretKey(),
  );

  const aliasKeypair = Ed25519Keypair.fromSecretKey(activeAliasPrivKey);

const aliasIsInCurrentAliases = aliases.includes(aliasKeypair.getPublicKey().toSuiAddress());

  const refresh = useCallback(async () => {
    if (!account?.address) {
      setEnabled(false);
      setObjectId(undefined);
      setAliases([]);
      return;
    }
    try {
      const info = await getAddressAliases(currentClient, account.address);
      setEnabled(info.enabled);
      setObjectId(info.objectId);
      setAliases(info.aliases);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to read aliases");
    }
  }, [account?.address, currentClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEnable = async () => {
    if (!account?.address) {
      setError("Connect wallet first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await dappKit.signAndExecuteTransaction({
        transaction: enableAliasTransaction(),
      });
      await refresh();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to enable aliasing");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!account?.address) {
      setError("Connect wallet first");
      return;
    }
    if (!objectId) {
      setError("Enable aliasing first");
      return;
    }
    const alias = newAlias.trim();
    if (!isValidSuiAddress(alias)) {
      setError("Not a valid Sui address");
      return;
    }
    if (aliases.includes(alias)) {
      setError("Address is already an alias");
      return;
    }
    if (aliases.length >= MAX_ALIASES) {
      setError(`Maximum of ${MAX_ALIASES} aliases reached`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await dappKit.signAndExecuteTransaction({
        transaction: addAliasTransaction(objectId, alias),
      });
      setNewAlias("");
      await refresh();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to add alias");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !account?.address;

  return (
    <Flex
      style={{
        padding: "16px",
        margin: "16px 0",
        border: "1px solid #ccc",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        justifyContent: "space-between",
      }}
    >
      <strong>Address Aliasing</strong>

      <p style={{ color: "#b45309", margin: 0 }}>
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
            <strong>Current aliases ({aliases.length}/{MAX_ALIASES})</strong>
            {aliases.length === 0 ? (
              <p>No aliases yet.</p>
            ) : (
              <ul>
                {aliases.map((a) => (
                  <li key={a} style={{ wordBreak: "break-all" }}>
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Flex style={{ gap: "8px" }}>
            <input
              type="text"
              placeholder="0x… alias address"
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
  Signing for an aliased transaction as {aliasKeypair.getPublicKey().toSuiAddress()}

<Flex style={{ gap: "8px" }}>
            Active alias private key: <input
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
          onClick={async () => aliasSignedTestTransaction(currentClient, account.address, aliasKeypair, aliases[0])}>
          Test transaction when alias {aliasIsInCurrentAliases ? "is registered" : "is not registered"}</Button>

</Flex>
        </>
      )}

      {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
    </Flex>
  );
}
