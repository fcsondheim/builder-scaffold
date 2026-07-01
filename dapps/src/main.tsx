import ReactDOM from "react-dom/client";
import "./main.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import {
  NotificationProvider,
  SmartObjectProvider,
  VaultProvider,
} from "@evefrontier/dapp-kit";
import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { Theme } from "@radix-ui/themes";
import { dAppKit } from "./dappKit";

const queryClient = new QueryClient();

/** STEP 1 — Compose the provider stack with a dAppKit config that can switch between testnet, devnet, and localnet. */
/** StrictMode disabled: Mysten dapp-kit registers custom element "mysten-dapp-kit-connect-modal" on mount; StrictMode double-mounts in dev and causes "name has already been used". */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <Theme appearance="dark">
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <VaultProvider>
          <SmartObjectProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </SmartObjectProvider>
        </VaultProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  </Theme>,
);
