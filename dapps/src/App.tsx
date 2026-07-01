import { Box, Flex, Heading } from "@radix-ui/themes";
import { WalletStatus } from "./components/WalletStatus";
import { abbreviateAddress, useConnection } from "@evefrontier/dapp-kit";
import {
  useCurrentAccount,
  useCurrentNetwork,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { dAppKit as dAppKitInstance } from "./dappKit";
import { NETWORKS } from "./networks";
import { WalletActions } from "./components/WalletActions";
import { AddressAlias } from "./components/AddressAlias";

function App() {
  /**
   * STEP 2 — Wallet connection
   *
   * useConnection() (@evefrontier/dapp-kit) → handleConnect, handleDisconnect;
   * isConnected, walletAddress, hasEveVault. useCurrentAccount()
   * (@mysten/dapp-kit-react) → account (e.g. account.address) for UI. abbreviateAddress()
   * (@evefrontier/dapp-kit) for display.
   */
  const { handleConnect, handleDisconnect } = useConnection();
  const dappKit = useDAppKit(dAppKitInstance);
  const account = useCurrentAccount({ dAppKit: dappKit });
  const currentNetwork = useCurrentNetwork({ dAppKit: dappKit });

  console.log("account", account);

  return (
    <Box style={{ padding: "20px" }}>
      <Flex
        position="sticky"
        px="4"
        py="2"
        direction="row"
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Heading>EVE Frontier dApp Starter Template</Heading>

        {/* STEP 2 — Connect/disconnect; show abbreviated address in header. */}
        <button
          onClick={() =>
            account?.address ? handleDisconnect() : handleConnect()
          }
        >
          {account ? abbreviateAddress(account?.address) : "Connect Wallet"}
        </button>
      </Flex>

      <Flex
        className="network-switch"
        role="group"
        aria-label="Network mode"
      >
        {NETWORKS.map((network) => (
          <button
            key={network}
            className="network-switch__button"
            aria-pressed={currentNetwork === network}
            onClick={() => dappKit.switchNetwork(network)}
          >
            {network}
          </button>
        ))}
      </Flex>

      {/* STEP 3 — Same hooks (useConnection, useCurrentAccount) drive WalletStatus; state stays in sync. */}
      <WalletStatus />

        <WalletActions />

        <AddressAlias />
    </Box>
  );
}

export default App;
