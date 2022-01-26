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
// import ClipLoader from "react-spinners/ClipLoader";

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
  setNewNftArry,
  ...props
}) {
  const [width, setWidth] = useState(0);
  const [lock, setLock] = useState(false);
  // const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const ref = useRef(null);

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
    setTimeout(() => {
      window.location.reload()
    }, 9000);
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
      }
    })
    getGlobalState().then(result => {
      setGlobalState({
        lotteryNftCount: result.lotteryNftCount.toNumber(),
        fixedNftCount: result.fixedNftCount.toNumber()
      })
    })
    setTimeout(() => {
      window.location.reload()
    }, 9000);
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
    stakeToFixed(wallet, tokenAddress).then(() => {
      updateFixedPoolState(wallet.publicKey)
    });
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
        <button className="unstake-button" onClick={() => onWithdrawFromLottery(tokenAddress)}>
          <span>unstake</span>
          {/* {!loading ?
            :
            <ClipLoader color="#fff" size={20} />
          } */}
        </button>
      }
      {state === 2 &&
        <button className="unstake-button" onClick={() => onWithdrawFromFixed(tokenAddress)}>
          <span>unstake</span>
          {/* {!loading ?
            :
            <ClipLoader color="#fff" size={20} />
          } */}
        </button>
      }
      {state === 0 &&
        <>
          <button className="fixed-stake-button" onClick={() => onStakeToFixed(tokenAddress)} disabled={lock}>
            <span>staked to fixed</span>
            {/* {!loading ?
              :
              <ClipLoader color="#fff" size={20} />
            } */}
          </button>
          <button className="lottery-stake-button" onClick={() => onStakeToLottery(tokenAddress)} disabled={lock}>
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