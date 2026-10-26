"""
Live Elementor HTML -> structured page data (lib/data/pages/*.json, lib/data/chrome.json).

Each Elementor element becomes a node keyed by its Elementor id (`_key`), with the
element's own classes (`cls`, minus the ones the renderer adds back) so the ported
Elementor CSS keeps matching, and the widget's content as plain fields.
Run: python3 -I extract.py <live dir> <repo dir>
"""
import sys, os, re, json, glob, base64, hashlib, html as htmlmod
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup, Comment, NavigableString, Tag

LIVE, REPO = sys.argv[1], sys.argv[2]
HOST = 'https://www.valenciasmileexpert.com'
IMAGES = {}   # local path -> original absolute URL (full-size file)
ICONS = {}    # icon key -> svg markup
POPUP_IDS = set()

SIZE_RE = re.compile(r'-(\d+)x(\d+)(?=\.(?:png|jpe?g|webp|gif)$)', re.I)
UPLOAD_RE = re.compile(r'https?://(?:www\.valenciasmileexpert\.com|staging7\.tiamspa\.com|valencia\.ttrdigitalmarketing\.com)/wp-content/uploads/([^"\'\s)?#]+)')


def local_image(url):
    """Upload URL (any size, any of the three hosts) -> /images/uploads/<path of the full-size file>."""
    m = UPLOAD_RE.match(url)
    if not m:
        return url
    rel = unquote(m.group(1))
    full = SIZE_RE.sub('', rel)
    # "-e1749154322322" is WordPress's edited-image suffix: that file is the one shown, keep it.
    host = urlparse(url).netloc
    path = '/images/uploads/' + full
    IMAGES.setdefault(path, f'https://{host}/wp-content/uploads/{full}')
    return path


def rewrite_html(s):
    s = UPLOAD_RE.sub(lambda m: local_image(m.group(0)), s)
    s = s.replace(HOST + '/', '/').replace('href="' + HOST + '"', 'href="/"')
    return s


def popup_href(href):
    if href and 'elementor-action' in href:
        q = unquote(href)
        m = re.search(r'settings=([A-Za-z0-9+/=]+)', q)
        if m:
            settings = json.loads(base64.b64decode(m.group(1) + '==='))
            POPUP_IDS.add(str(settings['id']))
            return '#popup-' + str(settings['id'])
    return href


def link(href):
    if href is None:
        return None
    href = popup_href(href)
    if href.startswith(HOST):
        href = href[len(HOST):] or '/'
    return href


def inner(tag):
    # HTML comments (e.g. a writer's "<!-- Meta description: ... -->" note) are not page content.
    # Only ordinary whitespace is trimmed: a no-break space at either end (&nbsp;) takes room on the line, as on the live site.
    return rewrite_html(''.join(str(c) for c in tag.contents if not isinstance(c, Comment))).strip(' \t\n\r\f')


def svg_key(svg):
    cls = svg.get('class') or []
    markup = re.sub(r'\s+', ' ', str(svg)).strip()
    name = next((c for c in cls if c.startswith('e-') and c != 'e-font-icon-svg'), None)
    # Same icon with the same classes -> one entry; extra classes (e.g. the menu toggle's) get their own.
    extra = [c for c in cls if c not in ('e-font-icon-svg', name)]
    key = (name + ('--' + '-'.join(extra) if extra else '')) if name else 'svg-' + hashlib.md5(markup.encode()).hexdigest()[:8]
    ICONS.setdefault(key, markup)
    return key


def icon_of(tag):
    if tag is None:
        return None
    svg = tag if tag.name == 'svg' else tag.find('svg')
    if svg is not None:
        return {'svg': svg_key(svg)}
    img = tag.find('img')
    if img is not None:
        return {'img': img_data(img)}
    i = tag.find('i')
    if i is not None:
        return {'i': ' '.join(i.get('class') or [])}
    return None


def img_data(img):
    src = img.get('data-src') or img.get('src')
    d = {'src': local_image(src) if src else ''}
    for a in ('width', 'height'):
        if img.get(a):
            d[a] = int(float(img[a]))
    cls = ' '.join(img.get('class') or [])
    if cls:
        d['cls'] = cls
    d['alt'] = img.get('alt') or ''
    if img.get('sizes'):
        d['sizes'] = img['sizes']
    if img.get('title'):
        d['title'] = img['title']
    return d


STD = re.compile(r'^(elementor-element|elementor-element-[0-9a-f]+|elementor-widget)$')


def own_cls(el, wt=None):
    keep = [c for c in (el.get('class') or []) if not STD.match(c)]
    return ' '.join(keep)


def wrap(el):
    return el.find(class_='elementor-widget-container', recursive=False) or el


def children_nodes(el):
    out = []
    for c in el.children:
        if not isinstance(c, Tag):
            continue
        if 'elementor-element' in (c.get('class') or []):
            n = node(c)
            if n:
                out.append(n)
        elif 'e-con-inner' in (c.get('class') or []):
            out.extend(children_nodes(c))
        else:
            out.extend(children_nodes(c))
    return out


def node(el):
    et = el.get('data-element_type')
    nid = el.get('data-id')
    if et == 'container':
        n = {'_type': 'box', '_key': nid, 'cls': own_cls(el), 'children': children_nodes(el)}
        st = json.loads(el.get('data-settings') or '{}')
        if st.get('sticky'):
            n['sticky'] = {k: st[k] for k in ('sticky', 'sticky_on', 'sticky_offset', 'sticky_offset_tablet', 'sticky_offset_mobile', 'sticky_effects_offset') if k in st}
        return n
    if et == 'widget':
        wt = el.get('data-widget_type', '').replace('.default', '')
        w = wrap(el)
        n = {'_key': nid, 'cls': own_cls(el)}
        if w is el:
            n['bare'] = True
        fn = WIDGETS.get(wt)
        if fn is None:
            raise SystemExit(f'unknown widget {wt}')
        n.update(fn(el, w))
        if el.get('data-settings') and n['_type'] in ('carousel', 'imageCarousel', 'accordion'):
            n['settings'] = json.loads(el['data-settings'])
        return n
    return None


def w_heading(el, w):
    h = w.find(class_='elementor-heading-title')
    a = h.find('a', recursive=False)
    # A heading is "linked" only when one <a> wraps all of its text; otherwise its links are part of the text.
    if a is not None and (len(h.find_all('a', recursive=False)) > 1 or h.get_text(strip=True) != a.get_text(strip=True)):
        a = None
    d = {'_type': 'heading', 'tag': h.name, 'html': inner(a if a else h)}
    if 'elementor-size-default' not in (h.get('class') or []):
        d['size'] = ' '.join(c for c in h['class'] if c != 'elementor-heading-title')
    if a is not None:
        d['href'] = link(a.get('href'))
        if a.get('target'):
            d['target'] = a['target']
    return d


def w_text(el, w):
    return {'_type': 'text', 'html': inner(w)}


def w_button(el, w):
    a = w.find(class_='elementor-button')
    d = {'_type': 'button', 'text': a.find(class_='elementor-button-text').get_text() if a.find(class_='elementor-button-text') else ''}
    if a.get('href') is not None:
        d['href'] = link(a['href'])
    if a.get('target'):
        d['target'] = a['target']
    if a.get('id'):
        d['buttonId'] = a['id']
    d['aCls'] = ' '.join(a.get('class') or [])
    ic = a.find(class_='elementor-button-icon')
    if ic is not None:
        d['icon'] = icon_of(ic)
        cw = a.find(class_='elementor-button-content-wrapper')
        kids = [c for c in cw.children if isinstance(c, Tag)]
        d['iconAfter'] = kids.index(ic) > 0
    return d


def w_image(el, w):
    img = w.find('img')
    d = {'_type': 'image', 'img': img_data(img)}
    a = img.find_parent('a')
    if a is not None and a is not el:
        d['href'] = link(a.get('href'))
        if a.get('target'):
            d['target'] = a['target']
    cap = w.find('figcaption')
    if cap is not None:
        d['caption'] = inner(cap)
    return d


def w_iconbox(el, w):
    d = {'_type': 'iconBox'}
    ic = w.find(class_='elementor-icon-box-icon')
    if ic is not None:
        d['icon'] = icon_of(ic)
        a = ic.find('a')
        if a is not None:
            d['href'] = link(a.get('href'))
    t = w.find(class_='elementor-icon-box-title')
    if t is not None:
        d['titleTag'] = t.name
        a = t.find('a')
        d['title'] = inner(a if a is not None else t.find('span') or t)
        if a is None and t.find('span') is None:
            d['titleBare'] = True
        if a is not None:
            d['href'] = link(a.get('href'))
    p = w.find(class_='elementor-icon-box-description')
    if p is not None:
        d['descTag'] = p.name
        d['desc'] = inner(p)
    return d


def w_imagebox(el, w):
    d = {'_type': 'imageBox'}
    img = w.find('img')
    if img is not None:
        d['img'] = img_data(img)
    t = w.find(class_='elementor-image-box-title')
    if t is not None:
        d['titleTag'] = t.name
        a = t.find('a')
        d['title'] = inner(a if a is not None else t)
        if a is not None:
            d['href'] = link(a.get('href'))
    p = w.find(class_='elementor-image-box-description')
    if p is not None:
        d['desc'] = inner(p)
    return d


def w_iconlist(el, w):
    items = []
    for li in w.select('li.elementor-icon-list-item'):
        it = {'_key': 'i%d' % len(items), 'text': inner(li.find(class_='elementor-icon-list-text'))}
        licls = ' '.join(c for c in li.get('class') or [] if c != 'elementor-icon-list-item')
        if licls:
            it['liCls'] = licls
        a = li.find('a')
        if a is not None:
            it['href'] = link(a.get('href'))
            if a.get('target'):
                it['target'] = a['target']
        ic = li.find(class_='elementor-icon-list-icon')
        if ic is not None:
            it['icon'] = icon_of(ic)
        items.append(it)
    ul = w.find('ul')
    d = {'_type': 'iconList', 'items': items}
    ulcls = ' '.join(c for c in ul.get('class') or [] if c != 'elementor-icon-list-items')
    if ulcls:
        d['ulCls'] = ulcls
    return d


def w_map(el, w):
    f = w.find('iframe')
    return {'_type': 'map', 'src': f.get('src'), 'title': f.get('title') or '', 'label': f.get('aria-label') or ''}


def w_shortcode(el, w):
    t = w.find(class_='twenty20')
    if t is not None:
        imgs = t.find_all('img')
        c = t.find(class_='twentytwenty-container')
        return {'_type': 'beforeAfter', 'before': img_data(imgs[0]), 'after': img_data(imgs[1]), 'n': t.get('id'),
                'offset': c.get('data-offset'), 'beforeLabel': c.get('data-before') or '', 'afterLabel': c.get('data-after') or ''}
    return {'_type': 'html', 'html': inner(w.find(class_='elementor-shortcode') or w)}


def w_accordion(el, w):
    items = []
    for det in w.select('details.e-n-accordion-item'):
        title = det.find(class_='e-n-accordion-item-title-text')
        ic = det.find(class_='e-n-accordion-item-title-icon')
        content = det.find(class_='elementor-element', recursive=False)
        items.append({'_key': content.get('data-id'), 'title': inner(title), 'open': det.has_attr('open'), 'content': node(content)})
        if 'icons' not in locals():
            icons = {'opened': icon_of(ic.find(class_='e-opened')), 'closed': icon_of(ic.find(class_='e-closed'))}
    head = w.select_one('.e-n-accordion-item-title-header')
    return {'_type': 'accordion', 'items': items, 'icons': icons, 'titleTag': head.find().name if head and head.find() else 'div'}


def w_carousel(el, w):
    slides = []
    for sl in w.select('.swiper-wrapper > .swiper-slide'):
        c = sl.find(class_='elementor-element', recursive=False)
        slides.append(node(c))
    d = {'_type': 'carousel', 'slides': slides, 'ariaLive': w.select_one('.swiper-wrapper').get('aria-live')}
    prev = w.find(class_='elementor-swiper-button-prev')
    if prev is not None:
        d['arrows'] = {'prev': icon_of(prev), 'next': icon_of(w.find(class_='elementor-swiper-button-next'))}
    d['pagination'] = w.find(class_='swiper-pagination') is not None
    return d


def w_imagecarousel(el, w):
    imgs = [img_data(i) for i in w.select('.swiper-slide img')]
    return {'_type': 'imageCarousel', 'images': [dict(i, _key='i%d' % n) for n, i in enumerate(imgs)]}


def w_table(el, w):
    head = [inner(th.find(class_='data-table-header-text') or th) for th in w.select('thead th')]
    rows = []
    for tr in w.select('tbody tr'):
        rows.append({'_key': 'r%d' % len(rows), 'cells': [inner(td.find(class_='td-content') or td) for td in tr.find_all('td')]})
    return {'_type': 'table', 'head': head, 'rows': rows}


def w_html(el, w):
    return {'_type': 'html', 'html': inner(w)}


def w_social(el, w):
    items = []
    for a in w.select('a.elementor-social-icon'):
        net = next((c[len('elementor-social-icon-'):] for c in a['class'] if c.startswith('elementor-social-icon-')), '')
        rep = next((c for c in a['class'] if c.startswith('elementor-repeater-item-')), '')
        items.append({'_key': rep.replace('elementor-repeater-item-', '') or 'i%d' % len(items), 'network': net, 'label': a.find(class_='elementor-screen-only').get_text(), 'href': link(a.get('href')), 'icon': icon_of(a)})
    return {'_type': 'socialIcons', 'items': items}


def w_logo(el, w):
    a = w.find('a')
    return {'_type': 'siteLogo', 'img': img_data(w.find('img')), 'href': link(a.get('href')) if a else '/'}


CURRENT = re.compile(r'^(current[-_].*|page_item|page-item-\d+)$')


def menu_items(ul):
    out = []
    for li in ul.find_all('li', recursive=False):
        a = li.find('a', recursive=False)
        label = ''.join(t for t in a.find_all(string=True, recursive=False)).strip()
        it = {'_key': 'm%d' % len(out), 'label': label, 'href': link(a.get('href')), 'liCls': ' '.join(c for c in li.get('class') or [] if not CURRENT.match(c)), 'aCls': ' '.join(c for c in a.get('class') or [] if c != 'elementor-item-active')}
        if a.get('target'):
            it['target'] = a['target']
        sub = li.find('ul', recursive=False)
        if sub is not None:
            it['children'] = menu_items(sub)
        out.append(it)
    return out


def w_nav(el, w):
    nav = w.find('nav', class_='elementor-nav-menu--main')
    ul = nav.find('ul')
    tog = w.find(class_='elementor-menu-toggle')
    arrow = w.select_one('.ast-icon.icon-arrow svg')
    sub = w.select_one('.sub-arrow svg')
    return {'_type': 'navMenu', 'items': menu_items(ul), 'navCls': ' '.join(nav.get('class') or []), 'ulId': ul.get('id'),
            'arrowSvg': re.sub(r'\s+', ' ', str(arrow)) if arrow else None, 'subArrow': icon_of(sub.parent) if sub else None,
            'toggle': {'open': icon_of(tog.find(class_='elementor-menu-toggle__icon--open')), 'close': icon_of(tog.find(class_='elementor-menu-toggle__icon--close'))} if tog else None,
            'dropCls': ' '.join(w.find('nav', class_='elementor-nav-menu--dropdown').get('class') or []) if w.find('nav', class_='elementor-nav-menu--dropdown') else None}


def w_form(el, w):
    form = w.find('form')
    fields = []
    for g in form.select('.elementor-field-group'):
        inp = g.find(['input', 'textarea', 'select'])
        lab = g.find('label')
        btn = g.find('button')
        fields.append({'_key': 'f%d' % len(fields), 'groupCls': ' '.join(g.get('class') or []), 'label': lab.get_text(' ', strip=True) if lab else '',
                       'tag': (btn or inp).name, 'attrs': {k: (' '.join(v) if isinstance(v, list) else v) for k, v in (btn or inp).attrs.items()},
                       'button': inner(btn) if btn else None})
    return {'_type': 'form', 'name': form.get('name'), 'fields': fields}


WIDGETS = {
    'heading': w_heading, 'text-editor': w_text, 'button': w_button, 'image': w_image, 'icon-box': w_iconbox,
    'image-box': w_imagebox, 'icon-list': w_iconlist, 'google_maps': w_map, 'shortcode': w_shortcode,
    'nested-accordion': w_accordion, 'nested-carousel': w_carousel, 'image-carousel': w_imagecarousel,
    'eael-data-table': w_table, 'html': w_html, 'social-icons': w_social, 'theme-site-logo': w_logo,
    'nav-menu': w_nav, 'form': w_form,
}


def document(doc):
    return {'postId': doc.get('data-elementor-id'), 'docType': doc.get('data-elementor-type'), 'cls': ' '.join(doc.get('class') or []),
            'children': children_nodes(doc)}


def meta(s):
    m = lambda sel, a='content': (s.select_one(sel) or {}).get(a) if s.select_one(sel) else None
    return {'title': s.title.string.strip() if s.title else '', 'description': m('meta[name=description]') or '',
            'ogImage': local_image(m('meta[property="og:image"]')) if m('meta[property="og:image"]') else None}


def body_classes(s):
    return ' '.join(c for c in s.body.get('class') or [] if c not in ('ast-desktop', 'ast-header-break-point'))


API_POSTS = {x['slug']: x for x in json.load(open(os.path.join(LIVE, 'json/posts.json')))}
POSTS = set(API_POSTS)


def post_data(s, slug, doc):
    api = API_POSTS[slug]
    art = s.select_one('article.ast-article-single')
    thumb = art.select_one('.post-thumb img')
    a = art.select_one('.posted-by a')
    d = {'slug': slug, 'path': '/' + slug + '/', 'id': str(api['id']), 'title': art.select_one('h1.entry-title').get_text(),
         'date': api['date'], 'modified': api['modified'], 'dateText': art.select_one('.published').get_text(strip=True),
         'author': {'name': a.get_text(strip=True), 'slug': a['href'].rstrip('/').split('/')[-1]},
         'image': img_data(thumb) if thumb else None, 'seo': meta(s), 'bodyCls': body_classes(s),
         'articleCls': ' '.join(art.get('class') or [])}
    if doc is not None:
        d['doc'] = document(doc)
    else:
        d['html'] = inner(art.select_one('.entry-content'))
    return d


def main():
    out_pages = os.path.join(REPO, 'lib/data/pages')
    os.makedirs(out_pages, exist_ok=True)
    chrome = {}
    posts, plain = [], []
    for f in sorted(os.listdir(os.path.join(LIVE, 'html'))):
        s = BeautifulSoup(open(os.path.join(LIVE, 'html', f)).read(), 'lxml')
        slug = f[:-5]
        doc = s.select_one('[data-elementor-type=wp-page],[data-elementor-type=wp-post]')
        for kind in ('header', 'footer'):
            if kind not in chrome:
                d = s.select_one(f'[data-elementor-type={kind}]')
                if d is not None:
                    chrome[kind] = document(d)
        for p in s.select('[data-elementor-type=popup]'):
            pid = p.get('data-elementor-id')
            chrome.setdefault('popups', {})
            if pid not in chrome['popups']:
                d = document(p)
                d['popupSettings'] = json.loads(p.get('data-elementor-settings') or '{}')
                chrome['popups'][pid] = d
        if slug in POSTS:
            posts.append(post_data(s, slug, doc))
            continue
        if doc is None:
            if slug in ('privacy-policy', 'testimonials'):
                art = s.select_one('article')
                plain.append({'slug': slug, 'path': '/' + slug + '/', 'id': art.get('id').replace('post-', ''), 'seo': meta(s), 'bodyCls': body_classes(s),
                              'articleCls': ' '.join(art.get('class') or []), 'title': s.select_one('h1.entry-title').get_text(),
                              'html': inner(s.select_one('.entry-content'))})
            continue
        page = {'slug': slug, 'path': '/' + slug.replace('__', '/') + '/' if slug != 'home' else '/', 'seo': meta(s), 'bodyCls': body_classes(s), 'doc': document(doc)}
        json.dump(page, open(os.path.join(out_pages, slug + '.json'), 'w'), indent=1, ensure_ascii=False)
    posts.sort(key=lambda p: p['date'], reverse=True)
    # A post whose own page shows no featured image can still have one on the blog listing and in
    # related-post cards (WordPress shows it there): keep that one as the card image.
    cards = {}
    for f in sorted(glob.glob(os.path.join(LIVE, 'html', 'category__blogs*.html'))):
        for art in BeautifulSoup(open(f).read(), 'html.parser').select('article[id^=post-]'):
            img = art.select_one('.post-thumb img')
            if img:
                cards[art['id'].replace('post-', '')] = img_data(img)
    for p in posts:
        if p['image'] is None and p['id'] in cards:
            p['cardImage'] = cards[p['id']]
    json.dump(posts, open(os.path.join(REPO, 'lib/data/posts.json'), 'w'), indent=1, ensure_ascii=False)
    json.dump(plain, open(os.path.join(REPO, 'lib/data/plain-pages.json'), 'w'), indent=1, ensure_ascii=False)
    json.dump(chrome, open(os.path.join(REPO, 'lib/data/chrome.json'), 'w'), indent=1, ensure_ascii=False)
    json.dump(ICONS, open(os.path.join(REPO, 'lib/data/icons.json'), 'w'), indent=1, ensure_ascii=False)
    json.dump(IMAGES, open(os.path.join(LIVE, 'images.json'), 'w'), indent=1)
    print('pages', len(os.listdir(out_pages)), 'icons', len(ICONS), 'images', len(IMAGES), 'popups', sorted(POPUP_IDS))


main()
