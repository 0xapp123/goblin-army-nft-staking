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
  ...props
}) {
  const [width, setWidth] = useState(0);
  const [lock, setLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const ref = useRef(null);

  const updateLotteryPoolState = (addr) => {
    getLotteryState(addr).then(result => {
      if (result !== null) {
        setLotteryState({
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

  const onStakeToLottery = (tokenAddress) => {
    stakeToLottery(wallet, tokenAddress).then(() => {
      updateLotteryPoolState(wallet.publicKey)
    });
  }
  const onWithdrawFromLottery = (tokenAddress) => {
    withdrawFromLottery(wallet, tokenAddress).then(() => {
      updateLotteryPoolState(wallet.publicKey)
    });
  }
  const onStakeToFixed = (tokenAddress) => {
    setLoading(true)
    stakeToFixed(wallet, tokenAddress).then(() => {
      updateFixedPoolState(wallet.publicKey)
    });
    setLoading(false)
  }
  const onWithdrawFromFixed = (tokenAddress) => {
    withdrawFromFixed(wallet, tokenAddress).then(() => {
      updateFixedPoolState(wallet.publicKey)
    });
  }

  useEffect(() => {
    setWidth(ref.current.clientWidth);
  }, [])

  useEffect(() => {
    const now = new Date();
    const stakedT = new Date(stakedTime + 1000 * 60 * 10)
    if (stakedT > now) {
      setLock(true)
    }
  }, [stakedTime])
  return (
    <div className="nft-card" ref={ref}>
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
        <button className="unstake-button" onClick={() => onWithdrawFromLottery(tokenAddress)} disabled={loading}>
          {!loading ?
            <span>unstake</span>
            :
            <ClipLoader color="#fff" size={20} />
          }
        </button>
      }
      {state === 2 &&
        <button className="unstake-button" onClick={() => onWithdrawFromFixed(tokenAddress)} disabled={loading}>
          {!loading ?
            <span>unstake</span>
            :
            <ClipLoader color="#fff" size={20} />
          }
        </button>
      }
      {state === 0 &&
        <>
          <button className="fixed-stake-button" onClick={() => onStakeToFixed(tokenAddress)} disabled={lock}>
            {!loading ?
              <span>staked to fixed</span>
              :
              <ClipLoader color="#fff" size={20} />
            }
          </button>
          <button className="lottery-stake-button" onClick={() => onStakeToLottery(tokenAddress)} disabled={lock}>
            {!loading ?
              <span>staked to lottery</span>
              :
              <ClipLoader color="#fff" size={20} />
            }
          </button>
        </>
      }
    </div>
  )
}