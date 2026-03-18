import React from "react";
import ReactDOM from "react-dom/client";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./index.css";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
  capture_pageview: true,
  capture_pageleave: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) => {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("not signed in") || message.includes("auth")) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

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
