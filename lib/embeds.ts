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
    // Reserve the form's declared height (data-height) so the page does not jump when it loads.
    .replace(/<iframe\b[^>]*>/gi, (tag) => {
      const h = /\sdata-height="(\d+)"/.exec(tag)?.[1];
      return h ? tag.replace(/height:\s*100%/, `height:${h}px`) : tag;
    })
    .replace(/<iframe\b([^>]*?)\ssrc="(https:\/\/(?:api\.leadconnectorhq\.com|link\.msgsndr\.com)[^"]*)"/gi, '<iframe$1 data-src="$2" data-lc-embed=""')
    // The embed script briefly hides and then resizes the iframe; a box of the same height keeps
    // the rest of the page from jumping while it does.
    .replace(/<iframe\b[^>]*data-lc-embed[^>]*>[\s\S]*?<\/iframe>/gi, (frame) => {
      const h = /height:\s*(\d+)px/.exec(frame)?.[1];
      return h ? `<div class="vse-embed" style="min-height:${h}px">${frame}</div>` : frame;
    });
}
