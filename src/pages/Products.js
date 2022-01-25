import { useState } from 'react';
import { useEffect } from 'react';
import { Stack, Grid } from '@mui/material';
import Page from '../components/Page';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getLotteryState,
  getFixedState,
  getGlobalState,
  solConnection
} from '../contexts/helpers';
import { getDateStr, getReward } from '../contexts/utils';
import TotalView from '../components/TotalView'
import NFTCard from '../components/NFTCard';
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";

export default function EcommerceShop() {
  const [lotteryState, setLotteryState] = useState({ itemCount: 0, items: [] });
  const [fixedState, setFixedState] = useState({ itemCount: 0, items: [] });
  const [globalState, setGlobalState] = useState({ lotteryNftCount: 0, fixedNftCount: 0 });
  const wallet = useWallet();
  const [claimReward, setClaimReward] = useState(0)

  // const { nfts } = useWalletNfts({
  //   publicAddress: "Fe4KejEc1pgo6MxjfRGYL1u5qMpYN7FMxPKYjbrdsFFE",
  //   // connection,
  // });

  const updateLotteryPoolState = (addr) => {
    console.log("updateLotteryPoolState");
    getLotteryState(addr).then(result => {
      if (result !== null) {
        setLotteryState({
          itemCount: result.itemCount.toNumber(),
          items: result.items.slice(0, result.itemCount.toNumber())
        })
        getClaimReward(result.items.slice(0, result.itemCount.toNumber()))
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })
  }

  const getClaimReward = (items) => {
    let sum = 0;
    items.map((item) => {
      sum = getReward(item.stakeTime);
    })
    setClaimReward(sum)
  }

  const updateFixedPoolState = (addr) => {
    getFixedState(addr).then(result => {
      if (result !== null) {
        setFixedState({
          itemCount: result.itemCount.toNumber(),
          items: result.items.slice(0, result.itemCount.toNumber())
        })
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })
  }

  const [tab, setTab] = useState("staked")
  const [nftList, setNFTList] = useState([])

  let nftDump = []
  const setNFTArray = (nfts) => {
    nfts.map((item) => (
      fetch(item.data.uri)
        .then(resp =>
          resp.json()
        ).then((json) => {
          // let nameTemp = json.name.slice(" #")
          // if (nameTemp[0] === "Goblin Army") {
          nftDump.push({
            "name": json.name,
            "image": json.image,
            "mint": item.mint
          })
          // }
        })
    ))
    setNFTList(nftDump)
  }
  // get nft metadata from mint address
  const getMetadataDetail = async () => {
    const nftsList = await getParsedNftAccountsByOwner({ publicAddress: wallet.publicKey, connection: solConnection });
    return nftsList;
  }

  useEffect(async () => {
    updateLotteryPoolState(wallet.publicKey);
    updateFixedPoolState(wallet.publicKey);
    if (wallet.publicKey !== null) {
      const nftList = await getMetadataDetail()
      if (nftList.length !== 0) {
        setNFTArray(nftList)
      }
    }

  }, [wallet])

  return (
    <Page title="Goblin Army | Product, Stake, Unstake, and Claim">
      <TotalView
        totalLottery={globalState.lotteryNftCount}
        totalFixed={globalState.fixedNftCount}
        claimReward={claimReward}
      />
      {wallet.publicKey !== null &&
        <>
          <div className="nfts-tabs">
            <div className={tab === "staked" ? "nfts-tab-item active" : "nfts-tab-item"} onClick={() => setTab("staked")}>
              Stakend NFTs({lotteryState.itemCount + fixedState.itemCount})
            </div>
            <div className={tab === "unstaked" ? "nfts-tab-item active" : "nfts-tab-item"} onClick={() => setTab("unstaked")}>
              Untakend NFTs({nftList.length})
            </div>
          </div>
          {tab === "staked" &&
            <div className="staked-nfts">
              <div className="lottery-pool">
                <h2>Lottery Pool({lotteryState.itemCount})</h2>
                <div className="cards-galley">
                  {
                    lotteryState.items.map((item, id) => (
                      // <h6 key={id}>{getDateStr(item.stakeTime) + " >>> " + item.nftAddr.toBase58()}</h6>
                      <NFTCard state={0} tokenAddress={item.nftAddr.toBase58()} key={id} />
                    ))
                  }
                </div>
              </div>
              <div className="fixed-pool">
                <h2>Fixed Pool({fixedState.itemCount})</h2>
                <div className="cards-galley">
                  {
                    fixedState.items.map((item, id) => (
                      // <h6 key={id}>{getDateStr(item.stakeTime) + "<<<  " + getReward(item.stakeTime) + "SOL  >>> " + item.nftAddr.toBase58()}</h6>
                      <NFTCard state={1} tokenAddress={item.nftAddr.toBase58()} key={id} />
                    ))
                  }
                </div>
              </div>
            </div>
          }
          {tab === "unstaked" &&
            <div className="unstaked-nfts">
              <div className="cards-galley">
                {nftList.length !== 0 && nftList.map((item, key) => (
                  <NFTCard
                    state={2}
                    name={item.name}
                    image={item.image}
                    tokenAddress={item.mint}
                    key={key}
                  />
                ))
                }
              </div>
            </div>
          }
        </>
      }
      {/* <button onClick={() => onInitClick()}>Init Project</button> */}
      {/* <Grid container spacing={2}>
        <Grid item xs={5}>
          <Stack direction="column" spacing={2}>
            <h5>My Staked NFTs in Lottery: {lotteryState.itemCount}</h5>
            {
              lotteryState.items.map((item, id) => (
                <h6 key={id}>{getDateStr(item.stakeTime) + " >>> " + item.nftAddr.toBase58()}</h6>
              ))
            }
          </Stack>
        </Grid>
        <Grid item xs={5}>
          <Stack direction="column" spacing={2}>
            <h5>My Staked NFTs in Fixed Pool: {fixedState.itemCount}</h5>
            {
              fixedState.items.map((item, id) => (
                <h6 key={id}>{getDateStr(item.stakeTime) + "<<<  " + getReward(item.stakeTime) + "SOL  >>> " + item.nftAddr.toBase58()}</h6>
              ))
            }
          </Stack>
        </Grid>
      </Grid> */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Page>
  );
}
