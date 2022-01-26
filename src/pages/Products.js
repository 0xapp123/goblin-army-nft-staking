import { useState } from 'react';
import { useEffect } from 'react';
import Page from '../components/Page';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getLotteryState,
  getFixedState,
  getGlobalState,
  solConnection,
  getNftMetaData,
  claimReward
} from '../contexts/helpers';
import { getDateStr, getReward } from '../contexts/utils';
// import TotalView from '../components/TotalView'
import NFTCard from '../components/NFTCard';
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";
import { PublicKey } from '@solana/web3.js';
import SkeletonCard from '../components/SkeletonCard';

export default function Product() {
  const [lotteryState, setLotteryState] = useState({ itemCount: 0, items: [] });
  const [fixedState, setFixedState] = useState({ itemCount: 0, items: [] });
  const [globalState, setGlobalState] = useState({ lotteryNftCount: 0, fixedNftCount: 0 });
  const wallet = useWallet();
  const [claimRewardValue, setClaimRewardValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [forseRender, setForseRender] = useState(false);

  const onClaimReward = () => {
    claimReward(wallet).then(() => {
      updateLotteryPoolState(wallet.publicKey)
    })
  }

  const [tab, setTab] = useState(true)
  const [unstakedNftList, setUnstakedNFTList] = useState([])
  const [lotteryNftList, setLotteryNftList] = useState([])
  const [fixedNftList, setFixedNftList] = useState([])

  const updateLotteryPoolState = (addr) => {
    getLotteryState(addr).then(result => {
      if (result !== null) {
        setLotteryState({
          itemCount: result.itemCount.toNumber(),
          items: result.items.slice(0, result.itemCount.toNumber())
        })
        // make new array include metadata from data
        setLotteryArray(result.items.slice(0, result.itemCount.toNumber()))
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })
  }

  const getClaimRewardValue = (rewardTime, items) => {
    let sum = 0;
    const setData = items.map((item) => {
      const val = getReward(Math.max(item.stakeTime, rewardTime));
      sum = sum + val;
      return sum
    })
    setClaimRewardValue(setData)
  }

  const updateFixedPoolState = (addr) => {
    getFixedState(addr).then(result => {
      if (result !== null) {
        console.log("fixedState ", result.items.slice(0, result.itemCount.toNumber()));
        // const list = result.items.slice(0, result.itemCount.toNumber());
        // const getList
        setFixedState({
          itemCount: result.itemCount.toNumber(),
          items: result.items.slice(0, result.itemCount.toNumber())
        })
        getClaimRewardValue(result.rewardTime.toNumber(), result.items.slice(0, result.itemCount.toNumber()))
        // make new array include metadata from data
        setFixedArray(result.items.slice(0, result.itemCount.toNumber()))
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })
  }

  const setNFTArray = (nfts) => {
    let nftDump = []
    nfts.map(async (item) => (
      await fetch(item.data.uri)
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
    setUnstakedNFTList(nftDump)
    setForseRender(!forseRender)
    setTab(tab)
    setLoading(false)
  }

  const setLotteryArray = async (data) => {
    let nftDump = []
    if (data !== undefined && data.length !== 0) {
      data.map(async (item) => {
        const nft = await getNFTs(item.nftAddr.toBase58());
        await fetch(nft.data.data.uri)
          .then(resp =>
            resp.json()
          ).then((json) => {
            nftDump.push({
              "name": json.name,
              "image": json.image,
              "mint": item.nftAddr.toBase58(),
              "stakedTime": getDateStr(item.stakeTime)
            })
          })
      }
      )
      setLotteryNftList(nftDump);
    }
  }

  const setFixedArray = async (data) => {
    let nftDump = []
    if (data !== undefined && data.length !== 0) {
      data.map(async (item) => {
        const nft = await getNFTs(item.nftAddr.toBase58());
        await fetch(nft.data.data.uri)
          .then(resp =>
            resp.json()
          ).then((json) => {
            nftDump.push({
              "name": json.name,
              "image": json.image,
              "mint": item.nftAddr.toBase58(),
              "stakedTime": getDateStr(item.stakeTime)
            })
          })
      }
      )
      setFixedNftList(nftDump);
    }
  }

  const getMetadataDetail = async () => {
    const nftsList = await getParsedNftAccountsByOwner({ publicAddress: wallet.publicKey, connection: solConnection });
    return nftsList;
  }

  // get nft metadata from mint address
  const getNFTs = async (nft_mint) => {
    const pubkey = new PublicKey(nft_mint)
    const metadata = await getNftMetaData(pubkey)
    return metadata;
  }

  useEffect(() => {
    // setLoading(true)
    async function fetchData() {
      if (wallet.publicKey !== null) {
        updateLotteryPoolState(wallet.publicKey);
        updateFixedPoolState(wallet.publicKey);
        const unstakedNftList = await getMetadataDetail()
        if (unstakedNftList.length !== 0) {
          setNFTArray(unstakedNftList)
        }
        setLotteryArray()
      }
    }
    fetchData();
    // eslint-disable-next-line
  }, [wallet]);

  return (
    <Page title="Goblin Army | Product, Stake, Unstake, and Claim">
      <div className="total-view">
        <div className="total-claim">
          <h2>Claim reward</h2>
          <div className="value-claim">
            {wallet.publicKey !== null ?
              <>
                <h1>{parseFloat(claimRewardValue).toFixed(2)}<span>SOL</span></h1>

                <button className="claim-button" onClick={() => onClaimReward()}>
                  Claim
                </button>
              </>
              :
              <>
                <h1 style={{ color: "#525252f2" }}>LOCKED</h1>
                <button className="claim-button" disabled={true}>
                  Claim
                </button>
              </>
            }
          </div>
        </div>
        <div className="staked-nfts-view">
          <div className="staked-nfts-view-item" style={{ borderBottom: "1px solid #0000005c" }}>
            <p className="title">Total staked in Lottery</p>
            {wallet.publicKey !== null ?
              <h5>{globalState.lotteryNftCount}&nbsp;<span>NFTs</span></h5>
              :
              <h5 style={{ color: "#525252f2" }}>LOCKED</h5>
            }
          </div>
          <div className="staked-nfts-view-item">
            <p className="title">Total staked in Fixed</p>
            {wallet.publicKey !== null ?
              <h5>{globalState.fixedNftCount}&nbsp;<span>NFTs</span></h5>
              :
              <h5 style={{ color: "#525252f2" }}>LOCKED</h5>
            }
          </div>
        </div>
      </div>
      {wallet.publicKey !== null &&
        <>
          {!loading &&
            <div className="nfts-tabs">
              <div className={tab ? "nfts-tab-item active" : "nfts-tab-item"} onClick={() => setTab(true)}>
                Stakend NFTs({lotteryState.itemCount + fixedState.itemCount})
              </div>
              <div className={!tab ? "nfts-tab-item active" : "nfts-tab-item"} onClick={() => setTab(false)}>
                Untakend NFTs({unstakedNftList.length})
              </div>
            </div>
          }
          {loading &&
            <div className="unstaked-nfts">
              <div className="cards-galley">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          }
          {!loading &&
            <>
              {tab === true &&
                <div className="staked-nfts">
                  <div className="lottery-pool">
                    <h2>Lottery Pool({lotteryState.itemCount})</h2>
                    <div className="cards-galley">
                      {
                        lotteryNftList.length !== 0 && lotteryNftList.map((item, id) => (
                          // <h6 key={id}>{getDateStr(item.stakeTime) + " >>> " + item.nftAddr.toBase58()}</h6>
                          <NFTCard
                            state={1}
                            name={item.name}
                            image={item.image}
                            tokenAddress={item.mint}
                            stakedTime={item.stakedTime}
                            setLotteryState={({ cnt, items }) => setLotteryState({ cnt, items })}
                            setFixedState={({ cnt, items }) => setFixedState({ cnt, items })}
                            setGlobalState={({ cnt, items }) => setGlobalState({ cnt, items })}
                            key={id}
                          />
                        ))
                      }
                    </div>
                  </div>
                  <div className="fixed-pool">
                    <h2>Fixed Pool({fixedState.itemCount})</h2>
                    <div className="cards-galley">
                      {
                        fixedNftList.length !== 0 && fixedNftList.map((item, id) => (
                          // <h6 key={id}>{getDateStr(item.stakeTime) + " >>> " + item.nftAddr.toBase58()}</h6>
                          <NFTCard
                            state={2}
                            name={item.name}
                            image={item.image}
                            tokenAddress={item.mint}
                            stakedTime={item.stakedTime}
                            setLotteryState={({ cnt, items }) => setLotteryState({ cnt, items })}
                            setFixedState={({ cnt, items }) => setFixedState({ cnt, items })}
                            setGlobalState={({ cnt, items }) => setGlobalState({ cnt, items })}
                            key={id}
                          />
                        ))
                      }
                      {/* {
                    fixedState.items.map((item, id) => (
                      // <h6 key={id}>{getDateStr(item.stakeTime) + "<<<  " + getReward(item.stakeTime) + "SOL  >>> " + item.nftAddr.toBase58()}</h6>
                      <NFTCard state={1} tokenAddress={item.nftAddr.toBase58()} key={id} />
                    ))
                  } */}
                    </div>
                  </div>
                </div>
              }
              {tab === false &&
                <div className="unstaked-nfts">
                  <div className="cards-galley">
                    {unstakedNftList.length !== 0 && unstakedNftList.map((item, key) => (
                      <NFTCard
                        state={0}
                        name={item.name}
                        image={item.image}
                        tokenAddress={item.mint}
                        setLotteryState={({ cnt, items }) => setLotteryState({ cnt, items })}
                        setFixedState={({ cnt, items }) => setFixedState({ cnt, items })}
                        setGlobalState={({ cnt, items }) => setGlobalState({ cnt, items })}
                        key={key}
                      />
                    ))
                    }
                  </div>
                </div>
              }
            </>
          }
        </>
      }

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
