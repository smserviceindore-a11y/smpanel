/**
 * Automated API smoke tests for Phase 1 backend.
 * Usage: npm run test:api
 * Requires: server running on PORT (default 5001)
 */
require('dotenv').config();

const BASE = `http://localhost:${process.env.PORT || 5001}/api`;

let passed = 0;
let failed = 0;
const failures = [];

const request = async (method, path, { body, token, formData } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !formData) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body && !formData) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
};

const assert = (name, condition, detail = '') => {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const run = async () => {
  if (process.env.SKIP_API_TESTS === '1') {
    console.log('SKIP_API_TESTS=1 — skipping API smoke tests');
    process.exit(0);
  }

  console.log(`\n=== SM Global Hub API Tests ===`);
  console.log(`Base: ${BASE}\n`);

  // 1. Health
  console.log('1. Health');
  {
    let health;
    try {
      health = await request('GET', '/health');
    } catch (err) {
      console.log(`  ⚠️  API not reachable (${err.message})`);
      if (process.env.CI === 'true') {
        console.log('Skipping remaining tests (no API service in this CI job).');
        process.exit(0);
      }
      console.error('Start the backend (npm run dev) then re-run npm run test:api');
      process.exit(1);
    }
    assert('Health returns 200', health.status === 200 && health.data?.success === true);
  }

  // 2. Categories
  console.log('\n2. Categories');
  let categoryId = null;
  {
    const { data } = await request('GET', '/categories');
    assert('Categories list success', data?.success === true);
    assert('Has categories', Array.isArray(data?.data) && data.data.length >= 1);
    categoryId = data?.data?.[0]?._id;
  }

  // 3. Projects public
  console.log('\n3. Public Projects');
  let projectId = null;
  let projectSlug = null;
  {
    const all = await request('GET', '/projects?limit=50');
    assert('Projects list success', all.data?.success === true);
    assert('Has projects', all.data?.pagination?.total >= 1, `total=${all.data?.pagination?.total}`);

    const featured = await request('GET', '/projects/featured');
    assert('Featured success', featured.data?.success === true);
    assert('Featured has items', featured.data?.data?.length >= 1);

    const company = await request('GET', '/projects?ownerType=company');
    assert('Company filter', company.data?.data?.every((p) => p.ownerType === 'company'));

    const developer = await request('GET', '/projects?ownerType=developer');
    assert('Developer filter', developer.data?.data?.every((p) => p.ownerType === 'developer'));

    const search = await request('GET', '/projects?search=crm');
    assert('Search works', search.data?.success === true);

    const sample = all.data?.data?.[0];
    projectId = sample?._id;
    projectSlug = sample?.slug;

    const detail = await request('GET', `/projects/${projectSlug}`);
    assert('Detail by slug', detail.data?.success === true && detail.data?.data?.slug === projectSlug);
    assert(
      'Detail has HTML description',
      typeof detail.data?.data?.description === 'string' &&
        detail.data.data.description.includes('<h1>')
    );
    assert(
      'Demo credentials hidden publicly',
      !('demoCredentials' in (detail.data?.data || {}))
    );

    const view = await request('POST', `/projects/${projectId}/view`);
    assert('View increment', view.data?.success === true && typeof view.data?.data?.views === 'number');
  }

  // 4. Auth
  console.log('\n4. Auth');
  let token = null;
  {
    const bad = await request('POST', '/auth/login', {
      body: { email: 'wrong@test.com', password: 'wrong' },
    });
    assert('Invalid login rejected', bad.data?.success === false);

    const login = await request('POST', '/auth/login', {
      body: { email: process.env.ADMIN_EMAIL || 'admin@smglobal.com', password: process.env.ADMIN_PASSWORD || 'SmGlobal@2026' },
    });
    assert('Admin login success', login.data?.success === true && !!login.data?.data?.token);
    token = login.data?.data?.token;

    const me = await request('GET', '/auth/me', { token });
    assert('Auth me success', me.data?.success === true && me.data?.data?.email);

    const noToken = await request('GET', '/admin/dashboard');
    assert('Admin blocked without token', noToken.data?.success === false || noToken.status === 401);
  }

  // 5. Forms
  console.log('\n5. Public Forms');
  {
    const invalid = await request('POST', '/requirements', {
      body: { name: '', email: 'bad' },
    });
    assert('Requirement validation', invalid.data?.success === false);

    const req = await request('POST', '/requirements', {
      body: {
        name: 'API Test Client',
        email: `apitest${Date.now()}@test.com`,
        mobile: '9999999999',
        industry: 'Manufacturing',
        projectType: 'ERP',
        modules: ['Inventory', 'Production'],
        needsERP: true,
        budget: '200000',
        timeline: '2 months',
      },
    });
    assert('Requirement submit', req.data?.success === true && !!req.data?.data?.leadId);
    assert(
      'Recommendations returned',
      Array.isArray(req.data?.data?.recommendedProjects)
    );

    const cust = await request('POST', '/customization-requests', {
      body: {
        name: 'API Custom User',
        email: `custom${Date.now()}@test.com`,
        mobile: '8888888888',
        projectId,
        selectedModules: ['Payroll'],
        budget: '100000',
        timeline: '30 days',
      },
    });
    assert('Customization submit', cust.data?.success === true && !!cust.data?.data?.leadId);
  }

  // 6. Admin
  console.log('\n6. Admin APIs');
  let tempProjectId = null;
  {
    const dash = await request('GET', '/admin/dashboard', { token });
    assert('Dashboard stats', dash.data?.success === true && dash.data?.data?.projects);

    const adminProjects = await request('GET', '/admin/projects', { token });
    assert('Admin projects list', adminProjects.data?.success === true);

    const adminCats = await request('GET', '/admin/categories', { token });
    assert('Admin categories list', adminCats.data?.success === true);

    const create = await request('POST', '/admin/projects', {
      token,
      body: {
        title: `API Temp ${Date.now()}`,
        shortDescription: 'Temporary test project — safe to delete',
        description: '<h1>Temp</h1><p>Automated test project</p>',
        category: categoryId,
        industry: 'Test',
        projectType: 'SaaS',
        technologies: ['Node.js'],
        features: ['Test'],
        status: 'draft',
        ownerType: 'company',
        customizable: true,
      },
    });
    assert('Admin create project', create.data?.success === true && !!create.data?.data?._id);
    tempProjectId = create.data?.data?._id;

    if (tempProjectId) {
      const status = await request('PATCH', `/admin/projects/${tempProjectId}/status`, {
        token,
        body: { status: 'published', featured: false },
      });
      assert('Admin update status', status.data?.success === true && status.data?.data?.status === 'published');

      const update = await request('PUT', `/admin/projects/${tempProjectId}`, {
        token,
        body: { shortDescription: 'Updated by API test' },
      });
      assert('Admin update project', update.data?.success === true);

      const del = await request('DELETE', `/admin/projects/${tempProjectId}`, { token });
      assert('Admin delete project', del.data?.success === true);
    }

    const requirements = await request('GET', '/admin/requirements', { token });
    assert('Admin requirements list', requirements.data?.success === true);

    if (requirements.data?.data?.[0]?._id) {
      const rid = requirements.data.data[0]._id;
      const patch = await request('PATCH', `/admin/requirements/${rid}/status`, {
        token,
        body: { status: 'contacted', adminNotes: 'API test note' },
      });
      assert('Admin requirement status', patch.data?.success === true);
    }

    const customs = await request('GET', '/admin/customization-requests', { token });
    assert('Admin customizations list', customs.data?.success === true);

    if (customs.data?.data?.[0]?._id) {
      const cid = customs.data.data[0]._id;
      const patch = await request('PATCH', `/admin/customization-requests/${cid}/status`, {
        token,
        body: { status: 'contacted' },
      });
      assert('Admin customization status', patch.data?.success === true);
    }
  }

  // 7. Upload (expected failure without file / cloud name)
  console.log('\n7. Upload');
  {
    const img = await request('POST', '/upload/image', { token });
    assert(
      'Upload image without file fails safely',
      img.data?.success === false
    );
  }

  // Summary
  console.log('\n=== RESULT ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(` - ${f}`));
  }
  console.log('');
  process.exit(failed > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Test runner crashed:', err.message);
  process.exit(1);
});
