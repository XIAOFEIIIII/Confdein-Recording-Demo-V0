import { JournalEntry, Devotional, PrayerRequest } from '../types';
import { subDays, subHours } from 'date-fns';
import type { CurrentUserId, UserProfile } from '../types';

// Base "now" in 2026, evening (9 PM) so most timestamps fall in the evening
const now = new Date(2026, 0, 26, 21, 0, 0).getTime();

export interface UserInitialData {
  entries: JournalEntry[];
  devotional: Devotional | null;
  verses: Array<{ verse: string; reference: string }>;
  avatarSeed: string;
  /** Optional custom avatar image (e.g. /avatars/erica.jpg). When set, used instead of DiceBear. */
  avatarUrl?: string;
}

const ERICA_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    timestamp: now - 1000 * 60 * 30,
    transcript: "Jesus and sexual purity\n\nJesus took the issue of sexual purity further when he said that anyone who even looks at a woman with lust has already committed adultery in his heart. Similarly, we should avoid entertaining or fantasizing about what God has forbidden.\n\nLove fulfills the requirements of the commandments.",
    summary: "Jesus on purity and love fulfilling the law.",
    keywords: ["purity", "lust", "love", "commandments"],
    mood: 'peaceful',
    scripture: 'Lev 18:5, 20',
  },
  {
    id: 'entry-2',
    timestamp: now - 1000 * 60 * 60 * 3,
    transcript: "Respect for the elderly\n\nPeople often find it easy to dismiss the opinions of the elderly and avoid taking time to visit with them. But the fact that God commanded the Israelites to show respect for the elderly shows how seriously we should take the responsibility of respecting those older than we are. Their wisdom gained from experience can save us from many pitfalls.",
    summary: "Honoring the elderly and valuing their wisdom.",
    keywords: ["elderly", "respect", "wisdom", "honor"],
    mood: 'hopeful',
    scripture: 'Lev 19:32',
    prayerRequests: [
      {
        id: 'pr-1',
        personName: 'Grandma',
        request: 'Help me visit and honor my elders with patience and listen to their wisdom.',
        status: 'active',
        createdAt: now - 1000 * 60 * 60 * 2,
      },
    ],
  },
  {
    id: 'entry-3',
    timestamp: subHours(now, 24).getTime(),
    transcript: "Child sacrifice\n\nSacrificing children to the gods was a common practice in ancient religions. The Ammonites, Israel's neighbors, made child sacrifices to Molech (their national god) as part of their religion. They and other surrounding pagan nations saw their children as the greatest gift they could offer to ward off evil or appease angry gods. God made it clear that this practice was detestable and strictly forbidden. In Old Testament times, just as today, His character made human sacrifice unthinkable.\n\nUnlike the pagan gods, He is a God of love, who does not need to be appeased.\nHe is a God of life, who prohibits murder and encourages practices that lead to health and happiness.\nHe is a God of the helpless, who shows special concern for children.\nHe is a God of unselfishness, who, instead of demanding human sacrifices, sacrificed Himself for us.",
    summary: "God's character versus pagan sacrifice; His care for the helpless.",
    keywords: ["sacrifice", "Molech", "children", "God's character"],
    mood: 'grateful',
    scripture: 'Lev 18:21; 20:2–5',
  },
  {
    id: 'entry-4',
    timestamp: subHours(now, 26).getTime(), // Jan 25 ~19:00
    transcript: "Summarizing the law\n\nSome people think the Bible is nothing but a book of rules. But Jesus neatly summarized all these rules when he said to love God with all your heart, and to love your neighbor as yourself. He called these the greatest commandments (or rules) of all. By carrying out Jesus' simple commands, we find ourselves following all of God's other laws as well.",
    summary: "Jesus' summary: love God and love your neighbor.",
    keywords: ["law", "commandments", "love", "Jesus"],
    mood: 'peaceful',
    scripture: 'Lev 19:18',
  },
  {
    id: 'entry-5',
    timestamp: subDays(now, 2).getTime(),
    transcript: "Foreigners and compassion\n\nHow do you feel when you encounter foreigners, especially those who don't speak your language? Are you impatient? Do you think or act as if they should go back to where they came from? Are you tempted to take advantage of them? God says to treat foreigners as you'd treat fellow citizens, to love them as you love yourself. In reality, we are all foreigners in this world because it is only our temporary home. View your interactions with strangers, newcomers, and foreigners as opportunities to demonstrate God's love.",
    summary: "Treating foreigners with compassion as God commands.",
    keywords: ["foreigners", "compassion", "love", "strangers"],
    mood: 'hopeful',
    scripture: 'Lev 19:33–34',
    prayerRequests: [
      {
        id: 'pr-2',
        personName: 'New neighbors',
        request: 'Give me a heart to welcome and love newcomers and foreigners as You do.',
        status: 'active',
        createdAt: subDays(now, 2).getTime() - 1000 * 60 * 60 * 2,
      },
    ],
  },
  {
    id: 'entry-6',
    timestamp: subDays(now, 2).getTime() - 1000 * 60 * 60 * 3, // Jan 24 18:00
    transcript: "THE OCCULT\n\nEveryone is interested in what the future holds, and we often look to others for guidance. But God warned about looking to the occult for advice. Mediums and spiritists were outlawed because God was not the source of their information. At best, occult practitioners are fakes whose predictions cannot be trusted. At worst, they are in contact with evil spirits and are thus extremely dangerous. We don't need to look to the occult for information about the future. God has given us the Bible so that we may obtain all the information we need—the Bible's teachings are trustworthy.",
    summary: "Avoiding the occult; trusting Scripture for the future.",
    keywords: ["occult", "mediums", "Bible", "future"],
    mood: 'peaceful',
    scripture: 'Lev 19:31; 20:6, 27',
  },
];

// Roman's journal entries (1/25, 1/26, 1/31, 2/1 — 2026). Titles have no dates; no title when it would be empty.
const ROMAN_ENTRIES: JournalEntry[] = [
  {
    id: 'roman-1',
    timestamp: new Date(2026, 0, 25, 18, 30).getTime(),
    transcript: "Sunday Service\n\nDoes more pleasure give more brokenness. More pleasure leads to wanting more. Never satisfied. Pleasure is a gift of grace that points us to eternity. We forget grace is something we don't deserve. We start working and think we deserve things.",
    summary: "Pleasure, grace, and deserving—Sunday service reflection.",
    keywords: ["pleasure", "grace", "brokenness", "eternity", "deserving"],
    mood: 'heavy',
  },
  {
    id: 'roman-2',
    timestamp: new Date(2026, 0, 26, 20, 15).getTime(),
    transcript: "Woke up today and blessed the Lord. Went to the gym then went to work. The Lord has blessed me w/ a job. No christians in sight. The Lord has been helping me stop lying due to people pleasing. Anytime I get the urge to say a lie I get convicted. Praying the Lord helps me wake up sooner. Tired now so going to sleep. Lord heal my cough also.",
    summary: "Blessing the Lord, job, stopping lying, conviction, prayers for sleep and healing.",
    keywords: ["blessing", "job", "lying", "people pleasing", "conviction", "healing"],
    mood: 'grateful',
    prayerRequests: [
      {
        id: 'roman-pr-1',
        personName: 'Self',
        request: 'Lord help me wake up sooner. Heal my cough.',
        status: 'active',
        createdAt: new Date(2026, 0, 26, 20, 0).getTime(),
      },
    ],
  },
  {
    id: 'roman-3',
    timestamp: new Date(2026, 0, 31, 21, 0).getTime(),
    transcript: "Went to a Christian event. Sang worship and heard testimonies. These people are famous yet still seek the Lord. Crazy people like that exist. God is so good! Got to meet them like Ahawty, Jack, BG, Athang , Tiff, KP. All cool people.",
    summary: "Christian event, worship, testimonies, famous people seeking the Lord.",
    keywords: ["worship", "testimonies", "Christian event", "community"],
    mood: 'grateful',
  },
  {
    id: 'roman-4',
    timestamp: new Date(2026, 1, 1, 22, 45).getTime(),
    transcript: "Sunday Service\n\nJesus tests us. He gives us things but not too easy so we need to rely on Him. As I pray I do not. Even if Jesus says NO keep praying. Mt 15:27 He could just be testing you to see if you want it bad enough.",
    summary: "Jesus tests us so we rely on Him; keep praying even if He says no.",
    keywords: ["testing", "rely on God", "prayer", "persistence"],
    mood: 'hopeful',
    scripture: 'Mt 15:27',
  },
];

const ERICA_DEVOTIONAL: Devotional = {
  verse: 'You shall not do as they do in the land of Egypt, where you lived, and you shall not do as they do in the land of Canaan, to which I am bringing you. You shall not walk in their statutes.',
  reference: 'Leviticus 18:3',
  quote: "Our problem with sex doesn't begin with lust, with bad choices, or with sexual misbehavior. Our problem with sex begins when we forget that God must be at the center of this part of our lives as he must be with any other' - Paul Tripp",
  reflection: `The importance of spirituality over sexuality

Israel's sexual morality is here portrayed as something that marks it off from its neighbors as the Lord's special people. Ch. 17 stressed that Israel was not to compromise her witness by worshipping demons or eating blood. Chapter 18 insists that certain standards of sexual morality are equally decisive marks of religious allegiance.

It is not surprising, then, that the section of Leviticus concerning the behavior of the Israelites should be peppered with a reminder of who they are, and who their God is. This identification of Yahweh as their God (and not any other) occurs more than thirty times in chapters 18–22!

Conformity and God's standards

God is talking with Moses about peer pressure. He is speaking to the people as creatures tempted to conform. God is speaking to them, and to us, as people for whom the question is not, "Will you or will you not conform?" Rather, the question is, "To what will you conform?" That's just how we are. We were designed to be led, to serve, to worship.

The issue here is specifically sexual conformity. The place from which they came, and the place to which they were going, both had practices, customs, perspectives, standards related to sexual behavior. The same is true for us today.

No matter where you are coming from or where you are going in our culture, you will always be surrounded by voices promoting practices, customs, perspectives, standards related to sexual behavior.

But as God makes clear to the Israelites in these verses, those standards will always be at odds with His standards; always, no matter the person, place, or period of time in question. Why? Because we live in a fallen world, a world in rebellion against God. In rejecting God, men and women have rejected God's design for their bodies and their lives.

Spirituality before sexuality

This is precisely why God is calling them in verses 4 and 5, to put spirituality before sexuality. That means answering those 'meaning of life' questions first, then letting the answers guide us in terms of all our feelings and desires, including sexual feelings and desires. We often reverse these two things, and thus, look for a system of meaning and morals that fits with our existing feelings and desires.

God declares three times in these five verses, "I am the LORD (Yahweh)", or "I am [Yahweh] your God". That is the starting point. The expression, "I am the LORD your God," is the fundamental truth on which the following verses, and on which the following chapters must stand.

God is orderly, and therefore He expects that His creation do all things "decently and in order" (1 Corinthians 14:40). God is not some kind of a cosmic drill sergeant who delights simply in giving orders; rather, our loving God gives us orders in order that we might have life, and that we might have it abundantly (John 10:10).`,
  prayer: `Lord, I thank you that you created human sexuality and said that it was very good. But man has corrupted it. Help me when I am living in this world with its different worldviews about sexuality, to make a difference. Amen.`,
  sections: [],
};

const ROMAN_DEVOTIONAL: Devotional = {
  verse: 'The fear of man lays a snare, but whoever trusts in the LORD is safe.',
  reference: 'Proverbs 29:25',
  title: 'Truth Over Approval',
  quote: 'Every time we choose approval over truth, we trade freedom for fear.',
  reflection: `There is a quiet battle many of us fight every day, often without naming it. It's the pull between being truthful and being liked. In moments when honesty feels risky, we learn to soften the truth, bend it slightly, or hide parts of ourselves—not to deceive maliciously, but to stay safe, accepted, and unchallenged.

But people-pleasing always comes at a cost. Every small lie asks us to trade a piece of our freedom for approval. Over time, we forget where the line is, and the life we present slowly drifts away from the life we're actually living. God's conviction interrupts this drift—not to shame us, but to bring us back into the light.

When the Spirit stops you before a lie leaves your mouth, that moment is sacred. It's an invitation to choose trust over control, truth over approval. Honesty may feel uncomfortable, but it creates space for real peace. God is not asking you to be impressive or well-liked. He is asking you to be free. And freedom begins the moment you decide that being known by God matters more than being approved by people.`,
  prayer: `Lord, help me choose truth when approval feels easier. Expose the places where fear of people has shaped my words, and replace that fear with trust in You. Teach me to live honestly before You and others, knowing that my security comes from You alone. Amen.`,
  sections: [],
};

/** Jan 25 — "When 'I Deserve' Takes Over" */
const ROMAN_DEVOTIONAL_2026_01_25: Devotional = {
  verse: 'What do you have that you did not receive? And if you did receive it, why do you boast as though you did not?',
  reference: '1 Corinthians 4:7',
  title: "When 'I Deserve' Takes Over",
  quote: 'Grace stops being grace the moment we think we deserve it.',
  reflection: `There's a quiet shift that can happen in the heart—almost without us noticing. We start with gratitude: "Lord, thank You." But over time, if we're not careful, gratitude can drift into entitlement: "Lord, I worked hard… so I should have this." And the moment "I deserve" becomes the soundtrack of our life, our joy becomes fragile. Pleasure stops being a gift and turns into a demand. We need more, we chase more, and somehow we're still not satisfied.

Grace tells a different story. Grace reminds us that life with God is not a paycheck; it's a relationship. Not a transaction; it's a gift. When we remember that everything we have is mercy, our hearts soften again. We can enjoy good things without worshiping them. We can work diligently without thinking God owes us. And when we don't get what we want, we don't spiral into bitterness—we return to trust.

Today, let grace reframe your expectations. Ask the Lord to expose the places where you've begun to keep score, to measure your worth by what you receive, or to demand what you were meant to receive with open hands. There is freedom in humility, and there is deep rest in remembering: He is good—even when He says "not yet."`,
  prayer: `Lord, forgive me for the ways I've turned Your gifts into expectations and Your grace into something I think I've earned. Soften my heart, reset my desires, and teach me to receive with gratitude instead of entitlement. Amen.`,
  sections: [],
};

/** Jan 31 — "Still Seeking" */
const ROMAN_DEVOTIONAL_2026_01_31: Devotional = {
  verse: 'Blessed are those who hunger and thirst for righteousness, for they shall be satisfied.',
  reference: 'Matthew 5:6',
  title: 'Still Seeking',
  quote: 'True maturity is not being known by many, but still choosing to seek God when you could rely on your name.',
  reflection: `It's easy to assume that spiritual hunger fades as success grows. We tell ourselves that those who are admired, influential, or celebrated must have somehow "arrived." But moments like this gently correct that assumption. Seeing people who are known by many still worship sincerely, still testify honestly, still seek the Lord with humility reminds us of something deeply important: knowing God is not a phase we outgrow.

True spiritual maturity is not measured by visibility, gifting, or recognition. It's revealed in dependence. The people who continue to seek God—not because they need exposure, but because they need Him—quietly model a faith that is rooted, not performative. Their lives testify that no amount of applause can replace the presence of God, and no platform can satisfy what only He can fill.

Let this moment reshape your imagination. Don't rush to admire people for who they are or what they've achieved. Instead, notice what sustains them. Let their continued hunger remind you that the goal of faith is not to be impressive, but to remain dependent. God is not looking for people who have outgrown their need for Him—He delights in those who never stop seeking.`,
  prayer: `Lord, protect my heart from mistaking visibility for maturity or admiration for fulfillment. Teach me to hunger for you above recognition, success, or approval. Let my faith be rooted in dependence, not performance, and keep me seeking you in every season of life. Amen.`,
  sections: [],
};

/** Feb 1 — "Even the Crumbs" */
const ROMAN_DEVOTIONAL_2026_02_01: Devotional = {
  verse: 'Yes, Lord, yet even the dogs eat the crumbs that fall from their masters\' table.',
  reference: 'Matthew 15:27',
  title: 'Even the Crumbs',
  quote: 'Faith does not insist on entitlement; it clings to mercy.',
  reflection: `There are moments in prayer when God's response feels sharp, distant, or even discouraging. Moments when His words don't sound like comfort, but like resistance. Matthew 15:27 places us right inside one of those moments. The woman has already been ignored, already been challenged, and still she stays. When Jesus' words seem to push her away, she does not argue her worth—she clings to His mercy.

Her reply is striking not because it is clever, but because it is humble. She does not demand a seat at the table. She does not insist on her rights. She asks only for the crumbs—trusting that even the smallest portion of Jesus' grace is enough to heal, to restore, to save. This is faith stripped of entitlement. Faith that no longer negotiates, but depends.

Sometimes God allows our prayers to be tested so that our motives can be revealed. Do we come to Him only when we expect full answers, immediate relief, and visible blessing? Or do we come because we believe that who He is—alone—is enough? This woman teaches us that true faith does not retreat when tested. It bows low, holds on tightly, and says: Even this is enough, if it comes from You.`,
  prayer: `Lord, when Your answers test my expectations, keep my heart from turning away. Teach me to trust that even the smallest measure of Your grace is enough for me. Strip me of entitlement, deepen my dependence, and help me remain humble and faithful when prayer feels costly. Amen.`,
  sections: [],
};

const ROMAN_DEVOTIONAL_BY_DATE: Record<string, Devotional> = {
  '2026-01-25': ROMAN_DEVOTIONAL_2026_01_25,
  '2026-01-31': ROMAN_DEVOTIONAL_2026_01_31,
  '2026-02-01': ROMAN_DEVOTIONAL_2026_02_01,
};

/** Get devotional for display; Roman uses date-specific when available, else default. */
export function getDevotionalForUserAndDate(userId: CurrentUserId, dateStr: string): Devotional | null {
  const u = USER_DATA[userId];
  if (!u.devotional) return null;
  if (userId === 'roman' && ROMAN_DEVOTIONAL_BY_DATE[dateStr]) return ROMAN_DEVOTIONAL_BY_DATE[dateStr];
  return u.devotional;
}

const ERICA_VERSES = [
  { verse: 'The Lord is my shepherd; I shall not want.', reference: 'Psalm 23:1' },
  { verse: 'Come to me, all who labor and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28' },
  { verse: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },
  { verse: 'My grace is sufficient for you, for my power is made perfect in weakness.', reference: '2 Corinthians 12:9' },
  { verse: 'Peace I leave with you; my peace I give to you.', reference: 'John 14:27' },
];

const ROMAN_VERSES = [
  { verse: 'The Lord is my strength and my song, and he has become my salvation.', reference: 'Exodus 15:2' },
  { verse: 'Be strong and courageous. Do not fear or be in dread of them, for it is the Lord your God who goes with you.', reference: 'Deuteronomy 31:6' },
  { verse: 'Trust in the Lord with all your heart, and do not lean on your own understanding.', reference: 'Proverbs 3:5' },
  { verse: 'I can do all things through him who strengthens me.', reference: 'Philippians 4:13' },
  { verse: 'The Lord will fight for you, and you have only to be still.', reference: 'Exodus 14:14' },
];

const USER_DATA: Record<CurrentUserId, UserInitialData> = {
  erica: {
    entries: ERICA_ENTRIES,
    devotional: ERICA_DEVOTIONAL,
    verses: ERICA_VERSES,
    avatarSeed: 'Erica',
    // Set avatarUrl to e.g. '/avatars/erica.jpg' (African woman, long hair) when you have the image in public/avatars/
    avatarUrl: undefined,
  },
  roman: {
    entries: ROMAN_ENTRIES,
    devotional: ROMAN_DEVOTIONAL,
    verses: ROMAN_VERSES,
    avatarSeed: 'Roman',
    // Set avatarUrl to e.g. '/avatars/roman.jpg' (Filipino male) when you have the image in public/avatars/
    avatarUrl: undefined,
  },
};

const DICEBEAR_NOTIONISTS = 'https://api.dicebear.com/7.x/notionists/svg';

/** Avatar URL: custom avatarUrl if set, else DiceBear notionists with seed (original style). */
export function getAvatarSrc(avatarUrl: string | undefined, avatarSeed: string): string {
  if (avatarUrl) return avatarUrl;
  return `${DICEBEAR_NOTIONISTS}?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=ffffff`;
}

export function getProfiles(): UserProfile[] {
  return [
    { id: 'erica', displayName: 'Erica', avatarSeed: USER_DATA.erica.avatarSeed, avatarUrl: USER_DATA.erica.avatarUrl },
    { id: 'roman', displayName: 'Roman', avatarSeed: USER_DATA.roman.avatarSeed, avatarUrl: USER_DATA.roman.avatarUrl },
  ];
}

const STORAGE_KEY = 'confidein_current_user';

export function getStoredUserId(): CurrentUserId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'erica' || raw === 'roman') return raw;
  } catch (_) {}
  return 'roman';
}

export function setStoredUserId(id: CurrentUserId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch (_) {}
}

export function getInitialDataForUser(userId: CurrentUserId): UserInitialData {
  const u = USER_DATA[userId];
  return {
    entries: [...u.entries],
    devotional: u.devotional ? { ...u.devotional } : null,
    verses: [...u.verses],
    avatarSeed: u.avatarSeed,
    avatarUrl: u.avatarUrl,
  };
}
