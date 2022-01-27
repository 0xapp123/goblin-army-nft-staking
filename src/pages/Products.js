import { useContext, useState } from 'react';
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
  claimReward,
  getLotteryPool
} from '../contexts/helpers';
import { getDateReal, getDateStr, getReward } from '../contexts/utils';
// import TotalView from '../components/TotalView'
import NFTCard from '../components/NFTCard';
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";
import SkeletonCard from '../components/SkeletonCard';
import { Collapse } from '@mui/material';
import { UserNFTContext } from '../contexts/userNfts';
import ClipLoader from "react-spinners/ClipLoader";

export default function Product() {
  const wallet = useWallet();
  const nfts = useContext(UserNFTContext);
  const [lotteryState, setLotteryState] = useState({ itemCount: 0, items: [] });
  const [fixedState, setFixedState] = useState({ itemCount: 0, items: [] });
  const [globalState, setGlobalState] = useState({ lotteryNftCount: 0, fixedNftCount: 0 });
  const [claimRewardValue, setClaimRewardValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [forseRender, setForseRender] = useState(false);
  const [tab, setTab] = useState(true)
  const [unstakedNftList, setUnstakedNFTList] = useState([])
  const [holdersOpen, setHolderOpen] = useState(false)
  const [lotteryHoders, setLotteryHolders] = useState([])
  const [claimLoading, setClaimLoading] = useState(false)

  const onClaimReward = () => {
    setClaimLoading(true)
    claimReward(wallet).then(() => {
      updateLotteryPoolState(wallet.publicKey)
      setClaimLoading(false)
    }).catch(err => {
      console.log(err)
      setClaimLoading(false)
    })
  }

  const getLotteryHolders = async () => {
    const data = await getLotteryPool()
    setLotteryHolders(data.lotteryItems)
    setForseRender(!forseRender)
  }
  const updateLotteryPoolState = (addr) => {
    getLotteryState(addr).then(async result => {
      if (result !== null) {
        const list = result.items.slice(0, result.itemCount.toNumber());
        const newList = await setNewNftArry(list)
        setLotteryState({
          itemCount: result.itemCount.toNumber(),
          items: newList
        })
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })
    setForseRender(!forseRender)
  }

  const getClaimRewardValue = (rewardTime, items) => {
    let sum = 0;
    items.map((item) => {
      const val = getReward(Math.max(item.stakeTime.toNumber(), rewardTime));
      sum = sum + val;
    })
    setClaimRewardValue(sum)
    setForseRender(!forseRender)
  }

  const setNewNftArry = async (list) => {
    let nftDump = [];
    list.map(async (item) => {
      const nft = await getNftMetaData(item.nftAddr);
      const uri = nft.data.data.uri;

      fetch(uri).then(resp =>
        resp.json()
      ).then((json) => {
        nftDump.push({
          "name": json.name,
          "image": json.image,
          "mint": item.nftAddr.toBase58(),
          "stakedTime": getDateStr(item.stakeTime)
        })
        setForseRender(!forseRender)
      })
    })
    return nftDump
  }

  const updateFixedPoolState = (addr) => {
    getFixedState(addr).then(async result => {
      if (result !== null) {
        const list = result.items.slice(0, result.itemCount.toNumber());
        const newList = await setNewNftArry(list)
        setFixedState({
          itemCount: result.itemCount.toNumber(),
          items: newList
        })
        getClaimRewardValue(result.rewardTime.toNumber(), result.items.slice(0, result.itemCount.toNumber()))
        setInterval(async () => {
          getClaimRewardValue(result.rewardTime.toNumber(), result.items.slice(0, result.itemCount.toNumber()))
        }, 1000);
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })

    setForseRender(!forseRender)
  }

  const setNFTArray = async () => {
    let nftDump = []
    const unstakedNftList = await getMetadataDetail()
    if (unstakedNftList.length !== 0) {
      unstakedNftList.map(async (item) => (
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
      setLoading(false)
    }
  }

  const getMetadataDetail = async () => {
    const nftsList = await getParsedNftAccountsByOwner({ publicAddress: wallet.publicKey, connection: solConnection });
    return nftsList;
  }

  async function fetchData() {
    if (wallet.publicKey !== null) {
      updateLotteryPoolState(wallet.publicKey);
      updateFixedPoolState(wallet.publicKey);
      setNFTArray()
      await getLotteryHolders()
      setLoading(false)
    }
    setForseRender(!forseRender)
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [wallet]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [nfts.updated]);

  useEffect(() => {
    if (wallet.publicKey !== null)
      updateLotteryPoolState(wallet.publicKey);
  }, [fixedState])

  return (
    <Page title="Goblin Army | Product, Stake, Unstake, and Claim">
      <div className="total-view">

        <div className="total-view-content">
          <div className="total-claim">
            <h2>Claim reward</h2>
            <div className="value-claim">
              {wallet.publicKey !== null ?
                <>
                  <h1>{parseFloat(claimRewardValue).toFixed(2)}<span>SOL</span></h1>

                  <button className="claim-button" onClick={() => onClaimReward()} disabled={claimLoading || (parseFloat(claimRewardValue) === 0)}>
                    {!claimLoading ?
                      <span>
                        Claim
                      </span>
                      :
                      <ClipLoader color="#fff" size={32} />
                    }
                  </button>
                </>
                :
                <>
                  <h1 style={{ color: "#525252f2" }}>LOCKED</h1>
                  <button className="claim-button" disabled={true}>
                    <span>
                      Claim
                    </span>
                  </button>
                </>
              }
            </div>
          </div>
          <div className="staked-nfts-view">
            <div className="staked-nfts-view-item" style={{ borderBottom: "1px solid #0000005c" }}>
              <p className="title">Total staked in Fixed</p>
              {wallet.publicKey !== null ?
                <h5>{globalState.fixedNftCount}&nbsp;<span>NFTs</span></h5>
                :
                <h5 style={{ color: "#525252f2" }}>LOCKED</h5>
              }
            </div>
            <div className="staked-nfts-view-item">
              <p className="title">Total staked in Lottery</p>
              {wallet.publicKey !== null ?
                <h5>{globalState.lotteryNftCount}&nbsp;<span>NFTs</span></h5>
                :
                <h5 style={{ color: "#525252f2" }}>LOCKED</h5>
              }
            </div>
          </div>
        </div>
        <div className="lottery-holders">
          <div className="holders-title" onClick={() => setHolderOpen(!holdersOpen)}>
            {!holdersOpen ?
              <>Show Holders of lottery pool</>
              :
              <>Hide Holders of lottery pool</>
            }
          </div>
          <Collapse in={holdersOpen}>
            <div className="lottery-holders-content">
              {/* {lotteryHoders} */}
              <p className="lottery-header">
                <span>MINT ADDRESS</span>
                <span>HOLDER</span>
                <span>STAKED TIME</span>
              </p>
              {lotteryHoders.length !== 0 && lotteryHoders.map((item, key) => (
                key < globalState.lotteryNftCount &&
                <p key={key} className="holder-item">
                  <a href={"https://solscan.io/token/" + item.nftAddr.toBase58() + "?cluster=devnet"} target="_blank" rel="noreferrer"><span className="mobile-label">MINT ADDRESS : </span>{item.nftAddr.toBase58().slice(0, 10) + "..." + item.nftAddr.toBase58().slice(34, 44)}</a>
                  <span className="holder-main-label"><span className="mobile-label">HOLDER : </span>{item.owner.toBase58().slice(0, 10) + "..." + item.owner.toBase58().slice(34, 44)}</span>
                  <span className="holder-main-label"><span className="mobile-label">STAKED TIME : </span>{getDateReal(item.stakeTime.toNumber())}</span>
                </p>
              ))}
            </div>
          </Collapse>
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
                      {/* {lotteryState.items.length === 0 &&
                        <>
                          <SkeletonCard />
                          <SkeletonCard />
                        </>
                      } */}
                      {
                        lotteryState.items.map((item, id) => (
                          <NFTCard
                            state={1}
                            name={item.name}
                            image={item.image}
                            tokenAddress={item.mint}
                            stakedTime={item.stakedTime}
                            setLotteryState={({ itemCount, items }) => setLotteryState({ itemCount, items })}
                            setFixedState={({ itemCount, items }) => setFixedState({ itemCount, items })}
                            setGlobalState={({ lotteryNftCount, fixedNftCount }) => setGlobalState({ lotteryNftCount, fixedNftCount })}
                            setNewNftArry={(list) => setNewNftArry(list)}
                            setNFTArray={() => setNFTArray()}
                            key={id}
                          />
                        ))
                      }
                    </div>
                  </div>
                  <div className="fixed-pool">
                    <h2>Fixed Pool({fixedState.itemCount})</h2>
                    <div className="cards-galley">
                      {/* {fixedState.items.length === 0 &&
                        <>
                          <SkeletonCard />
                          <SkeletonCard />
                        </>
                      } */}
                      {
                        fixedState.items.length !== 0 && fixedState.items.map((item, id) => (
                          // <h6 key={id}>{getDateStr(item.stakeTime) + " >>> " + item.nftAddr.toBase58()}</h6>
                          <NFTCard
                            state={2}
                            name={item.name}
                            image={item.image}
                            tokenAddress={item.mint}
                            stakedTime={item.stakedTime}
                            setLotteryState={({ itemCount, items }) => setLotteryState({ itemCount, items })}
                            setFixedState={({ itemCount, items }) => setFixedState({ itemCount, items })}
                            setGlobalState={({ lotteryNftCount, fixedNftCount }) => setGlobalState({ lotteryNftCount, fixedNftCount })}
                            setNewNftArry={(list) => setNewNftArry(list)}
                            setNFTArray={() => setNFTArray()}
                            key={id}
                          />
                        ))
                      }
                    </div>
                  </div>
                </div>
              }
              {tab === false &&
                <div className="unstaked-nfts">
                  <div className="cards-galley">
                    {/* {unstakedNftList.length === 0 &&
                      <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                      </>
                    } */}
                    {unstakedNftList.length !== 0 && unstakedNftList.map((item, key) => (
                      <NFTCard
                        state={0}
                        name={item.name}
                        image={item.image}
                        tokenAddress={item.mint}
                        setLotteryState={({ itemCount, items }) => setLotteryState({ itemCount, items })}
                        setFixedState={({ itemCount, items }) => setFixedState({ itemCount, items })}
                        setGlobalState={({ lotteryNftCount, fixedNftCount }) => setGlobalState({ lotteryNftCount, fixedNftCount })}
                        setNewNftArry={(list) => setNewNftArry(list)}
                        setNFTArray={() => setNFTArray()}
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
