import React from "react";
import ReactDOM from "react-dom/client";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/queryClient";
import "./index.css";

const posthogKey =
  import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN ??
  import.meta.env.VITE_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
    capture_pageview: true,
    capture_pageleave: true,
  });
} else if (import.meta.env.DEV) {
  console.warn("[analytics] PostHog disabled: missing VITE_PUBLIC_POSTHOG_TOKEN/KEY");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <ErrorBoundary variant="page">
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>,
);
