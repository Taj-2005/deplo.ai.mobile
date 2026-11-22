import * as Network from "expo-network";

export interface ConnectivityState {
  connected: boolean;
  internetReachable: boolean | null;
  type: string;
}

export async function getConnectivity(): Promise<ConnectivityState> {
  const state = await Network.getNetworkStateAsync();
  return {
    connected: state.isConnected ?? false,
    internetReachable: state.isInternetReachable ?? null,
    type: state.type ?? "unknown",
  };
}
