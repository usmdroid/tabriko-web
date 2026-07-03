import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {};

export default withSentryConfig(withNextIntl(nextConfig), {
  sourcemaps: { disable: true },
  silent: true,
  telemetry: false,
});
