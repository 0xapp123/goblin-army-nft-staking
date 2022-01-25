export default function TotalView({ claimReward, totalLottery, totalFixed }) {
  return (
    <div className="total-view">
      <div className="total-claim">
        <h2>Claim reward</h2>
        <div className="value-claim">
          <h1>{parseFloat(claimReward).toFixed(2)}<span>SOL</span></h1>
          <button className="claim-button">
            Claim
          </button>
        </div>
      </div>
      <div className="staked-nfts-view">
        <div className="staked-nfts-view-item" style={{ borderBottom: "1px solid #0000005c" }}>
          <p className="title">Total staked in Lottery</p>
          <h5>{totalLottery}&nbsp;<span>NFTs</span></h5>
        </div>
        <div className="staked-nfts-view-item">
          <p className="title">Total staked in Lottery</p>
          <h5>{totalFixed}&nbsp;<span>NFTs</span></h5>
        </div>
      </div>
    </div>
  )
}