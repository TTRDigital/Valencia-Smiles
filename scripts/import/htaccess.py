import json, os, sys
LIVE, OUT = sys.argv[1], sys.argv[2]
H = 'https://www.valenciasmileexpert.com'
ids = []
for f in ('pages', 'posts'):
    for x in json.load(open(f'{LIVE}/json/{f}.json')):
        ids.append((x['id'], x['link'].replace(H, '')))
ids.sort()
idrules = '\n'.join(
    f'  RewriteCond %{{QUERY_STRING}} (?:^|&)(?:page_id|p)={i}(?:&|$)\n  RewriteRule ^(?:index\\.php)?$ https://www.valenciasmileexpert.com{path} [R=301,L,QSD]'
    for i, path in ids)

TEMPLATE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'htaccess.tpl')).read()
open(OUT, 'w').write(TEMPLATE.replace('{{ID_RULES}}', idrules))
print(len(ids), 'id rules')
