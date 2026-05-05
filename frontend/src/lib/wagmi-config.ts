import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, bsc, polygon, arbitrum, base } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "OmniGenesis AI",
  projectId: "omnigenesis7e7e7e7e7e7e7e7e7",
  chains: [mainnet, bsc, polygon, arbitrum, base],
  ssr: true,
});

export const CHAIN_INFO: Record<number, { name: string; color: string; icon: string }> = {
  1:     { name: "Ethereum", color: "#627EEA", icon: "⟠" },
  56:    { name: "BSC",      color: "#F0B90B", icon: "⬡" },
  137:   { name: "Polygon",  color: "#8247E5", icon: "⬡" },
  42161: { name: "Arbitrum", color: "#28A0F0", icon: "⟡" },
  8453:  { name: "Base",     color: "#0052FF", icon: "🔵" },
  314:   { name: "PiNexus",  color: "#00C4B4", icon: "π" },
};
