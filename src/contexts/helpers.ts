
import { web3 } from '@project-serum/anchor';
import {
  AccountInfo,
  // Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  // TransactionInstruction,
  // sendAndConfirmTransaction
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import * as borsh from 'borsh';
// import bs58 from 'bs58';
import * as anchor from '@project-serum/anchor';
import { showToast } from './utils';
// import BN from 'bn.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { IDL } from './anchor_idl/idl/staking_program';
import { programs } from '@metaplex/js';

export const solConnection = new web3.Connection(web3.clusterApiUrl("devnet"));

const ASSOCIATED_TOKEN_PROGRAM_ID: PublicKey = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);
const PROGRAM_ID = "Efc3pnJFJheyRLAwMZjcTwjRVBBJbqzbCg2PMfJkwHKF";
let superAdminPk = new PublicKey("9brnTDz1ydG927NMH78xmUkneznJwkuSvxDHb1qjuny3");
const GLOBAL_AUTHORITY_SEED = "global-authority";
const POOL_WALLET_SEED = "pool-wallet";
const POOL_SIZE = 2056;
const GLOBAL_POOL_SIZE = 360_016;

export const getNftMetaData = async (nftMintPk: PublicKey) => {
  let { metadata: { Metadata } } = programs;
  let metadataAccount = await Metadata.getPDA(nftMintPk);
  const metadat = await Metadata.load(solConnection, metadataAccount);
  return metadat;
}

export const initProject = async (
  wallet: WalletContextState
) => {
  if (!wallet.publicKey) return;
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  const [poolWalletKey, walletBump] = await PublicKey.findProgramAddress(
    [Buffer.from(POOL_WALLET_SEED)],
    program.programId
  );


  let globalLotteryPoolKey = await PublicKey.createWithSeed(
    wallet.publicKey,
    "global-lottery-pool",
    program.programId,
  );
  let ix = SystemProgram.createAccountWithSeed({
    fromPubkey: wallet.publicKey,
    basePubkey: wallet.publicKey,
    seed: "global-lottery-pool",
    newAccountPubkey: globalLotteryPoolKey,
    lamports: await provider.connection.getMinimumBalanceForRentExemption(GLOBAL_POOL_SIZE),
    space: GLOBAL_POOL_SIZE,
    programId: program.programId,
  });

  const tx = await program.rpc.initialize(
    bump, walletBump, {
    accounts: {
      admin: wallet.publicKey,
      globalAuthority,
      globalLotteryPool: globalLotteryPoolKey,
      poolWallet: poolWalletKey,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    },
    instructions: [ix],
    signers: []
  }
  );
  await solConnection.confirmTransaction(tx, "confirmed");

  showToast("Success. txHash=" + tx, 0);
  return false;
}

export const getLotteryState = async (
  userAddress: PublicKey
): Promise<Object | null> => {
  if (!userAddress) return null;
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  let userLotteryPoolKey = await PublicKey.createWithSeed(
    userAddress,
    "user-lottery-pool",
    program.programId,
  );

  // const [poolWalletKey, walletBump] = await PublicKey.findProgramAddress(
  //   [Buffer.from(POOL_WALLET_SEED)],
  //   program.programId
  // );

  //try {
  let lotteryPoolState = await program.account.userPool.fetch(userLotteryPoolKey);
  return lotteryPoolState;
  //} catch {
  //  console.log("catch error");
  //  return null;
  //}
}

export const getFixedState = async (
  userAddress: PublicKey
): Promise<Object | null> => {
  if (!userAddress) return null;
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  let userFixedPoolKey = await PublicKey.createWithSeed(
    userAddress,
    "user-fixed-pool",
    program.programId,
  );
  try {
    let fixedPoolState = await program.account.userPool.fetch(userFixedPoolKey);
    return fixedPoolState;
  } catch {
    return null;
  }
}

export const getGlobalState = async (
): Promise<Object | null> => {
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);
  const [globalAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  // let globalLotteryPoolKey = await PublicKey.createWithSeed(
  //   superAdminPk,
  //   "global-lottery-pool",
  //   program.programId,
  // );
  try {
    let globalState = await program.account.globalPool.fetch(globalAuthority);
    // let globalLotteryPool = await program.account.globalLotteryPool.fetch(globalLotteryPoolKey);
    return globalState;
  } catch {
    return null;
  }
}

export const getLotteryPool = async (
): Promise<Object | null> => {
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  let globalLotteryPoolKey = await PublicKey.createWithSeed(
    superAdminPk,
    "global-lottery-pool",
    program.programId,
  );
  try {
    let globalLotteryPool = await program.account.globalLotteryPool.fetch(globalLotteryPoolKey);
    return globalLotteryPool;
  } catch {
    return null;
  }
}

export const stakeToLottery = async (
  wallet: WalletContextState,
  mint: string
) => {
  if (!wallet.publicKey || mint === "") return;

  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  const nft_mint = new PublicKey(mint);
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  let userLotteryPoolKey = await PublicKey.createWithSeed(
    wallet.publicKey,
    "user-lottery-pool",
    program.programId,
  );

  let tx = new Transaction();

  let lotteryAccount = await solConnection.getAccountInfo(userLotteryPoolKey);
  if (lotteryAccount === null || lotteryAccount.data === null) {
    tx.add(SystemProgram.createAccountWithSeed({
      fromPubkey: wallet.publicKey,
      basePubkey: wallet.publicKey,
      seed: "user-lottery-pool",
      newAccountPubkey: userLotteryPoolKey,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(POOL_SIZE),
      space: POOL_SIZE,
      programId: program.programId,
    }));
    tx.add(program.instruction.initializeLotteryPool(
      {
        accounts: {
          userLotteryPool: userLotteryPoolKey,
          owner: wallet.publicKey
        }
      }
    ))
  }

  const [staked_nft_address, nft_bump] = await PublicKey.findProgramAddress(
    [Buffer.from("staked-nft"), nft_mint.toBuffer()],
    program.programId
  );
  let globalLotteryPoolKey = await PublicKey.createWithSeed(
    superAdminPk,
    "global-lottery-pool",
    program.programId,
  );
  let userTokenAccount = await getNFTTokenAccount(nft_mint);

  tx.add(program.instruction.stakeNftToLottery(
    bump, nft_bump, {
    accounts: {
      owner: wallet.publicKey,
      userLotteryPool: userLotteryPoolKey,
      globalLotteryPool: globalLotteryPoolKey,
      globalAuthority,
      userNftTokenAccount: userTokenAccount,
      destNftTokenAccount: staked_nft_address,
      nftMint: nft_mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    }
  }
  ));
  let txHash = await wallet.sendTransaction(tx, solConnection);
  await solConnection.confirmTransaction(txHash, "confirmed");
  await new Promise((resolve, reject) => {
    solConnection.onAccountChange(userTokenAccount, (data: AccountInfo<Buffer> | null) => {
      if (!data) reject();
      resolve(true);
    });
  });
  showToast("Success. txHash=" + txHash, 0);
  return false;
}

export const withdrawFromLottery = async (
  wallet: WalletContextState,
  mint: string
) => {
  if (!wallet.publicKey || mint === "") return;
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  const nft_mint = new PublicKey(mint);
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  let userLotteryPoolKey = await PublicKey.createWithSeed(
    wallet.publicKey,
    "user-lottery-pool",
    program.programId,
  );

  let tx = new Transaction();
  const [staked_nft_address, nft_bump] = await PublicKey.findProgramAddress(
    [Buffer.from("staked-nft"), nft_mint.toBuffer()],
    program.programId
  );

  let globalLotteryPoolKey = await PublicKey.createWithSeed(
    superAdminPk,
    "global-lottery-pool",
    program.programId,
  );
  let globalLotteryPoolData: any = await program.account.globalLotteryPool.fetch(globalLotteryPoolKey);
  let nftIndex = 0;
  for (let i = 0; i < globalLotteryPoolData.itemCount.toNumber(); i++) {
    if (globalLotteryPoolData.lotteryItems[i].nftAddr.toBase58() === nft_mint.toBase58()) {
      nftIndex = i;
      break;
    }
  }

  let userTokenAccount = await getTokenAccount(nft_mint, wallet.publicKey);
  tx.add(program.instruction.withdrawNftFromLottery(
    bump, nft_bump, new anchor.BN(nftIndex), {
    accounts: {
      owner: wallet.publicKey,
      userLotteryPool: userLotteryPoolKey,
      globalLotteryPool: globalLotteryPoolKey,
      globalAuthority,
      userNftTokenAccount: userTokenAccount,
      stakedNftTokenAccount: staked_nft_address,
      nftMint: nft_mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    }
  }
  ));
  let txHash = await wallet.sendTransaction(tx, solConnection);
  await solConnection.confirmTransaction(txHash, "confirmed");
  await new Promise((resolve, reject) => {
    solConnection.onAccountChange(userTokenAccount, (data: AccountInfo<Buffer> | null) => {
      if (!data) reject();
      resolve(true);
    });
  });
  showToast("Success. txHash=" + txHash, 0);
  return false;
}


export const stakeToFixed = async (
  wallet: WalletContextState,
  mint: string
) => {
  if (!wallet.publicKey || mint === "") return;

  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  const nft_mint = new PublicKey(mint);
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  let userFixedPoolKey = await PublicKey.createWithSeed(
    wallet.publicKey,
    "user-fixed-pool",
    program.programId,
  );

  let tx = new Transaction();

  let fixedAccount = await solConnection.getAccountInfo(userFixedPoolKey);
  if (fixedAccount === null || fixedAccount.data === null) {
    tx.add(SystemProgram.createAccountWithSeed({
      fromPubkey: wallet.publicKey,
      basePubkey: wallet.publicKey,
      seed: "user-fixed-pool",
      newAccountPubkey: userFixedPoolKey,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(POOL_SIZE),
      space: POOL_SIZE,
      programId: program.programId,
    }));
    tx.add(program.instruction.initializeFixedPool(
      {
        accounts: {
          userFixedPool: userFixedPoolKey,
          owner: wallet.publicKey
        }
      }
    ))
  }

  const [staked_nft_address, nft_bump] = await PublicKey.findProgramAddress(
    [Buffer.from("staked-nft"), nft_mint.toBuffer()],
    program.programId
  );

  let userTokenAccount = await getNFTTokenAccount(nft_mint);
  tx.add(program.instruction.stakeNftToFixed(
    bump, nft_bump, {
    accounts: {
      owner: wallet.publicKey,
      userFixedPool: userFixedPoolKey,
      globalAuthority,
      userNftTokenAccount: userTokenAccount,
      destNftTokenAccount: staked_nft_address,
      nftMint: nft_mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    }
  }
  ));
  let txHash = await wallet.sendTransaction(tx, solConnection);
  await solConnection.confirmTransaction(txHash, "confirmed");
  await new Promise((resolve, reject) => {
    solConnection.onAccountChange(userTokenAccount, (data: AccountInfo<Buffer> | null) => {
      if (!data) reject();
      resolve(true);
    });
  });
  showToast("Success. txHash=" + txHash, 0);
  return false;
}

export const withdrawFromFixed = async (
  wallet: WalletContextState,
  mint: string
) => {
  if (!wallet.publicKey || mint === "") return;
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  const nft_mint = new PublicKey(mint);
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  const [poolWalletKey, walletBump] = await PublicKey.findProgramAddress(
    [Buffer.from(POOL_WALLET_SEED)],
    program.programId
  );
  let userFixedPoolKey = await PublicKey.createWithSeed(
    wallet.publicKey,
    "user-fixed-pool",
    program.programId,
  );

  // let tx = new Transaction();
  const [staked_nft_address, nft_bump] = await PublicKey.findProgramAddress(
    [Buffer.from("staked-nft"), nft_mint.toBuffer()],
    program.programId
  );

  let userTokenAccount = await getTokenAccount(nft_mint, wallet.publicKey);
  let txHash = await program.rpc.withdrawNftFromFixed(
    bump, nft_bump, walletBump, {
    accounts: {
      owner: wallet.publicKey,
      userFixedPool: userFixedPoolKey,
      globalAuthority,
      poolWallet: poolWalletKey,
      userNftTokenAccount: userTokenAccount,
      stakedNftTokenAccount: staked_nft_address,
      nftMint: nft_mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    }
  }
  );
  await solConnection.confirmTransaction(txHash, "confirmed");
  await new Promise((resolve, reject) => {
    solConnection.onAccountChange(userTokenAccount, (data: AccountInfo<Buffer> | null) => {
      if (!data) reject();
      resolve(true);
    });
  });
  showToast("Success. txHash=" + txHash, 0);
  return false;
}

export const claimReward = async (
  wallet: WalletContextState
) => {
  if (!wallet.publicKey) return;
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  const [poolWalletKey, walletBump] = await PublicKey.findProgramAddress(
    [Buffer.from(POOL_WALLET_SEED)],
    program.programId
  );
  console.log("poolWalletKey =", poolWalletKey.toBase58());
  let userFixedPoolKey = await PublicKey.createWithSeed(
    wallet.publicKey,
    "user-fixed-pool",
    program.programId,
  );

  // let tx = new Transaction();

  let txHash = await program.rpc.claimReward(
    bump, 0, walletBump, {
    accounts: {
      owner: wallet.publicKey,
      userFixedPool: userFixedPoolKey,
      globalAuthority,
      poolWallet: poolWalletKey,
      systemProgram: SystemProgram.programId,
    }
  }
  );
  await solConnection.confirmTransaction(txHash, "confirmed");
  await new Promise((resolve, reject) => {
    solConnection.onAccountChange(userFixedPoolKey, (data: AccountInfo<Buffer> | null) => {
      if (!data) reject();
      resolve(true);
    });
  });
  showToast("Success. txHash=" + txHash, 0);
  return false;
}

// const getOwnerOfNFT = async (nftMintPk: PublicKey): Promise<PublicKey> => {
//   let tokenAccountPK = await getNFTTokenAccount(nftMintPk);
//   let tokenAccountInfo = await solConnection.getAccountInfo(tokenAccountPK);

//   if (tokenAccountInfo && tokenAccountInfo.data) {
//     let ownerPubkey = new PublicKey(tokenAccountInfo.data.slice(32, 64))
//     return ownerPubkey;
//   }
//   return new PublicKey("");
// }

const getTokenAccount = async (mintPk: PublicKey, userPk: PublicKey): Promise<PublicKey> => {
  let tokenAccount = await solConnection.getProgramAccounts(
    TOKEN_PROGRAM_ID,
    {
      filters: [
        {
          dataSize: 165
        },
        {
          memcmp: {
            offset: 0,
            bytes: mintPk.toBase58()
          }
        },
        {
          memcmp: {
            offset: 32,
            bytes: userPk.toBase58()
          }
        },
      ]
    }
  );
  return tokenAccount[0].pubkey;
}

const getNFTTokenAccount = async (nftMintPk: PublicKey): Promise<PublicKey> => {
  let tokenAccount = await solConnection.getProgramAccounts(
    TOKEN_PROGRAM_ID,
    {
      filters: [
        {
          dataSize: 165
        },
        {
          memcmp: {
            offset: 64,
            bytes: '2'
          }
        },
        {
          memcmp: {
            offset: 0,
            bytes: nftMintPk.toBase58()
          }
        },
      ]
    }
  );
  return tokenAccount[0].pubkey;
}


// const getAssociatedTokenAccount = async (ownerPubkey: PublicKey, mintPk: PublicKey): Promise<PublicKey> => {
//   let associatedTokenAccountPubkey = (await PublicKey.findProgramAddress(
//     [
//       ownerPubkey.toBuffer(),
//       TOKEN_PROGRAM_ID.toBuffer(),
//       mintPk.toBuffer(), // mint address
//     ],
//     ASSOCIATED_TOKEN_PROGRAM_ID
//   ))[0];
//   return associatedTokenAccountPubkey;
// }
// const createReceiveTokenAccountIx = async (receiverPK: PublicKey, mintPk: PublicKey) => {
//   const tempNFTTokenAccountKeypair = new Keypair();
//   const createTempTokenAccountIx = SystemProgram.createAccount({
//     programId: TOKEN_PROGRAM_ID,
//     space: AccountLayout.span,
//     lamports: await solConnection.getMinimumBalanceForRentExemption(
//       AccountLayout.span
//     ),
//     fromPubkey: receiverPK,
//     newAccountPubkey: tempNFTTokenAccountKeypair.publicKey,
//   });
//   const initTempAccountIx = Token.createInitAccountInstruction(
//     TOKEN_PROGRAM_ID,
//     mintPk,
//     tempNFTTokenAccountKeypair.publicKey,
//     receiverPK
//   );
//   return {
//     tempNFTTokenAccountKeypair, createTempTokenAccountIx, initTempAccountIx
//   }
// }

