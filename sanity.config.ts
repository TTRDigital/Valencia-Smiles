"use client";

/**
 * Sanity Studio, embedded at /cms. Navy and blue, grouped sidebar, singletons
 * that cannot be duplicated or deleted.
 */
import { buildLegacyTheme, defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schemaTypes, singletonTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";
import { StudioIcon } from "./sanity/StudioIcon";

const theme = buildLegacyTheme({
  "--black": "#0f2338",
  "--white": "#ffffff",
  "--gray": "#6b7280",
  "--gray-base": "#6b7280",
  "--component-bg": "#ffffff",
  "--component-text-color": "#0f2338",
  "--brand-primary": "#0f2338",
  "--default-button-color": "#6b7280",
  "--default-button-primary-color": "#0f2338",
  "--default-button-success-color": "#2f8f4e",
  "--default-button-warning-color": "#c58a1b",
  "--default-button-danger-color": "#c0392b",
  "--state-info-color": "#366797",
  "--state-success-color": "#2f8f4e",
  "--state-warning-color": "#c58a1b",
  "--state-danger-color": "#c0392b",
  "--main-navigation-color": "#0f2338",
  "--main-navigation-color--inverted": "#ffffff",
  "--focus-color": "#366797",
});

export default defineConfig({
  name: "valencia-smile-expert",
  title: "Valencia Smile Expert",
  basePath: "/cms",
  projectId,
  dataset,
  icon: StudioIcon,
  theme,
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  schema: {
    types: schemaTypes,
    // Singletons do not appear in the "Create new" menu.
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    // Singletons can be edited and published, but not duplicated or deleted.
    actions: (input, context) =>
      singletonTypes.has(context.schemaType) ? input.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action)) : input,
  },
});
