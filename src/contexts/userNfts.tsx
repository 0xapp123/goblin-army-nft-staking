import { useState, createContext, useEffect } from "react"
import { AccountInfo } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { solConnection } from "./helpers";
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
export const UserNFTContext = createContext({
    userNFTs: [] as string[],
    updated: false,
});
export const UserNFTContextProvider = (props: { children: any }) => {
    const wallet = useWallet();
    // eslint-disable-next-line
    const [userNFTs, setUserNFTs] = useState<string[]>([]);
    // eslint-disable-next-line
    const [updated, setUpdated] = useState<boolean>(false);
    useEffect(() => {
        const check = async () => {
            if (!wallet || !wallet.publicKey) {
                return;
            }
            let subscriptionId = solConnection.onAccountChange(wallet.publicKey, parseAccount, "confirmed");
            async function parseAccount(acc: AccountInfo<Buffer> | null) {
                if (acc) {
                    // if (!wallet || !wallet.publicKey) return;
                    // const data = await solConnection.getTokenAccountsByOwner(wallet.publicKey, {programId: TOKEN_PROGRAM_ID});
                    // console.log(data);
                    // setUpdated((value: boolean) => !value);
                } else {
                    console.log(acc);
                }
            }
            return () => {
                console.log(`--> R_Id: ${subscriptionId}`);
                solConnection.removeAccountChangeListener(subscriptionId);
            }
        }
        check()
    }, [wallet]);
    return (
        <UserNFTContext.Provider value={{ userNFTs, updated }}>
            {props.children}
        </UserNFTContext.Provider>
    )
}
