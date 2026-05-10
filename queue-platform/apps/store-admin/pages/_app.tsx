import type { AppProps } from "next/app";
import { StoreAdminPublicTokenProvider } from "../lib/StoreAdminPublicTokenContext";
import { EmployeeProvider } from "../lib/EmployeeContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <StoreAdminPublicTokenProvider>
      <EmployeeProvider>
        <Component {...pageProps} />
      </EmployeeProvider>
    </StoreAdminPublicTokenProvider>
  );
}
