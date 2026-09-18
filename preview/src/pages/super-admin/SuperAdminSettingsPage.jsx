import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSuperSettings,
  updateSuperPaymentSettings,
  updateSuperCloudinarySettings,
  updateSuperBillingSettings,
  updateSuperSmtpSettings,
  updateSuperCompanySettings,
} from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import {
  EntityCard,
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const TABS = [
  { id: 'payments', label: 'Payments' },
  { id: 'email', label: 'Email / SMTP' },
  { id: 'invoice', label: 'Invoice / Company' },
  { id: 'billing', label: 'GST / Tax' },
  { id: 'media', label: 'Media' },
];

const inputCls =
  'w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent';

function Field({ label, children, hint }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function Flash({ ok, err }) {
  if (ok) {
    return (
      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {ok}
      </div>
    );
  }
  if (err) {
    return (
      <div className="mb-4">
        <ErrorBox message={err} />
      </div>
    );
  }
  return null;
}

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('payments');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [payForm, setPayForm] = useState({
    testMode: true,
    testKeyId: '',
    testKeySecret: '',
    liveKeyId: '',
    liveKeySecret: '',
    enabled: true,
    allowDemoPay: true,
    refundHoldDays: 14,
    holdStartMode: 'from_payment',
    couponAdminBearPercent: 80,
    couponDeveloperBearPercent: 20,
    maxPayoutRequestsPerDay: 3,
    maxPayoutAmount: 500000,
  });
  const [smtpForm, setSmtpForm] = useState({
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: 'SM Global Hub',
    fromEmail: '',
  });
  const [companyForm, setCompanyForm] = useState({
    legalName: '',
    tradeName: '',
    registeredAddress: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    pan: '',
    stateCode: '',
    stateName: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    accountType: 'Current',
    ifsc: '',
    branch: '',
    invoicePrefix: 'SM',
    invoiceNotes: '',
    authorisedSignatoryLabel: 'Authorised Signatory',
  });
  const [billingForm, setBillingForm] = useState({
    platformGstin: '',
    defaultTaxPercent: 18,
    defaultHsnSac: '998314',
    placeOfSupply: '',
    taxMode: 'auto',
  });
  const [cloudForm, setCloudForm] = useState({
    cloudName: '',
    apiKey: '',
    apiSecret: '',
    enabled: true,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['super-admin', 'settings'],
    queryFn: async () => (await getSuperSettings()).data.data,
  });

  useEffect(() => {
    if (!data) return;
    if (data.payments) {
      setPayForm((f) => ({
        ...f,
        testMode: data.payments.testMode !== false,
        testKeyId: data.payments.testKeyId || '',
        testKeySecret: '',
        liveKeyId: data.payments.liveKeyId || '',
        liveKeySecret: '',
        enabled: data.payments.enabled !== false,
        allowDemoPay: data.payments.allowDemoPay !== false,
        refundHoldDays: data.payments.refundHoldDays ?? 14,
        holdStartMode: data.payments.holdStartMode || 'from_payment',
        couponAdminBearPercent: data.payments.couponAdminBearPercent ?? 80,
        couponDeveloperBearPercent: data.payments.couponDeveloperBearPercent ?? 20,
        maxPayoutRequestsPerDay: data.payments.maxPayoutRequestsPerDay ?? 3,
        maxPayoutAmount: data.payments.maxPayoutAmount ?? 500000,
      }));
    }
    if (data.smtp) {
      setSmtpForm({
        enabled: data.smtp.enabled !== false,
        host: data.smtp.host || '',
        port: data.smtp.port ?? 587,
        secure: Boolean(data.smtp.secure),
        user: data.smtp.user || '',
        pass: '',
        fromName: data.smtp.fromName || 'SM Global Hub',
        fromEmail: data.smtp.fromEmail || '',
      });
    }
    if (data.company) {
      setCompanyForm((f) => ({ ...f, ...data.company }));
    }
    if (data.billing) {
      setBillingForm({
        platformGstin: data.billing.platformGstin || '',
        defaultTaxPercent: data.billing.defaultTaxPercent ?? 18,
        defaultHsnSac: data.billing.defaultHsnSac || '998314',
        placeOfSupply: data.billing.placeOfSupply || '',
        taxMode: data.billing.taxMode || 'auto',
      });
    }
    if (data.cloudinary) {
      setCloudForm({
        cloudName: data.cloudinary.cloudName || '',
        apiKey: data.cloudinary.apiKey || '',
        apiSecret: '',
        enabled: data.cloudinary.enabled !== false,
      });
    }
  }, [data]);

  const invalidate = (res) => {
    queryClient.setQueryData(['super-admin', 'settings'], res.data.data);
  };

  const payMut = useMutation({
    mutationFn: updateSuperPaymentSettings,
    onSuccess: (res) => {
      invalidate(res);
      setMsg('Payment settings saved.');
      setError('');
      setPayForm((f) => ({ ...f, testKeySecret: '', liveKeySecret: '' }));
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Could not save payments');
      setMsg('');
    },
  });

  const smtpMut = useMutation({
    mutationFn: updateSuperSmtpSettings,
    onSuccess: (res) => {
      invalidate(res);
      setMsg('SMTP settings saved.');
      setError('');
      setSmtpForm((f) => ({ ...f, pass: '' }));
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Could not save SMTP');
      setMsg('');
    },
  });

  const companyMut = useMutation({
    mutationFn: updateSuperCompanySettings,
    onSuccess: (res) => {
      invalidate(res);
      setMsg('Company / invoice header saved.');
      setError('');
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Could not save company');
      setMsg('');
    },
  });

  const billingMut = useMutation({
    mutationFn: updateSuperBillingSettings,
    onSuccess: (res) => {
      invalidate(res);
      setMsg('GST / tax settings saved.');
      setError('');
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Could not save billing');
      setMsg('');
    },
  });

  const cloudMut = useMutation({
    mutationFn: updateSuperCloudinarySettings,
    onSuccess: (res) => {
      invalidate(res);
      setMsg('Cloudinary settings saved.');
      setError('');
      setCloudForm((f) => ({ ...f, apiSecret: '' }));
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Could not save Cloudinary');
      setMsg('');
    },
  });

  if (isLoading) return <Spinner label="Loading settings..." />;
  if (isError) return <ErrorBox message="Failed to load settings" />;

  const mode = data?.payments?.mode || 'mock';
  const testOn = data?.payments?.testMode !== false;

  return (
    <div>
      <PageHeader
        title="Platform Settings"
        subtitle="Categorized: Payments, Email, Invoice branding, GST, and Media. Secrets stay masked."
      />

      <EntityCard className="mb-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-muted">Payments</span>
          <StatusPill value={mode === 'razorpay' ? 'paid' : 'draft'} />
          <span className="capitalize text-brand">{mode}</span>
          <span className="text-muted">·</span>
          <span className={testOn ? 'text-amber-800' : 'text-emerald-800'}>
            {testOn ? 'Test mode ON' : 'Live mode'}
          </span>
          <span className="text-muted">·</span>
          <span className="text-muted">
            SMTP {data?.smtp?.configured ? 'configured' : 'demo / not set'}
          </span>
        </div>
      </EntityCard>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-line pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setMsg('');
              setError('');
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-brand text-white'
                : 'bg-mist text-brand hover:bg-sand'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Flash ok={msg} err={error} />

      {tab === 'payments' ? (
        <form
          className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            payMut.mutate({
              testMode: payForm.testMode,
              testKeyId: payForm.testKeyId.trim(),
              testKeySecret: payForm.testKeySecret.trim(),
              liveKeyId: payForm.liveKeyId.trim(),
              liveKeySecret: payForm.liveKeySecret.trim(),
              enabled: payForm.enabled,
              allowDemoPay: payForm.allowDemoPay,
              refundHoldDays: Number(payForm.refundHoldDays) || 0,
              holdStartMode: payForm.holdStartMode,
              couponAdminBearPercent: Number(payForm.couponAdminBearPercent),
              couponDeveloperBearPercent: Number(payForm.couponDeveloperBearPercent),
              maxPayoutRequestsPerDay: Number(payForm.maxPayoutRequestsPerDay) || 3,
              maxPayoutAmount: Number(payForm.maxPayoutAmount) || 0,
              provider: payForm.enabled ? 'razorpay' : 'mock',
            });
          }}
        >
          <h2 className="font-display text-lg font-semibold text-brand">Razorpay</h2>
          <p className="text-sm text-muted">
            Keep <strong>Test mode ON</strong> until Razorpay live keys are approved after deploy.
            Turn Test mode OFF when you switch to live Key ID / Secret.
          </p>

          <label className="flex items-center gap-2 text-sm text-brand">
            <input
              type="checkbox"
              checked={payForm.testMode}
              onChange={(e) => setPayForm((f) => ({ ...f, testMode: e.target.checked }))}
            />
            Test mode {payForm.testMode ? '(using test keys)' : 'OFF — using live keys'}
          </label>

          <label className="flex items-center gap-2 text-sm text-brand">
            <input
              type="checkbox"
              checked={payForm.enabled}
              onChange={(e) => setPayForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            Enable Razorpay payments
          </label>

          <label className="flex items-center gap-2 text-sm text-brand">
            <input
              type="checkbox"
              checked={payForm.allowDemoPay}
              onChange={(e) => setPayForm((f) => ({ ...f, allowDemoPay: e.target.checked }))}
            />
            Allow Demo Pay (mock / test checkout)
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="text-sm font-semibold text-brand">Test keys</div>
              <Field label="Test Key ID (rzp_test_…)">
                <input
                  className={inputCls}
                  value={payForm.testKeyId}
                  onChange={(e) => setPayForm((f) => ({ ...f, testKeyId: e.target.value }))}
                  autoComplete="off"
                />
              </Field>
              <Field
                label="Test Key Secret"
                hint={
                  data?.payments?.hasTestSecret
                    ? `On file: ${data.payments.testKeySecretMasked}`
                    : 'No test secret stored'
                }
              >
                <input
                  type="password"
                  className={inputCls}
                  value={payForm.testKeySecret}
                  onChange={(e) => setPayForm((f) => ({ ...f, testKeySecret: e.target.value }))}
                  placeholder="Leave blank to keep"
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="text-sm font-semibold text-brand">Live keys</div>
              <Field label="Live Key ID (rzp_live_…)">
                <input
                  className={inputCls}
                  value={payForm.liveKeyId}
                  onChange={(e) => setPayForm((f) => ({ ...f, liveKeyId: e.target.value }))}
                  autoComplete="off"
                />
              </Field>
              <Field
                label="Live Key Secret"
                hint={
                  data?.payments?.hasLiveSecret
                    ? `On file: ${data.payments.liveKeySecretMasked}`
                    : 'Add after Razorpay approval'
                }
              >
                <input
                  type="password"
                  className={inputCls}
                  value={payForm.liveKeySecret}
                  onChange={(e) => setPayForm((f) => ({ ...f, liveKeySecret: e.target.value }))}
                  placeholder="Leave blank to keep"
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Refund / hold days">
              <input
                type="number"
                min="0"
                max="90"
                className={inputCls}
                value={payForm.refundHoldDays}
                onChange={(e) => setPayForm((f) => ({ ...f, refundHoldDays: e.target.value }))}
              />
            </Field>
            <Field label="Hold starts from">
              <select
                className={inputCls}
                value={payForm.holdStartMode}
                onChange={(e) => setPayForm((f) => ({ ...f, holdStartMode: e.target.value }))}
              >
                <option value="from_payment">Payment date</option>
                <option value="from_delivery">Delivery date</option>
              </select>
            </Field>
            <Field label="Max payout requests / 24h (fraud limit)">
              <input
                type="number"
                min="1"
                max="50"
                className={inputCls}
                value={payForm.maxPayoutRequestsPerDay}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, maxPayoutRequestsPerDay: e.target.value }))
                }
              />
            </Field>
            <Field label="Max single payout amount (INR, 0 = no limit)">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={payForm.maxPayoutAmount}
                onChange={(e) => setPayForm((f) => ({ ...f, maxPayoutAmount: e.target.value }))}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-line bg-mist p-4">
            <div className="mb-2 text-sm font-semibold text-brand">Coupon discount split</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Platform bear %">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={inputCls}
                  value={payForm.couponAdminBearPercent}
                  onChange={(e) => {
                    const a = Number(e.target.value) || 0;
                    setPayForm((f) => ({
                      ...f,
                      couponAdminBearPercent: a,
                      couponDeveloperBearPercent: Math.max(0, 100 - a),
                    }));
                  }}
                />
              </Field>
              <Field label="Developer bear %">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={inputCls}
                  value={payForm.couponDeveloperBearPercent}
                  onChange={(e) => {
                    const d = Number(e.target.value) || 0;
                    setPayForm((f) => ({
                      ...f,
                      couponDeveloperBearPercent: d,
                      couponAdminBearPercent: Math.max(0, 100 - d),
                    }));
                  }}
                />
              </Field>
            </div>
          </div>

          <SoftButton type="submit" variant="primary" disabled={payMut.isPending}>
            {payMut.isPending ? 'Saving…' : 'Save payment settings'}
          </SoftButton>
        </form>
      ) : null}

      {tab === 'email' ? (
        <form
          className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            smtpMut.mutate({
              enabled: smtpForm.enabled,
              host: smtpForm.host.trim(),
              port: Number(smtpForm.port) || 587,
              secure: smtpForm.secure,
              user: smtpForm.user.trim(),
              pass: smtpForm.pass.trim(),
              fromName: smtpForm.fromName.trim(),
              fromEmail: smtpForm.fromEmail.trim(),
            });
          }}
        >
          <h2 className="font-display text-lg font-semibold text-brand">SMTP / transactional email</h2>
          <p className="text-sm text-muted">
            Used for payment receipts, invoice notices, and abandoned-quote reminders. Leave password
            blank to keep the existing value. Without SMTP, emails log to the server console (demo).
          </p>
          <label className="flex items-center gap-2 text-sm text-brand">
            <input
              type="checkbox"
              checked={smtpForm.enabled}
              onChange={(e) => setSmtpForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            Enable SMTP
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Host">
              <input
                className={inputCls}
                value={smtpForm.host}
                onChange={(e) => setSmtpForm((f) => ({ ...f, host: e.target.value }))}
                placeholder="smtp.gmail.com"
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                className={inputCls}
                value={smtpForm.port}
                onChange={(e) => setSmtpForm((f) => ({ ...f, port: e.target.value }))}
              />
            </Field>
            <Field label="Username">
              <input
                className={inputCls}
                value={smtpForm.user}
                onChange={(e) => setSmtpForm((f) => ({ ...f, user: e.target.value }))}
              />
            </Field>
            <Field
              label="Password"
              hint={data?.smtp?.hasPass ? `On file: ${data.smtp.passMasked}` : 'Not set'}
            >
              <input
                type="password"
                className={inputCls}
                value={smtpForm.pass}
                onChange={(e) => setSmtpForm((f) => ({ ...f, pass: e.target.value }))}
                placeholder="Leave blank to keep"
                autoComplete="new-password"
              />
            </Field>
            <Field label="From name">
              <input
                className={inputCls}
                value={smtpForm.fromName}
                onChange={(e) => setSmtpForm((f) => ({ ...f, fromName: e.target.value }))}
              />
            </Field>
            <Field label="From email">
              <input
                className={inputCls}
                value={smtpForm.fromEmail}
                onChange={(e) => setSmtpForm((f) => ({ ...f, fromEmail: e.target.value }))}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-brand">
            <input
              type="checkbox"
              checked={smtpForm.secure}
              onChange={(e) => setSmtpForm((f) => ({ ...f, secure: e.target.checked }))}
            />
            Use TLS/SSL (secure)
          </label>
          <SoftButton type="submit" variant="primary" disabled={smtpMut.isPending}>
            {smtpMut.isPending ? 'Saving…' : 'Save email settings'}
          </SoftButton>
        </form>
      ) : null}

      {tab === 'invoice' ? (
        <form
          className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            companyMut.mutate(companyForm);
          }}
        >
          <h2 className="font-display text-lg font-semibold text-brand">
            Company details (Tax Invoice header)
          </h2>
          <p className="text-sm text-muted">
            These appear on professional invoices. Client bill-to comes from the order. GST type
            (CGST+SGST vs IGST) is derived from GSTIN state codes when tax mode is Auto.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Legal name">
              <input
                className={inputCls}
                value={companyForm.legalName}
                onChange={(e) => setCompanyForm((f) => ({ ...f, legalName: e.target.value }))}
              />
            </Field>
            <Field label="Trade name (invoice title)">
              <input
                className={inputCls}
                value={companyForm.tradeName}
                onChange={(e) => setCompanyForm((f) => ({ ...f, tradeName: e.target.value }))}
              />
            </Field>
            <Field label="Registered address">
              <textarea
                className={inputCls}
                rows={2}
                value={companyForm.registeredAddress}
                onChange={(e) =>
                  setCompanyForm((f) => ({ ...f, registeredAddress: e.target.value }))
                }
              />
            </Field>
            <div className="space-y-3">
              <Field label="Phone">
                <input
                  className={inputCls}
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputCls}
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, email: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="GSTIN">
              <input
                className={inputCls}
                value={companyForm.gstin}
                onChange={(e) => setCompanyForm((f) => ({ ...f, gstin: e.target.value }))}
              />
            </Field>
            <Field label="PAN">
              <input
                className={inputCls}
                value={companyForm.pan}
                onChange={(e) => setCompanyForm((f) => ({ ...f, pan: e.target.value }))}
              />
            </Field>
            <Field label="State code (auto from GSTIN if empty)">
              <input
                className={inputCls}
                value={companyForm.stateCode}
                onChange={(e) => setCompanyForm((f) => ({ ...f, stateCode: e.target.value }))}
              />
            </Field>
            <Field label="State name">
              <input
                className={inputCls}
                value={companyForm.stateName}
                onChange={(e) => setCompanyForm((f) => ({ ...f, stateName: e.target.value }))}
              />
            </Field>
            <Field label="Invoice prefix">
              <input
                className={inputCls}
                value={companyForm.invoicePrefix}
                onChange={(e) => setCompanyForm((f) => ({ ...f, invoicePrefix: e.target.value }))}
              />
            </Field>
          </div>
          <h3 className="pt-2 text-sm font-semibold text-brand">Bank details (on invoice)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bank name">
              <input
                className={inputCls}
                value={companyForm.bankName}
                onChange={(e) => setCompanyForm((f) => ({ ...f, bankName: e.target.value }))}
              />
            </Field>
            <Field label="Account name">
              <input
                className={inputCls}
                value={companyForm.accountName}
                onChange={(e) => setCompanyForm((f) => ({ ...f, accountName: e.target.value }))}
              />
            </Field>
            <Field label="Account number">
              <input
                className={inputCls}
                value={companyForm.accountNumber}
                onChange={(e) => setCompanyForm((f) => ({ ...f, accountNumber: e.target.value }))}
              />
            </Field>
            <Field label="Account type">
              <input
                className={inputCls}
                value={companyForm.accountType}
                onChange={(e) => setCompanyForm((f) => ({ ...f, accountType: e.target.value }))}
              />
            </Field>
            <Field label="IFSC">
              <input
                className={inputCls}
                value={companyForm.ifsc}
                onChange={(e) => setCompanyForm((f) => ({ ...f, ifsc: e.target.value }))}
              />
            </Field>
            <Field label="Branch">
              <input
                className={inputCls}
                value={companyForm.branch}
                onChange={(e) => setCompanyForm((f) => ({ ...f, branch: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Invoice notes / terms">
            <textarea
              className={inputCls}
              rows={4}
              value={companyForm.invoiceNotes}
              onChange={(e) => setCompanyForm((f) => ({ ...f, invoiceNotes: e.target.value }))}
            />
          </Field>
          <SoftButton type="submit" variant="primary" disabled={companyMut.isPending}>
            {companyMut.isPending ? 'Saving…' : 'Save company / invoice'}
          </SoftButton>
        </form>
      ) : null}

      {tab === 'billing' ? (
        <form
          className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            billingMut.mutate({
              platformGstin: billingForm.platformGstin.trim(),
              defaultTaxPercent: Number(billingForm.defaultTaxPercent) || 0,
              defaultHsnSac: billingForm.defaultHsnSac.trim(),
              placeOfSupply: billingForm.placeOfSupply.trim(),
              taxMode: billingForm.taxMode,
            });
          }}
        >
          <h2 className="font-display text-lg font-semibold text-brand">GST / Tax defaults</h2>
          <p className="text-sm text-muted">
            Customer se GST alag nahi lete — listed price hi unka final payment hai. Invoice pe GST
            (CGST+SGST ya IGST) paid amount se extract hota hai. GST cost platform aur developer ke
            share se proportion me kat-ti hai. Round-off har invoice pe nearest INR.
          </p>
          <Field label="Platform GSTIN (synced with company)">
            <input
              className={inputCls}
              value={billingForm.platformGstin}
              onChange={(e) => setBillingForm((f) => ({ ...f, platformGstin: e.target.value }))}
            />
          </Field>
          <Field label="Default tax %">
            <input
              type="number"
              min={0}
              max={40}
              className={inputCls}
              value={billingForm.defaultTaxPercent}
              onChange={(e) =>
                setBillingForm((f) => ({ ...f, defaultTaxPercent: e.target.value }))
              }
            />
          </Field>
          <Field label="Default HSN/SAC">
            <input
              className={inputCls}
              value={billingForm.defaultHsnSac}
              onChange={(e) => setBillingForm((f) => ({ ...f, defaultHsnSac: e.target.value }))}
            />
          </Field>
          <Field label="Place of supply (label)">
            <input
              className={inputCls}
              value={billingForm.placeOfSupply}
              onChange={(e) => setBillingForm((f) => ({ ...f, placeOfSupply: e.target.value }))}
            />
          </Field>
          <Field label="Tax mode">
            <select
              className={inputCls}
              value={billingForm.taxMode}
              onChange={(e) => setBillingForm((f) => ({ ...f, taxMode: e.target.value }))}
            >
              <option value="auto">Auto (from GSTIN state codes)</option>
              <option value="same_state">Force same state (CGST + SGST)</option>
              <option value="interstate">Force interstate (IGST)</option>
            </select>
          </Field>
          <SoftButton type="submit" variant="primary" disabled={billingMut.isPending}>
            {billingMut.isPending ? 'Saving…' : 'Save GST settings'}
          </SoftButton>
        </form>
      ) : null}

      {tab === 'media' ? (
        <form
          className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            cloudMut.mutate({
              cloudName: cloudForm.cloudName.trim(),
              apiKey: cloudForm.apiKey.trim(),
              apiSecret: cloudForm.apiSecret.trim(),
              enabled: cloudForm.enabled,
            });
          }}
        >
          <h2 className="font-display text-lg font-semibold text-brand">Cloudinary</h2>
          <label className="flex items-center gap-2 text-sm text-brand">
            <input
              type="checkbox"
              checked={cloudForm.enabled}
              onChange={(e) => setCloudForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            Enable Cloudinary uploads
          </label>
          <Field label="Cloud name">
            <input
              className={inputCls}
              value={cloudForm.cloudName}
              onChange={(e) => setCloudForm((f) => ({ ...f, cloudName: e.target.value }))}
            />
          </Field>
          <Field label="API Key">
            <input
              className={inputCls}
              value={cloudForm.apiKey}
              onChange={(e) => setCloudForm((f) => ({ ...f, apiKey: e.target.value }))}
            />
          </Field>
          <Field
            label="API Secret"
            hint={
              data?.cloudinary?.hasSecret
                ? `On file: ${data.cloudinary.apiSecretMasked}`
                : 'Not set'
            }
          >
            <input
              type="password"
              className={inputCls}
              value={cloudForm.apiSecret}
              onChange={(e) => setCloudForm((f) => ({ ...f, apiSecret: e.target.value }))}
              placeholder="Leave blank to keep"
              autoComplete="new-password"
            />
          </Field>
          <SoftButton type="submit" variant="primary" disabled={cloudMut.isPending}>
            {cloudMut.isPending ? 'Saving…' : 'Save media settings'}
          </SoftButton>
        </form>
      ) : null}
    </div>
  );
}
