import type { AppProps } from "next/app";
import { StoreAdminPublicTokenProvider } from "../lib/StoreAdminPublicTokenContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <StoreAdminPublicTokenProvider>
      <Component {...pageProps} />
    </StoreAdminPublicTokenProvider>
  );
}
