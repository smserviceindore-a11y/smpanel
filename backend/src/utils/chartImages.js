const { Resvg } = require('@resvg/resvg-js');

const COLORS = ['#0f3d3e', '#14b8a6', '#1e5f74', '#c4a574', '#0ea5e9', '#64748b', '#0f766e', '#f59e0b'];

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toPairs = (rows = []) =>
  rows
    .map((r) => ({
      label: String(r.key || r._id || r.label || '—').replace(/_/g, ' '),
      value: Number(r.count ?? r.value ?? 0) || 0,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

const svgToPng = (svg, width) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Arial',
    },
  });
  const rendered = resvg.render();
  return {
    buffer: rendered.asPng(),
    width: rendered.width,
    height: rendered.height,
  };
};

const frame = (title, inner, w, h) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <style type="text/css">
      .t { font-family: Arial, Helvetica, sans-serif; }
    </style>
  </defs>
  <rect width="${w}" height="${h}" rx="14" fill="#ffffff" stroke="#d5e0dd" stroke-width="2"/>
  <rect x="0" y="0" width="${w}" height="42" fill="#0f3d3e"/>
  <text x="18" y="27" fill="#5eead4" class="t" font-size="15" font-weight="700">${esc(title)}</text>
  ${inner}
</svg>`;

/** Donut chart with legend under the ring (no clipping). */
const renderDonutChart = (title, rows = [], size = 440) => {
  const data = toPairs(rows).slice(0, 8);
  const w = size;
  const legendH = Math.max(70, 24 + data.length * 22);
  const h = 300 + legendH;
  if (!data.length) {
    return svgToPng(
      frame(
        title,
        `<text x="${w / 2}" y="180" text-anchor="middle" fill="#5b6e6d" class="t" font-size="14">No data for this slice</text>`,
        w,
        280
      ),
      w
    );
  }

  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const cx = w / 2;
  const cy = 168;
  const r = 88;
  const rInner = 52;
  let angle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + Math.max(sweep, 0.001);
    angle = a1;
    const large = sweep > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const xi0 = cx + rInner * Math.cos(a1);
    const yi0 = cy + rInner * Math.sin(a1);
    const xi1 = cx + rInner * Math.cos(a0);
    const yi1 = cy + rInner * Math.sin(a0);
    const path = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1} Z`;
    return `<path d="${path}" fill="${COLORS[i % COLORS.length]}" stroke="#ffffff" stroke-width="2"/>`;
  });

  const legend = data
    .map((d, i) => {
      const y = 280 + i * 22;
      const pct = Math.round((d.value / total) * 100);
      return `<rect x="40" y="${y - 10}" width="12" height="12" rx="2" fill="${COLORS[i % COLORS.length]}"/>
        <text x="60" y="${y}" fill="#0b1f1f" class="t" font-size="12">${esc(d.label)} — ${d.value} (${pct}%)</text>`;
    })
    .join('');

  return svgToPng(
    frame(
      title,
      `${slices.join('')}
       <circle cx="${cx}" cy="${cy}" r="${rInner - 2}" fill="#ffffff"/>
       <text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="#0f3d3e" class="t" font-size="26" font-weight="700">${total}</text>
       <text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="#5b6e6d" class="t" font-size="11">total</text>
       ${legend}`,
      w,
      h
    ),
    w
  );
};

/** Horizontal bar chart — clear bars + values, no empty gray track dominating. */
const renderBarChart = (title, rows = [], opts = {}) => {
  const data = toPairs(rows).slice(0, 12);
  const w = opts.width || 620;
  const rowH = 34;
  const top = 58;
  const h = Math.max(220, top + data.length * rowH + 28);
  if (!data.length) {
    return svgToPng(
      frame(
        title,
        `<text x="${w / 2}" y="${h / 2}" text-anchor="middle" fill="#5b6e6d" class="t" font-size="14">No data for this slice</text>`,
        w,
        220
      ),
      w
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const left = 150;
  const right = 56;
  const barMax = w - left - right;

  const bars = data
    .map((d, i) => {
      const y = top + i * rowH;
      const bw = Math.max(18, (d.value / max) * barMax);
      const label = d.label.length > 18 ? `${d.label.slice(0, 17)}…` : d.label;
      return `
        <text x="16" y="${y + 16}" fill="#0b1f1f" class="t" font-size="12">${esc(label)}</text>
        <rect x="${left}" y="${y}" width="${bw}" height="20" rx="5" fill="${COLORS[i % COLORS.length]}"/>
        <text x="${left + bw + 8}" y="${y + 15}" fill="#0f3d3e" class="t" font-size="13" font-weight="700">${d.value}</text>`;
    })
    .join('');

  return svgToPng(frame(title, bars, w, h), w);
};

/**
 * Grouped monthly columns (projects / requirements / customizations side-by-side).
 * Avoids stacked chart where one series swallows the rest.
 */
const renderTrendChart = (title, monthly = [], opts = {}) => {
  const rows = (monthly || []).map((m) => ({
    label: String(m.label || m.month || ''),
    projects: Number(m.projects) || 0,
    requirements: Number(m.requirements) || 0,
    customizations: Number(m.customizations) || 0,
  }));
  const w = opts.width || 980;
  const h = opts.height || 380;
  if (!rows.length) {
    return svgToPng(
      frame(
        title,
        `<text x="${w / 2}" y="${h / 2}" text-anchor="middle" fill="#5b6e6d" class="t" font-size="14">No trend data</text>`,
        w,
        h
      ),
      w
    );
  }

  const padL = 52;
  const padR = 28;
  const padT = 78;
  const padB = 56;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const max = Math.max(
    1,
    ...rows.flatMap((r) => [r.projects, r.requirements, r.customizations])
  );
  const groupW = plotW / rows.length;
  const barW = Math.min(18, Math.max(8, (groupW - 16) / 3.4));
  const series = [
    { key: 'projects', color: '#0f3d3e', label: 'Projects' },
    { key: 'requirements', color: '#14b8a6', label: 'Requirements' },
    { key: 'customizations', color: '#c4a574', label: 'Customizations' },
  ];

  const columns = rows
    .map((r, i) => {
      const groupX = padL + i * groupW;
      const bars = series
        .map((s, si) => {
          const val = r[s.key];
          const bh = Math.max(val > 0 ? 4 : 0, (val / max) * plotH);
          const x = groupX + 10 + si * (barW + 4);
          const y = padT + plotH - bh;
          const label =
            val > 0
              ? `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" fill="#0b1f1f" class="t" font-size="9">${val}</text>`
              : '';
          return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="3" fill="${s.color}"/>${label}`;
        })
        .join('');
      const short = r.label.length > 12 ? `${r.label.slice(0, 11)}…` : r.label;
      return `${bars}<text x="${groupX + groupW / 2}" y="${h - 24}" text-anchor="middle" fill="#5b6e6d" class="t" font-size="11">${esc(short)}</text>`;
    })
    .join('');

  const legend = series
    .map(
      (s, i) =>
        `<rect x="${padL + i * 150}" y="50" width="12" height="12" rx="2" fill="${s.color}"/>
         <text x="${padL + 18 + i * 150}" y="60" fill="#0b1f1f" class="t" font-size="12">${s.label}</text>`
    )
    .join('');

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const y = padT + plotH * (1 - t);
      const val = Math.round(max * t);
      return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#e7eeec" stroke-width="1"/>
        <text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#5b6e6d" class="t" font-size="10">${val}</text>`;
    })
    .join('');

  return svgToPng(frame(title, `${grid}${legend}${columns}`, w, h), w);
};

module.exports = {
  renderDonutChart,
  renderBarChart,
  renderTrendChart,
};
