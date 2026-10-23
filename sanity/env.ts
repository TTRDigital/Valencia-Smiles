/**
 * Valencia Smile Expert Sanity project. The project ID is public (it is in
 * every image URL); set it here or with NEXT_PUBLIC_SANITY_PROJECT_ID.
 * Until it is set, the site builds from the built-in content in lib/data.
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2025-02-19";
