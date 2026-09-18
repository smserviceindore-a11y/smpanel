/**
 * Instant “SM Global Support Team” replies for college-demo live chat.
 */
const TEAM_NAME = 'SM Global Support Team';

const rules = [
  {
    test: /(pric|cost|budget|kitna|paisa|₹|rs\.?|fee)/i,
    reply:
      'Pricing project ke scope pe depend karti hai. Aap Projects page pe demo dekh sakte ho, ya “Submit requirement / Customize” se apni need bhejo — team quotation share karti hai.',
  },
  {
    test: /(demo|live|try|test)/i,
    reply:
      'Har project pe Live Demo milta hai. Projects → koi product open karke Demo button use karein. Login details project page pe dikhte hain jahan available hain.',
  },
  {
    test: /(buy|purchase|payment|pay|razorpay|invoice)/i,
    reply:
      'Ready products pe Buy Now / quotation accept karke Razorpay (test) se pay kar sakte ho. Payment ke baad invoice Client panel → Invoices me milta hai.',
  },
  {
    test: /(custom|customize|requirement|change|modify)/i,
    reply:
      'Customization ke liye project pe “Customize this project” ya site pe “Submit requirement” form bhar dein. Hamari ops team lead review karke contact karti hai.',
  },
  {
    test: /(developer|seller|list|upload|marketplace)/i,
    reply:
      'Developers marketplace me apne projects submit kar sakte hain (Developer login). Admin approval ke baad listing live hoti hai.',
  },
  {
    test: /(hello|hi|hey|namaste|hii)/i,
    reply:
      'Hello! Main SM Global support team se bol raha hoon. Projects, pricing, demo, payment ya customization — bataiye kis me help chahiye?',
  },
  {
    test: /(thank|thanks|ok|okay|great)/i,
    reply: 'Welcome! Aur kuch chahiye ho to yahin message kar dena — team yahi online hai.',
  },
  {
    test: /(contact|phone|email|call|number)/i,
    reply:
      'Aapka number/email is chat me save ho chuka hai. Contact page se bhi message bhej sakte ho — team follow-up karti hai.',
  },
];

const fallback =
  'Thanks for your message! Hamari team ne ye note kar liya. Jab tak detail review hota hai, aap Projects gallery explore kar sakte ho ya requirement form submit kar sakte ho. Aur details bhejein — hum turant help karenge.';

/** Max predefined auto replies per chat (welcome + keyword). Staff reply disables further. */
const MAX_AUTO_REPLIES = 2;

const buildTeamReply = (visitorText = '') => {
  const text = String(visitorText || '').trim();
  for (const rule of rules) {
    if (rule.test.test(text)) {
      return { senderName: TEAM_NAME, body: rule.reply };
    }
  }
  return { senderName: TEAM_NAME, body: fallback };
};

const welcomeMessage = (visitorName = '') => ({
  senderName: TEAM_NAME,
  body: `Namaste${visitorName ? ` ${visitorName}` : ''}! 👋 SM Global Support Team yahan hai. Projects, demos, pricing, payment ya customization — poochiye, hum turant reply karenge.`,
});

const isAutoSenderName = (name = '') =>
  String(name).trim().toLowerCase() === TEAM_NAME.toLowerCase();

/**
 * Infer flags for older sessions that predate autoReplyCount / humanReplied.
 */
const syncAutoState = (session) => {
  if (!session) return session;
  const msgs = session.messages || [];
  let autoCount = 0;
  let human = Boolean(session.humanReplied);
  for (const m of msgs) {
    if (m.sender !== 'team') continue;
    if (isAutoSenderName(m.senderName)) autoCount += 1;
    else human = true;
  }
  if (typeof session.autoReplyCount !== 'number' || session.autoReplyCount < autoCount) {
    session.autoReplyCount = autoCount;
  }
  if (human) session.humanReplied = true;
  return session;
};

/** Returns auto payload or null if capped / human already in chat */
const maybeBuildAutoReply = (session, visitorText = '') => {
  syncAutoState(session);
  if (session.humanReplied) return null;
  if ((session.autoReplyCount || 0) >= MAX_AUTO_REPLIES) return null;
  const auto = buildTeamReply(visitorText);
  session.autoReplyCount = (session.autoReplyCount || 0) + 1;
  return auto;
};

module.exports = {
  buildTeamReply,
  welcomeMessage,
  maybeBuildAutoReply,
  syncAutoState,
  TEAM_NAME,
  MAX_AUTO_REPLIES,
};
