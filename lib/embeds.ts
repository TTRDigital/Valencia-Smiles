/**
 * GoHighLevel (LeadConnector) form and calendar embeds, as on the live site.
 *
 * The iframe's address moves to data-src so it loads only when needed:
 * pop-up forms when the pop-up opens, page embeds when they come near the
 * screen (public/js/site.js). Inline <script> tags do not run from markup
 * React inserts, so they are removed; site.js loads LeadConnector's
 * form_embed.js (which sizes the iframe) the first time an embed loads.
 */
export function iframeHtml(markup: string): string {
  return markup
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b([^>]*?)\ssrc="(https:\/\/(?:api\.leadconnectorhq\.com|link\.msgsndr\.com)[^"]*)"/gi, '<iframe$1 data-src="$2" data-lc-embed=""');
}
