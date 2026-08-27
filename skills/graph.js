/* ============================================================
   KNOWLEDGE GRAPH — renderer and interactions.
   Reads window.KNOWLEDGE (graph-data.js). No dependencies.

   Nothing here needs editing to change the map — add or move
   nodes in graph-data.js and this will lay them out, draw them,
   and rebuild the mobile list from the same source.
   ============================================================ */
(function () {
  'use strict';
  var K = window.KNOWLEDGE;
  if (!K) return;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var R = { skill: 4.5, cluster: 11, synthesis: 15, artifact: 22 };

  /* deterministic jitter so rings read as organic, not mechanical */
  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function jitter(id, amount) { return ((hash(id) % 1000) / 1000 - 0.5) * 2 * amount; }

  /* ── model ───────────────────────────────────────────────── */
  var nodes = {};
  var order = [];

  function add(node) { nodes[node.id] = node; order.push(node.id); }

  K.clusters.forEach(function (c) {
    add({ id:c.id, label:c.label, type:'cluster', num:c.n, cluster:c.label,
          desc:c.desc, x:c.x, y:c.y, arc:c.arc });
  });
  K.synthesis.forEach(function (s) {
    add({ id:s.id, label:s.label, type:'synthesis', num:s.n, cluster:'Synthesis',
          desc:s.desc, x:s.x, y:s.y, arc:s.arc });
  });
  add({ id:K.artifact.id, label:K.artifact.label, type:'artifact', cluster:'Artefact',
        desc:K.artifact.desc, x:K.artifact.x, y:K.artifact.y });

  var byParent = {};
  K.skills.forEach(function (s) {
    var node = { id:s[0], label:s[1], type:'skill', parent:s[2], desc:s[3] };
    node.cluster = nodes[s[2]] ? nodes[s[2]].label : '';
    add(node);
    (byParent[s[2]] = byParent[s[2]] || []).push(node);
  });

  /* the middle of the knowledge field — clusters open away from it */
  var hubs = K.clusters.map(function (c) { return nodes[c.id]; });
  var focus = {
    x: hubs.reduce(function (a, h) { return a + h.x; }, 0) / hubs.length,
    y: hubs.reduce(function (a, h) { return a + h.y; }, 0) / hubs.length
  };
  Object.keys(nodes).forEach(function (id) {
    var n = nodes[id];
    n.out = Math.atan2(n.y - focus.y, n.x - focus.x) * 180 / Math.PI;
  });

  /* place skills on an arc around their parent, facing outward */
  Object.keys(byParent).forEach(function (pid) {
    var hub = nodes[pid], kids = byParent[pid], arc = hub.arc || { spread:170, r:105 };
    if (typeof arc.start !== 'number') arc = { start: hub.out - arc.spread / 2, spread: arc.spread, r: arc.r };
    var n = kids.length;
    kids.forEach(function (kid, i) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      var deg = arc.start + arc.spread * t;
      var rad = deg * Math.PI / 180;
      var r = arc.r + jitter(kid.id, 13);
      kid.x = hub.x + Math.cos(rad) * r;
      kid.y = hub.y + Math.sin(rad) * r * 0.92 + jitter(kid.id + 'y', 7);
      kid.side = Math.cos(rad) < -0.15 ? 'left' : (Math.cos(rad) > 0.15 ? 'right' : 'center');
    });
  });

  /* edges: structural branches + declared relationships */
  var edges = [];
  var seen = {};
  function link(a, b, kind) {
    if (!nodes[a] || !nodes[b]) return;
    var key = a < b ? a + '|' + b : b + '|' + a;
    if (seen[key]) return;
    seen[key] = true;
    edges.push({ source:a, target:b, kind:kind });
  }
  K.skills.forEach(function (s) { link(s[2], s[0], 'branch'); });
  K.edges.forEach(function (e) { link(e[0], e[1], e[2] || 'concept'); });

  var neighbours = {};
  edges.forEach(function (e, i) {
    e.i = i;
    (neighbours[e.source] = neighbours[e.source] || []).push(e.target);
    (neighbours[e.target] = neighbours[e.target] || []).push(e.source);
  });

  /* ── svg ─────────────────────────────────────────────────── */
  var host = document.getElementById('graph');
  if (!host) return;

  var pad = 92;
  var xs = order.map(function (id) { return nodes[id].x; });
  var ys = order.map(function (id) { return nodes[id].y; });
  /* extra room on the left: the band labels live in that gutter */
  var minX = Math.min.apply(null, xs) - pad - 78, maxX = Math.max.apply(null, xs) + pad;
  var minY = Math.min.apply(null, ys) - pad * 0.7, maxY = Math.max.apply(null, ys) + pad * 0.8;

  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'kg');
  svg.setAttribute('viewBox', [minX, minY, maxX - minX, maxY - minY].join(' '));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Knowledge graph. ' + order.length +
    ' nodes across nine knowledge clusters, three syntheses and one artefact. Each node is focusable; the panel beside the map describes the selected node.');

  var gEdges = document.createElementNS(SVG_NS, 'g');
  gEdges.setAttribute('class', 'kg-edges');
  var gNodes = document.createElementNS(SVG_NS, 'g');
  gNodes.setAttribute('class', 'kg-nodes');
  svg.appendChild(gEdges); svg.appendChild(gNodes);

  /* band labels — what the vertical axis means */
  [['Synthesis', nodes['systems-thinking'].y - 46],
   ['Knowledge', nodes['operations'].y + 210],
   ['Artefact',  nodes['manufacture-terminal'].y + 4]].forEach(function (b) {
    var t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('class', 'kg-band');
    t.setAttribute('x', minX + 22); t.setAttribute('y', b[1]);
    t.textContent = b[0];
    svg.insertBefore(t, gNodes);
  });

  edges.forEach(function (e) {
    var a = nodes[e.source], b = nodes[e.target];
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var bow = Math.min(len * 0.07, 26) * (hash(e.source + e.target) % 2 ? 1 : -1);
    var cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('class', 'kg-edge kg-edge--' + e.kind);
    p.setAttribute('d', 'M' + a.x + ' ' + a.y + ' Q' + cx + ' ' + cy + ' ' + b.x + ' ' + b.y);
    p.dataset.edge = e.i;
    gEdges.appendChild(p);
    e.el = p;
  });

  order.forEach(function (id) {
    var n = nodes[id];
    var g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'kg-node kg-node--' + n.type);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', n.label + '. ' + (n.type === 'skill' ? n.cluster + '. ' : '') + n.desc);
    g.dataset.node = id;

    var hit = document.createElementNS(SVG_NS, 'circle');
    hit.setAttribute('class', 'kg-hit');
    hit.setAttribute('cx', n.x); hit.setAttribute('cy', n.y);
    hit.setAttribute('r', Math.max(R[n.type] + 12, 18));
    g.appendChild(hit);

    var c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('class', 'kg-dot');
    c.setAttribute('cx', n.x); c.setAttribute('cy', n.y);
    c.setAttribute('r', R[n.type]);
    g.appendChild(c);

    var label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'kg-label');
    if (n.type === 'skill') {
      var dx = n.side === 'left' ? -(R.skill + 8) : n.side === 'right' ? (R.skill + 8) : 0;
      label.setAttribute('x', n.x + dx);
      label.setAttribute('y', n.y + (n.side === 'center' ? (n.y < nodes[n.parent].y ? -14 : 18) : 4));
      label.setAttribute('text-anchor', n.side === 'left' ? 'end' : n.side === 'right' ? 'start' : 'middle');
    } else if (byParent[n.id] && n.type !== 'artifact') {
      var inward = (n.out + 180) * Math.PI / 180;
      var lx = n.x + Math.cos(inward) * (R[n.type] + 14);
      var ly = n.y + Math.sin(inward) * (R[n.type] + 20) + 5;
      label.setAttribute('x', lx);
      label.setAttribute('y', ly);
      label.setAttribute('text-anchor', Math.cos(inward) < -0.3 ? 'end' : Math.cos(inward) > 0.3 ? 'start' : 'middle');
    } else {
      label.setAttribute('x', n.x);
      label.setAttribute('y', n.y + R[n.type] + 24);
      label.setAttribute('text-anchor', 'middle');
    }
    label.textContent = n.label;
    g.appendChild(label);

    if (n.num) {
      var num = document.createElementNS(SVG_NS, 'text');
      num.setAttribute('class', 'kg-num');
      var ni = (n.out + 180) * Math.PI / 180;
      num.setAttribute('x', n.x + Math.cos(ni) * (R[n.type] + 14));
      num.setAttribute('y', n.y + Math.sin(ni) * (R[n.type] + 20) - 11);
      num.setAttribute('text-anchor', Math.cos(ni) < -0.3 ? 'end' : Math.cos(ni) > 0.3 ? 'start' : 'middle');
      num.textContent = n.num;
      g.appendChild(num);
    }
    if (n.type === 'artifact') {
      var sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('class', 'kg-sub');
      sub.setAttribute('x', n.x); sub.setAttribute('y', n.y + R.artifact + 42);
      sub.setAttribute('text-anchor', 'middle');
      sub.textContent = 'the synthesis, built';
      g.appendChild(sub);
    }

    gNodes.appendChild(g);
    n.el = g;
  });

  host.appendChild(svg);

  /* ── panel ───────────────────────────────────────────────── */
  var panel = document.getElementById('kg-panel');
  var idle = panel ? panel.innerHTML : '';

  function describe(id) {
    var n = nodes[id];
    var links = (neighbours[id] || []).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var chips = links.map(function (l) {
      return '<button type="button" class="kg-chip" data-goto="' + l + '">' + nodes[l].label + '</button>';
    }).join('');
    panel.innerHTML =
      '<p class="t-label kg-panel-kind">' + (n.type === 'artifact' ? 'Artefact' :
        n.type === 'synthesis' ? 'Synthesis' : n.type === 'cluster' ? 'Cluster ' + (n.num || '') : n.cluster) + '</p>' +
      '<h3 class="t-h3 kg-panel-title">' + n.label + '</h3>' +
      '<p class="t-small kg-panel-desc">' + n.desc + '</p>' +
      (links.length ? '<p class="t-label kg-panel-sub">Connects to · ' + links.length + '</p><div class="kg-chips">' + chips + '</div>' : '');
  }

  var active = null, locked = false;

  function paint(id) {
    if (!id) {
      svg.classList.remove('is-focused');
      order.forEach(function (k) { nodes[k].el.classList.remove('on', 'dim'); });
      edges.forEach(function (e) { e.el.classList.remove('on', 'dim'); });
      return;
    }
    var near = {};
    near[id] = true;
    (neighbours[id] || []).forEach(function (n) { near[n] = true; });
    svg.classList.add('is-focused');
    order.forEach(function (k) {
      var el = nodes[k].el;
      el.classList.toggle('on', !!near[k]);
      el.classList.toggle('dim', !near[k]);
      el.classList.toggle('is-active', k === id);
    });
    edges.forEach(function (e) {
      var hot = e.source === id || e.target === id;
      e.el.classList.toggle('on', hot);
      e.el.classList.toggle('dim', !hot);
    });
  }

  function show(id, lock) {
    active = id; locked = !!lock;
    paint(id);
    if (panel) describe(id);
    host.classList.add('has-selection');
  }
  function clear() {
    active = null; locked = false;
    paint(null);
    if (panel) panel.innerHTML = idle;
    host.classList.remove('has-selection');
  }

  order.forEach(function (id) {
    var el = nodes[id].el;
    el.addEventListener('mouseenter', function () { if (!locked) show(id, false); });
    el.addEventListener('mouseleave', function () { if (!locked) clear(); });
    el.addEventListener('focus', function () { if (!locked) show(id, false); });
    el.addEventListener('blur', function () { if (!locked) clear(); });
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      if (locked && active === id) { clear(); } else { show(id, true); }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (locked && active === id) { clear(); } else { show(id, true); }
      }
    });
  });

  if (panel) {
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-goto]');
      if (!b) return;
      var id = b.dataset.goto;
      show(id, true);
      nodes[id].el.focus();
    });
  }

  svg.addEventListener('click', function (e) { if (!e.target.closest('[data-node]')) clear(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') clear(); });

  var reset = document.getElementById('kg-reset');
  if (reset) reset.addEventListener('click', clear);

  /* ── mobile: the same model as an expandable index ───────── */
  var list = document.getElementById('kg-list');
  if (list) {
    var groups = []
      .concat([{ node: nodes['systems-thinking'], kind: 'Synthesis' }])
      .concat(K.clusters.slice().sort(function (a, b) { return a.n.localeCompare(b.n); })
        .map(function (c) { return { node: nodes[c.id], kind: 'Cluster ' + c.n }; }))
      .concat([{ node: nodes['decision-intelligence'], kind: 'Synthesis · 08' },
               { node: nodes['digital-transformation'], kind: 'Synthesis' },
               { node: nodes[K.artifact.id], kind: 'Artefact' }]);

    list.innerHTML = groups.map(function (g) {
      var n = g.node;
      var kids = (byParent[n.id] || []);
      var links = (neighbours[n.id] || []).filter(function (v, i, a) { return a.indexOf(v) === i; })
        .filter(function (l) { return nodes[l].type !== 'skill' || nodes[l].parent !== n.id; });
      return '<details class="kg-item kg-item--' + n.type + '">' +
        '<summary><span class="kg-item-kind t-label">' + g.kind + '</span>' +
        '<span class="kg-item-name">' + n.label + '</span></summary>' +
        '<div class="kg-item-body">' +
        '<p class="t-small">' + n.desc + '</p>' +
        (kids.length ? '<p class="t-label kg-panel-sub">Holds</p><div class="kg-chips">' +
          kids.map(function (k) { return '<span class="kg-chip is-static" title="' + k.desc + '">' + k.label + '</span>'; }).join('') + '</div>' : '') +
        (links.length ? '<p class="t-label kg-panel-sub">Connects to</p><div class="kg-chips">' +
          links.map(function (l) { return '<span class="kg-chip is-static">' + nodes[l].label + '</span>'; }).join('') + '</div>' : '') +
        '</div></details>';
    }).join('');
  }

  var count = document.getElementById('kg-count');
  if (count) count.textContent = order.length + ' nodes · ' + edges.length + ' connections';
})();
