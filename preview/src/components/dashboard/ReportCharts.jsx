import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#0f3d3e', '#14b8a6', '#1e5f74', '#c4a574', '#0ea5e9', '#64748b', '#0f766e', '#f59e0b'];

export function ChartCard({ title, children, className = '', tall = false }) {
  return (
    <div className={`rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5 ${className}`}>
      {title ? (
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-brand">
          {title}
        </h3>
      ) : null}
      <div className={`w-full min-w-0 ${tall ? 'h-72 sm:h-80' : 'h-56 sm:h-64'}`}>{children}</div>
    </div>
  );
}

export function MoneySplitPie({ commission = 0, developerShare = 0 }) {
  const data = [
    { name: 'Platform', value: Number(commission) || 0 },
    { name: 'Developers', value: Number(developerShare) || 0 },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Donut / pie from { label: count } map */
export function DonutFromMap({ map = {}, innerRadius = 52, outerRadius = 78 }) {
  const data = Object.entries(map || {})
    .map(([name, value]) => ({
      name: String(name).replace(/_/g, ' '),
      value: Number(value) || 0,
    }))
    .filter((d) => d.value > 0);

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">No data</div>;
  }

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => [
            `${Number(v).toLocaleString('en-IN')} (${total ? Math.round((v / total) * 100) : 0}%)`,
            name,
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function OrdersMixBar({ company = 0, developer = 0 }) {
  const data = [
    { name: 'Company', orders: Number(company) || 0 },
    { name: 'Developer', orders: Number(developer) || 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="orders" fill="#0f766e" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopDevelopersBar({ rows = [] }) {
  const data = (rows || []).slice(0, 6).map((d) => ({
    name: (d.name || 'Dev').split(' ')[0],
    gross: Number(d.grossSales) || 0,
    share: Number(d.developerShare) || 0,
  }));

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">No developer sales</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
        <Legend />
        <Bar dataKey="gross" name="Gross" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
        <Bar dataKey="share" name="Share" fill="#0f766e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusBarsChart({ map = {}, titleKey = 'status' }) {
  const data = Object.entries(map || {}).map(([k, v]) => ({
    [titleKey]: String(k).replace(/_/g, ' '),
    count: Number(v) || 0,
  }));

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey={titleKey} width={100} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Stacked columns for monthly mix */
export function StackedMonthlyChart({ rows = [] }) {
  const data = (rows || []).map((m) => ({
    month: m.month || m.label || '',
    projects: Number(m.projects) || 0,
    requirements: Number(m.requirements) || 0,
    customizations: Number(m.customizations) || 0,
  }));

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">No trend data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="projects" stackId="a" fill="#0f3d3e" />
        <Bar dataKey="requirements" stackId="a" fill="#14b8a6" />
        <Bar dataKey="customizations" stackId="a" fill="#c4a574" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendChart({ rows = [] }) {
  const data = (rows || []).map((m) => ({
    month: m.month || m.label || '',
    projects: Number(m.projects) || 0,
    requirements: Number(m.requirements) || 0,
    customizations: Number(m.customizations) || 0,
  }));

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">No trend data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="projects" stroke="#1e3a5f" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="requirements" stroke="#0f766e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="customizations" stroke="#c4a574" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Generic ₹ amount trend: data = [{ month, amount }] */
export function AmountTrendLine({ data = [] }) {
  const rows = (data || []).map((m) => ({
    month: m.month || '',
    amount: Number(m.amount) || 0,
  }));
  if (!rows.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">No data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
        <Line type="monotone" dataKey="amount" stroke="#0f766e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
