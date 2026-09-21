"use client"

import { PlacementDetailProps } from "@/types/placement"
import PlacementDetail from "./placement/PlacementDetail"

export default function PlacementDetailWrapper(props: PlacementDetailProps) {
  return <PlacementDetail {...props} />
}
