/**
 * Assigns professional product-style cover images to all projects.
 * CodeCanyon/ThemeForest CDN is Cloudflare-blocked, so we use curated
 * Unsplash marketplace/dashboard imagery keyed by project type.
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Project = require('../models/Project');

const unsplash = (id, w = 1200, h = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const BY_TYPE = {
  erp: [
    unsplash('photo-1551288049-bebda4e38f71'),
    unsplash('photo-1460925895917-afdab827c52f'),
  ],
  crm: [
    unsplash('photo-1556761175-5973dc0f32e7'),
    unsplash('photo-1552664730-d307ca884978'),
  ],
  school: [
    unsplash('photo-1503676260728-1c00da094a0b'),
    unsplash('photo-1523240795612-9a054b0db644'),
  ],
  education: [
    unsplash('photo-1522202176988-66273c2fd55f'),
    unsplash('photo-1516321318423-f06f85e504b3'),
  ],
  ecommerce: [
    unsplash('photo-1556742049-0cfed4f6a45d'),
    unsplash('photo-1472851294608-062f824d29cc'),
  ],
  job: [
    unsplash('photo-1454165804606-c3d57bc86b40'),
    unsplash('photo-1521737711867-e3b97375f902'),
  ],
  resume: [
    unsplash('photo-1586281380349-632531db7ed4'),
    unsplash('photo-1434030216411-0b793f4b4173'),
  ],
  healthcare: [
    unsplash('photo-1576091160399-112ba8d25d1d'),
    unsplash('photo-1516549655169-df83a0774514'),
  ],
  mentorship: [
    unsplash('photo-1531482615713-2afd69097998'),
    unsplash('photo-1515187029135-18ee668f83d6'),
  ],
  default: [
    unsplash('photo-1498050108023-c5249f4df085'),
    unsplash('photo-1519389950473-47ba0277781c'),
  ],
};

function pickBucket(project) {
  const hay = `${project.title} ${project.projectType} ${project.industry}`.toLowerCase();
  if (/school|campus|college|lms|education|mentor|learning/.test(hay)) {
    if (/mentor/.test(hay)) return BY_TYPE.mentorship;
    if (/school|campus/.test(hay)) return BY_TYPE.school;
    return BY_TYPE.education;
  }
  if (/crm|pipeline|sales/.test(hay)) return BY_TYPE.crm;
  if (/erp|inventory|manufactur|invoice|accounting|hr /.test(hay)) return BY_TYPE.erp;
  if (/shop|e-?commerce|store|cart/.test(hay)) return BY_TYPE.ecommerce;
  if (/job|recruit|career|hiring/.test(hay)) return BY_TYPE.job;
  if (/resume|cv /.test(hay)) return BY_TYPE.resume;
  if (/health|hospital|clinic|patient|medicare/.test(hay)) return BY_TYPE.healthcare;
  return BY_TYPE.default;
}

const seedProjectImages = async () => {
  const projects = await Project.find();
  let updated = 0;

  for (const project of projects) {
    const imgs = pickBucket(project);
    const seed = String(project._id).slice(-6);
    project.screenshots = [
      { url: imgs[0], caption: 'Product preview', order: 0 },
      { url: imgs[1] || imgs[0], caption: 'Feature preview', order: 1 },
    ];
    // slight uniqueness via second image fallback already set
    if (!imgs[1]) {
      project.screenshots[1].url = unsplash('photo-1519389950473-47ba0277781c');
    }
    // tag for cache bust uniqueness on identical buckets
    project.screenshots[0].url += (project.screenshots[0].url.includes('?') ? '&' : '?') + `sig=${seed}`;
    await project.save();
    updated += 1;
    console.log('Image set:', project.title);
  }

  console.log(`\nUpdated screenshots on ${updated} projects`);
};

const run = async () => {
  try {
    await connectDB();
    await seedProjectImages();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

if (require.main === module) run();

module.exports = { seedProjectImages };
