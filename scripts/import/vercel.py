"""Writes vercel.json from public/.htaccess, so Vercel does what Apache does on SiteGround.

usage: python3 scripts/import/vercel.py   (from the repository root; rerun after changing .htaccess)

Same canonical host, old WordPress addresses (301), 410 Gone for WordPress-only addresses, trailing
slashes, security headers (the same content security policy) and caching. Vercel serves the static
export in out/ (built by `npm run build`, post-build step included) and compresses files itself.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HT = open(os.path.join(ROOT, 'public/.htaccess')).read()
HOST = 'https://www.valenciasmileexpert.com'


def moved(src, to, **cond):
    """301 to `to`; the query string is dropped, as Apache's QSD did."""
    r = {'src': src, 'status': 301, 'headers': {'Location': to}}
    r.update(cond)
    return r


def gone(src, **cond):
    r = {'src': src, 'status': 410, 'dest': '/404.html'}
    r.update(cond)
    return r


def query(key, value=None):
    return {'type': 'query', 'key': key, **({'value': value} if value is not None else {})}


ROOT_PATH = '^/(?:index\\.php)?$'
routes = []

# ?page_id= / ?p= short links: one per page and post (read from the .htaccess rules).
ids = re.findall(r'\(\?:page_id\|p\)=(\d+)\(\?:&\|\$\)\n\s+RewriteRule \S+ https://www\.valenciasmileexpert\.com(\S*) ', HT)
assert len(ids) > 50, 'page id rules not found in .htaccess'
for i, path in ids:
    for key in ('page_id', 'p'):
        routes.append(moved(ROOT_PATH, path, has=[query(key, {'eq': i})]))

# WordPress sitemaps.
routes.append(moved('^/(?:sitemap_index|wp-sitemap|[a-z_-]+-sitemap\\d*|wp-sitemap-[a-z0-9_-]+)\\.xml$', '/sitemap.xml'))
routes.append(moved(ROOT_PATH, '/sitemap.xml', has=[query('sitemap')]))

# Old uploaded images (any WordPress size, e.g. -300x200) to the same file on this site, when it has it.
files = {}
for d, _, names in os.walk(os.path.join(ROOT, 'public/images/uploads')):
    for n in names:
        stem, ext = os.path.splitext(os.path.relpath(os.path.join(d, n), os.path.join(ROOT, 'public/images/uploads')))
        files.setdefault(ext[1:].lower(), []).append(re.escape(stem))
for ext, stems in sorted(files.items()):
    routes.append(moved('^/wp-content/uploads/(' + '|'.join(sorted(stems)) + ')(?:-\\d+x\\d+)?\\.' + re.escape(ext) + '$',
                        '/images/uploads/$1.' + ext))

# WordPress-only addresses that no longer exist: 410 Gone, so search engines drop them.
routes += [
    gone('^/(?:wp-admin|wp-includes|wp-json|wp-content)(?:/.*)?$'),
    gone('^/(?:wp-login|xmlrpc|wp-cron|wp-signup|wp-trackback|wp-comments-post|wp-links-opml)\\.php$'),
    gone('^/(?:.+/)?(?:feed|trackback|embed)(?:/(?:rss2?|atom|rdf))?/?$'),
    gone('^/comments/.*$'),
    *[gone(ROOT_PATH, has=[query(k)]) for k in ('rest_route', 'feed', 'attachment_id', 'replytocom')],
    # Apache's own file; not served here.
    {'src': '^/\\.htaccess$', 'status': 404, 'dest': '/404.html'},
    # /index.php without a page id.
    moved('^/index\\.php$', '/'),
]

redirects = [
    # One address: https://www.valenciasmileexpert.com (the bare domain goes there; *.vercel.app stays).
    {'source': '/:path*', 'has': [{'type': 'host', 'value': 'valenciasmileexpert.com'}], 'destination': HOST + '/:path*', 'statusCode': 301},
    # WordPress's own old-address redirect, kept.
    {'source': '/dental-implants{/}?', 'destination': '/services/dental-implants/', 'statusCode': 301},
    # Author archives: Dr. Moezzi's to the About page, the two staff accounts' (no posts) to the blog.
    {'source': '/author/nedamoezzi/:rest*', 'destination': '/about/', 'statusCode': 301},
    {'source': '/author/:name/:rest*', 'destination': '/category/blogs/', 'statusCode': 301},
]

# The Sanity Studio is one page; its inner URLs (/cms/structure/...) load it.
rewrites = [{'source': '/cms/:path+', 'destination': '/cms/index.html'}]

# Headers: the same values as .htaccess.
security = dict(re.findall(r'Header always set (X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy|Strict-Transport-Security) "([^"]+)"', HT))
csp = re.search(r'Header always set Content-Security-Policy "([^"]+)"', HT).group(1)
assert len(security) == 5 and csp
year, month, fresh = 'public, max-age=31536000, immutable', 'public, max-age=2592000', 'public, max-age=0, must-revalidate'
headers = [
    {'source': '/(.*)', 'headers': [{'key': k, 'value': v} for k, v in security.items()]},
    # The studio at /cms talks to many Sanity hosts and is protected by Sanity login instead.
    {'source': '/((?!cms(?:/|$)).*)', 'headers': [{'key': 'Content-Security-Policy', 'value': csp}]},
    # Only https://www.valenciasmileexpert.com is indexed (not valencia-smiles.vercel.app or other copies).
    {'source': '/(.*)', 'missing': [{'type': 'host', 'value': 'www.valenciasmileexpert.com'}], 'headers': [{'key': 'X-Robots-Tag', 'value': 'noindex, nofollow'}]},
    # Caching: versioned files (?v=) and fonts for a year, photos for a month, pages always fresh.
    {'source': '/(.*)\\.(js|css|woff|woff2)', 'headers': [{'key': 'Cache-Control', 'value': year}]},
    {'source': '/(.*)\\.(webp|avif|jpg|jpeg|png|gif|svg|ico)', 'headers': [{'key': 'Cache-Control', 'value': month}]},
    {'source': '/(.*)\\.(html|txt|xml)', 'headers': [{'key': 'Cache-Control', 'value': fresh}]},
]

config = {
    '$schema': 'https://openapi.vercel.sh/vercel.json',
    # Plain static hosting of the export (with the post-build step), not Vercel's Next.js server.
    'framework': None,
    'buildCommand': 'npm run build',
    'outputDirectory': 'out',
    'trailingSlash': True,
    'redirects': redirects,
    'rewrites': rewrites,
    'headers': headers,
    'routes': routes,
}
open(os.path.join(ROOT, 'vercel.json'), 'w').write(json.dumps(config, indent=2) + '\n')
print(len(routes), 'routes,', len(ids), 'page ids')
