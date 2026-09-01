#!/usr/bin/env python3
"""Assemble the standalone Selected Work dossier.

Run from the site root after editing any case page:

    python3 work-dossier/build.py

It reads work/<slug>/index.html, keeps each case from its project header
down to (but not including) Related work, inlines the three stylesheets
and both screenshots, rewrites the cross-links between cases as in-page
anchors, and writes one self-contained file that works offline.
"""
import re, base64, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

CASES = [
    ('BT-01', 'investment-framework', 'Governance',           'Investment Framework &amp; Governance'),
    ('BT-02', 'blowing-machine',      'Investment',           'Blowing Machine Investment'),
    ('BT-03', 'quality-improvement',  'Operations',           'Quality Improvement Project'),
    ('BT-04', 'manufacture-terminal', 'Decision intelligence','Manufacture Terminal'),
]
OUT = 'work-dossier/Aria-Rizki-Ermawan-Selected-Work.html'

read = lambda p: open(p, encoding='utf-8').read()

sections = []
for ref, slug, cat, title in CASES:
    src = read('work/%s/index.html' % slug)
    i = src.index('  <!-- ── Project header'); j = src.index('  <!-- ── Related work', i)
    body = src[i:j]
    for r, sl, _, _ in CASES:
        body = body.replace('href="../%s/index.html"' % sl, 'href="#%s"' % r.lower())
    body = body.replace('href="../index.html"', 'href="#index"')
    for m in set(re.findall(r'src="(\./assets/[^"]+)"', body)):
        blob = base64.b64encode(open(os.path.join('work', slug, m[2:]), 'rb').read()).decode()
        body = body.replace('src="%s"' % m, 'src="data:image/jpeg;base64,%s"' % blob)
    sections.append('  <article class="case-doc" id="%s">\n%s  </article>\n' % (ref.lower(), body))

css = "\n".join(read('emw/%s' % f) for f in ('tokens.css', 'ds-bundle.css', 'portfolio.css'))
css = re.sub(r"@import url\('https://fonts[^\n]*\n", "", css)   # fonts are linked in the head

template = read('work-dossier/template.html')
toc = "\n".join(
    '      <a href="#%s"><span class="n">%s</span><span class="t">%s</span><span class="c">%s</span></a>'
    % (ref.lower(), ref, title, cat) for ref, slug, cat, title in CASES)

open(OUT, 'w', encoding='utf-8').write(
    template.replace('/*STYLES*/', css).replace('<!--TOC-->', toc).replace('<!--CASES-->', "\n".join(sections)))
print('wrote %s — %.0f KB' % (OUT, os.path.getsize(OUT) / 1024))
