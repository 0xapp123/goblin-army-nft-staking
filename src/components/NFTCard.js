import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@mui/material";
import {
  initProject,
  stakeToLottery,
  withdrawFromLottery,
  stakeToFixed,
  withdrawFromFixed,
  getLotteryState,
  getFixedState,
  getGlobalState
} from '../contexts/helpers';
import { useWallet } from "@solana/wallet-adapter-react";

export default function NFTCard({
  image,
  state,
  name,
  data,
  stakedTime,
  tokenAddress,
  ...props
}) {
  const [width, setWidth] = useState(0);
  const [lotteryState, setLotteryState] = useState({ itemCount: 0, items: [] });
  const [fixedState, setFixedState] = useState({ itemCount: 0, items: [] });
  const [globalState, setGlobalState] = useState({ lotteryNftCount: 0, fixedNftCount: 0 });

  const [lock, setLock] = useState(false)

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

  const onInitClick = () => {
    initProject(wallet).then(() => {
      updateLotteryPoolState(wallet.publicKey);
      updateFixedPoolState(wallet.publicKey);
    });
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
  })

  useEffect(() => {
    const now = new Date();
    const stakedT = new Date(stakedTime + 3600 * 24 * 15 * 1000)
    if (stakedT > now) {
      setLock(true)
    }
  }, [])
  return (
    <div className="nft-card" ref={ref}>
      {image === undefined &&
        <Skeleton style={{ width: width - 20, height: width - 20, borderRadius: 5, backgroundColor: "#0000003b" }} variant="retangle" />
      }
      <img
        src={image}
        alt=""
      />
      <p>{name}</p>
      {state === 0 &&
        <button className="unstake-button" onClick={() => onWithdrawFromLottery(tokenAddress)} disabled={lock}>
          unstake
        </button>
      }
      {state === 1 &&
        <button className="unstake-button" onClick={() => onWithdrawFromFixed(tokenAddress)} disabled={lock}>
          unstake
        </button>
      }
      {state === 2 &&
        <>
          <button className="fixed-stake-button" onClick={() => onStakeToFixed(tokenAddress)}>
            staked to fixed
          </button>
          <button className="lottery-stake-button" onClick={() => onStakeToLottery(tokenAddress)}>
            staked to lottery
          </button>
        </>
      }
    </div>
  )
}