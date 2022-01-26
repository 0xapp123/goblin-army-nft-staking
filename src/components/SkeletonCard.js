import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@mui/material";

export default function SkeletonCard() {
    const [width, setWidth] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        setWidth(ref.current.clientWidth);
    }, [])

    return (
        <div className="nft-card" ref={ref}>
            <Skeleton animation="wave" style={{ width: width - 20, height: width - 20, borderRadius: 5, backgroundColor: "#0000003b" }} variant="retangle" />
            <Skeleton animation="wave" width={"60%"} style={{ marginTop: 5, backgroundColor: "#0000003b" }}></Skeleton>
            <Skeleton width={100} height={50} style={{ marginLeft: "auto", marginRight: "auto", backgroundColor: "#0000003b" }}></Skeleton>
        </div >
    )
}