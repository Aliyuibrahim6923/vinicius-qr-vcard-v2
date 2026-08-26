import { afterEach, describe, expect, it } from "vitest";
import { siteOrigin } from "./site-url";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const originalDeploymentUrl = process.env.VERCEL_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  if (originalProductionUrl === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  else process.env.VERCEL_PROJECT_PRODUCTION_URL = originalProductionUrl;
  if (originalDeploymentUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = originalDeploymentUrl;
});

describe("siteOrigin", () => {
  it("uses the configured canonical URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cards.example.com/path";
    expect(siteOrigin()).toBe("https://cards.example.com");
  });

  it("falls back to Vercel's production hostname", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "cards.vercel.app";
    expect(siteOrigin()).toBe("https://cards.vercel.app");
  });
});
