import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@mui/material";
import {
  stakeToLottery,
  withdrawFromLottery,
  stakeToFixed,
  withdrawFromFixed,
  getLotteryState,
  getFixedState,
  getGlobalState
} from '../contexts/helpers';
import { useWallet } from "@solana/wallet-adapter-react";
import ClipLoader from "react-spinners/ClipLoader";

export default function NFTCard({
  image,
  state,
  name,
  data,
  stakedTime,
  tokenAddress,
  setLotteryState,
  setFixedState,
  setGlobalState,
  setNFTArray,
  setNewNftArry,
  ...props
}) {
  const [width, setWidth] = useState(0);
  const [lock, setLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const ref = useRef(null);

  const updateLotteryPoolState = (addr) => {
    setLoading(true)
    getLotteryState(addr).then(async result => {
      if (result !== null) {
        const list = result.items.slice(0, result.itemCount.toNumber());
        const newList = await setNewNftArry(list)
        setLotteryState({
          itemCount: result.itemCount.toNumber(),
          items: newList
        })
        setNFTArray()
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })
    // setTimeout(() => {
    //   window.location.reload()
    // }, 9000);
  }
  const updateFixedPoolState = (addr) => {
    setLoading(true)
    getFixedState(addr).then(async result => {
      if (result !== null) {
        const list = result.items.slice(0, result.itemCount.toNumber());
        const newList = await setNewNftArry(list)
        setFixedState({
          itemCount: result.itemCount.toNumber(),
          items: newList
        })
        setNFTArray()
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })
    // setTimeout(() => {
    //   window.location.reload()
    // }, 9000);
  }

  const onStakeToLottery = (tokenAddress) => {
    setLoading(true)
    stakeToLottery(wallet, tokenAddress).then(() => {
      updateLotteryPoolState(wallet.publicKey)
      setLoading(false)
    }).catch(err => {
      console.log(err)
      setLoading(false)
    })
  }
  const onWithdrawFromLottery = (tokenAddress) => {
    setLoading(true)
    withdrawFromLottery(wallet, tokenAddress).then(() => {
      updateLotteryPoolState(wallet.publicKey)
      setLoading(false)
    }).catch(err => {
      console.log(err)
      setLoading(false)
    })
  }
  const onStakeToFixed = (tokenAddress) => {
    setLoading(true)
    stakeToFixed(wallet, tokenAddress).then(() => {
      updateFixedPoolState(wallet.publicKey)
      setLoading(false)
    }).catch(err => {
      console.log(err)
      setLoading(false)
    })
  }
  const onWithdrawFromFixed = (tokenAddress) => {
    setLoading(true)
    withdrawFromFixed(wallet, tokenAddress).then(() => {
      updateFixedPoolState(wallet.publicKey)
      setLoading(false)
    }).catch(err => {
      console.log(err)
      setLoading(false)
    })
  }

  useEffect(() => {
    setWidth(ref.current.clientWidth);
  }, [])

  useEffect(() => {
    const now = new Date();
    const stakedT = new Date(stakedTime * 1000 + 1000 * 60 * 10)
    if (stakedT > now) {
      setLock(true)
    }
  }, [stakedTime])
  return (
    <div className="nft-card" ref={ref}>
      {loading &&
        <div className="card-loading">
          <ClipLoader color="#3105bb" size={40} />
        </div>
      }
      {image === undefined &&
        <Skeleton style={{ width: width - 20, height: width - 20, borderRadius: 5, backgroundColor: "#0000003b" }} variant="retangle" />
      }
      <img
        src={image}
        style={{ width: width - 20, height: width - 20 }}
        alt=""
      />
      <p>{name}</p>
      {state === 1 &&
        <button className="unstake-button" onClick={() => onWithdrawFromLottery(tokenAddress)} disabled={lock}>
          <span>unstake</span>
          {/* {!loading ?
            :
            <ClipLoader color="#fff" size={20} />
          } */}
        </button>
      }
      {state === 2 &&
        <button className="unstake-button" onClick={() => onWithdrawFromFixed(tokenAddress)} disabled={lock}>
          <span>unstake</span>
          {/* {!loading ?
            :
            <ClipLoader color="#fff" size={20} />
          } */}
        </button>
      }
      {state === 0 &&
        <>
          <button className="fixed-stake-button" onClick={() => onStakeToFixed(tokenAddress)}>
            <span>staked to fixed</span>
            {/* {!loading ?
              :
              <ClipLoader color="#fff" size={20} />
            } */}
          </button>
          <button className="lottery-stake-button" onClick={() => onStakeToLottery(tokenAddress)}>
            <span>staked to lottery</span>
            {/* {!loading ?
              :
              <ClipLoader color="#fff" size={20} />
            } */}
          </button>
        </>
      }
    </div>
  )
}