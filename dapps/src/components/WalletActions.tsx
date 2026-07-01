import { Flex } from "@radix-ui/themes";

import {
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { dAppKit as dAppKitInstance } from "../dappKit";
import {
  verifyPersonalMessageSignature,
  verifyTransactionSignature,
} from "@mysten/sui/verify";
import { fromBase64 } from "@mysten/sui/utils";

import { createTestTransaction } from "../transactions/createTestTransaction";

export function WalletActions() {
  /** STEP 3 — useCurrentAccount() (@mysten/dapp-kit-react) → account for wallet status block. */
  const account = useCurrentAccount();

  const dappKit = useDAppKit(dAppKitInstance);
  const currentClient = useCurrentClient({ dAppKit: dappKit });

  return (
     <Flex
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={async () => {
            if (!account?.address) {
              return;
            }

            const personalMessage = new TextEncoder().encode("Hello, world!");
            await dappKit
              .signPersonalMessage({
                message: personalMessage,
              })
              .then(async (signature) => {
                console.log(signature);
                console.log("account?.address", account?.address);

                verifyPersonalMessageSignature(
                  personalMessage,
                  signature.signature,
                  {
                    client: currentClient,
                  },
                )
                  .then((publicKey) => {
                    console.log(publicKey, account?.address);
                    console.log(publicKey.verifyAddress(account?.address));
                  })
                  .catch((error) => {
                    console.error(error);
                  });
              });
          }}
        >
          Sign personal message
        </button>

        <button
          onClick={async () => {
            if (!account?.address) {
              console.error("Connect wallet first");
              return;
            }

            const transaction = createTestTransaction(account.address);

            dappKit
              .signTransaction({
                transaction,
              })
              .then(async (signedTx) => {
                const verify = verifyTransactionSignature(
                  fromBase64(signedTx.bytes),
                  signedTx.signature,
                  {
                    client: currentClient,
                  },
                );
                console.log(verify);
              })
              .catch((error) => {
                console.error(error);
              });
          }}
        >
          Sign-only transaction
        </button>

        <button
          onClick={async () => {
            if (!account?.address) {
              console.error("Connect wallet first");
              return;
            }

            const transaction = createTestTransaction(account.address);

            dappKit
              .signAndExecuteTransaction({
                transaction,
              })
              .then(async (signature) => {
                console.log(signature);
              })
              .catch((error) => {
                console.error(error);
              });
          }}
        >
          Sign and execute test transactions
        </button>
      </Flex>
  );
}
