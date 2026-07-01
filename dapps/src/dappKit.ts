import { createDAppKit } from "@mysten/dapp-kit-react";
import { createSuiClient, NETWORKS } from "./networks";

export const dAppKit = createDAppKit({
  networks: NETWORKS,
  defaultNetwork: "testnet",
  createClient: createSuiClient,
});
