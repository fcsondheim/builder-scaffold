import { SuiGrpcClient } from "@mysten/sui/grpc";

export const NETWORKS = ["testnet", "devnet", "localnet"] as [
  "testnet",
  "devnet",
  "localnet",
];

export type NetworkMode = (typeof NETWORKS)[number];

export function createSuiClient(network: NetworkMode) {
  return new SuiGrpcClient({
    network,
    baseUrl:
      network === "localnet"
        ? "http://127.0.0.1:9000"
        : `https://fullnode.${network}.sui.io:443`,
  });
}
