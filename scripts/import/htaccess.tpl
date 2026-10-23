# Valencia Smile Expert: static Next.js export on SiteGround (Apache).
# Does what WordPress and a Node server did: canonical host, old WordPress
# addresses, trailing slashes, security headers, caching, compression, 404s.
# Generated from the live WordPress site's data (Oct 23, 2026); to change a
# redirect, edit its line (keep redirects above the trailing-slash rule).

Options -Indexes
DirectoryIndex index.html index.php
# The trailing slash is added by a rewrite below (on https), not by Apache.
DirectorySlash Off
ErrorDocument 404 /404.html
AddDefaultCharset UTF-8

<IfModule mod_rewrite.c>
  RewriteEngine On

  # One address: https://www.valenciasmileexpert.com (as on the live site).
  # The bare domain, the SiteGround temporary address (*.sg-host.com) and http all go there.
  # (also turn on "HTTPS Enforce" in SiteGround Site Tools > Security > SSL Manager)
  # A staging copy (STAGING_HOST below, e.g. staging.valenciasmileexpert.com) is left on its own address.
  RewriteCond %{HTTP_HOST} !^www\.valenciasmileexpert\.com$ [NC]
  RewriteCond %{HTTP_HOST} !^staging\d*\.valenciasmileexpert\.com$ [NC]
  RewriteCond %{HTTP_HOST} !^(localhost|127\.0\.0\.1)(:\d+)?$ [NC]
  RewriteRule ^(.*)$ https://www.valenciasmileexpert.com/$1 [R=301,L]
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https [NC]
  RewriteCond %{HTTP_HOST} !^(localhost|127\.0\.0\.1)(:\d+)?$ [NC]
  RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

  # ---- Old WordPress addresses (keep above the slash rule) ----
  # WordPress's own old-address redirect, kept.
  RewriteRule ^dental-implants/?$ https://%{HTTP_HOST}/services/dental-implants/ [R=301,L,NC]
  # Author archives: Dr. Moezzi's to the About page, the two staff accounts' (no posts) to the blog.
  RewriteRule ^author/nedamoezzi(?:/page/\d+)?/?$ https://%{HTTP_HOST}/about/ [R=301,L,NC]
  RewriteRule ^author/[^/]+(?:/page/\d+)?/?$ https://%{HTTP_HOST}/category/blogs/ [R=301,L,NC]
  # Blog pages past the last one, and /index.php.
  RewriteRule ^index\.php$ https://%{HTTP_HOST}/ [R=301,L,NC]

  # ?page_id= / ?p= short links: 301 to the page or post, query dropped.
{{ID_RULES}}

  # Old uploaded images (any WordPress size, e.g. -300x200) to the same file on this site.
  RewriteCond %{DOCUMENT_ROOT}/images/uploads/$1.$2 -f
  RewriteRule ^wp-content/uploads/(.+?)(?:-\d+x\d+)?\.(png|jpe?g|webp|gif|svg)$ https://%{HTTP_HOST}/images/uploads/$1.$2 [R=301,L,NC]

  # WordPress sitemaps.
  RewriteRule ^(?:sitemap_index|wp-sitemap|[a-z_-]+-sitemap\d*|wp-sitemap-[a-z0-9_-]+)\.xml$ https://%{HTTP_HOST}/sitemap.xml [R=301,L,NC]
  RewriteCond %{QUERY_STRING} (?:^|&)sitemap= [NC]
  RewriteRule ^(?:index\.php)?$ https://%{HTTP_HOST}/sitemap.xml [R=301,L,QSD]

  # WordPress-only addresses that no longer exist: 410 Gone, so search engines drop them.
  RewriteRule ^(?:wp-admin|wp-includes|wp-json|wp-content)(?:/|$) - [G,L,NC]
  RewriteRule ^(?:wp-login|xmlrpc|wp-cron|wp-signup|wp-trackback|wp-comments-post|wp-links-opml)\.php$ - [G,L,NC]
  RewriteRule ^(?:.+/)?(?:feed|trackback|embed)(?:/(?:rss2?|atom|rdf))?/?$ - [G,L,NC]
  RewriteRule ^comments/ - [G,L,NC]
  RewriteCond %{QUERY_STRING} (?:^|&)(?:rest_route|feed|attachment_id|replytocom)= [NC]
  RewriteRule ^(?:index\.php)?$ - [G,L]
  # ---- end of old WordPress addresses ----

  # Pages live at /page/ (page/index.html): add the missing slash, on https
  # (absolute, so visitors behind SiteGround's proxy are not bounced through http).
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^(.*[^/])$ https://%{HTTP_HOST}/$1/ [R=301,L]

  # The Sanity Studio is one page; its inner URLs (/cms/structure/...) load it.
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^cms/. /cms/index.html [L]
</IfModule>

# The upload tool's file list is never served.
<FilesMatch "^\.ftp-deploy-sync-state\.json$">
  Require all denied
</FilesMatch>

<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
  # A staging copy is never indexed.
  <If "%{HTTP_HOST} =~ /^staging\d*\./i">
    Header always set X-Robots-Tag "noindex, nofollow"
  </If>

  # Content security policy: only what the pages load. Third parties: Google Tag Manager and
  # Analytics, the Google Ads tag the live GTM container fires (AW-339190937: google.com,
  # doubleclick.net, googleadservices.com), Ahrefs Web Analytics, the GoHighLevel (LeadConnector)
  # form and calendar embeds, Google Maps embeds, Sanity images. Tags added in GTM that load
  # other scripts need their domains added here.
  # The studio at /cms talks to many Sanity hosts and is protected by Sanity login instead.
  <If "%{REQUEST_URI} !~ m#^/cms(/|$)#">
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://www.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://analytics.ahrefs.com https://link.msgsndr.com https://*.leadconnectorhq.com https://*.msgsndr.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://google.com https://*.doubleclick.net https://www.googleadservices.com https://analytics.ahrefs.com https://*.leadconnectorhq.com https://*.msgsndr.com https://cdn.sanity.io; frame-src 'self' https://www.googletagmanager.com https://*.doubleclick.net https://maps.google.com https://www.google.com https://api.leadconnectorhq.com https://*.leadconnectorhq.com https://*.msgsndr.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests"
  </If>

  # Caching: versioned files (?v=) and fonts for a year, photos for a month, pages always fresh.
  <FilesMatch "\.(js|css|woff2?)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(webp|avif|jpe?g|png|gif|svg|ico)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
  <FilesMatch "\.(html|txt|xml)$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_mime.c>
  AddType image/webp .webp
  AddType font/woff2 .woff2
  AddType text/javascript .js
</IfModule>

# Compress text files. Apache serves .js as text/javascript, so both JavaScript types are listed.
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json application/manifest+json image/svg+xml text/xml application/xml text/plain
</IfModule>
