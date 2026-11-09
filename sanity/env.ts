/**
 * Valencia Smile Expert Sanity project (ord9drh8, dataset production). The
 * project ID is public (it is in every image URL). Anything missing in Sanity
 * falls back to the built-in content in lib/data, so the site always builds.
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "ord9drh8";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2025-02-19";
