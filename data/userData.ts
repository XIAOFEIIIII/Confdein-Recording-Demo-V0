import { JournalEntry, Devotional, PrayerRequest, PrayerReminderSettings, PrayerCompletionRecord } from '../types';
import type { CurrentUserId, UserProfile } from '../types';
import type { MoodLevel } from '../types';
import { subDays, subHours, startOfDay, addDays, format } from 'date-fns';

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

/** Simulate ring biometric detection for existing entries based on timestamp */
const detectMoodFromTimestamp = (timestamp: number): MoodLevel => {
  const hour = new Date(timestamp).getHours();
  const dayOfYear = Math.floor((timestamp - new Date(2026, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const seed = (hour * 7 + dayOfYear * 11) % 100;
  let baseMood: number;
  if (hour >= 6 && hour < 10) {
    baseMood = 1 + (seed % 3);
  } else if (hour >= 10 && hour < 15) {
    baseMood = 2 + (seed % 3);
  } else if (hour >= 15 && hour < 22) {
    baseMood = 3 + (seed % 3);
  } else {
    baseMood = 2 + (seed % 2);
  }
  return Math.max(1, Math.min(5, baseMood)) as MoodLevel;
};

/** Default morning/evening slots for backfilling prayer entries (same as getDefaultPrayerReminderSettings) */
const PRAYER_SLOTS = [
  { id: 'morning', label: 'Morning Prayer', hour: 7, minute: 0 },
  { id: 'evening', label: 'Evening Reflection', hour: 21, minute: 0 },
] as const;

function createPrayerEntryForSlot(
  slotId: string,
  label: string,
  date: Date,
  hour: number,
  minute: number,
  overrides?: Partial<JournalEntry>
): JournalEntry {
  const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0).getTime();
  return {
    id: overrides?.id ?? `prayer-${slotId}-${format(date, 'yyyy-MM-dd')}-${timestamp}`,
    timestamp,
    transcript: overrides?.transcript ?? '',
    summary: overrides?.summary ?? '',
    keywords: overrides?.keywords ?? [],
    moodLevel: (overrides?.moodLevel ?? detectMoodFromTimestamp(timestamp)) as MoodLevel,
    isPrayerEntry: true,
    prayerSlotId: slotId,
    ...overrides,
  };
}

/** Add Morning + Evening prayer entries for every day from fromDate through toDate if missing. */
function ensurePrayerEntriesForDates(
  entries: JournalEntry[],
  fromDate: Date,
  toDate: Date
): JournalEntry[] {
  const added: JournalEntry[] = [];
  const dayStart = startOfDay(fromDate);
  const dayEnd = startOfDay(toDate);
  for (let d = new Date(dayStart); d.getTime() <= dayEnd.getTime(); d = addDays(d, 1)) {
    const dateStr = format(d, 'yyyy-MM-dd');
    for (const slot of PRAYER_SLOTS) {
      const hasEntry = entries.some(
        (e) => e.isPrayerEntry && e.prayerSlotId === slot.id && format(new Date(e.timestamp), 'yyyy-MM-dd') === dateStr
      );
      if (!hasEntry) {
        added.push(createPrayerEntryForSlot(slot.id, slot.label, d, slot.hour, slot.minute));
      }
    }
  }
  if (added.length === 0) return entries;
  const merged = [...entries, ...added];
  merged.sort((a, b) => b.timestamp - a.timestamp);
  return merged;
}

// Erica: one topic per day across Jan 18–23 (plus prayer entries on 21 & 22)
const ERICA_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    timestamp: new Date(2026, 0, 23, 20, 30).getTime(),
    transcript: "Jesus and sexual purity\n\nJesus took the issue of sexual purity further when he said that anyone who even looks at a woman with lust has already committed adultery in his heart. Similarly, we should avoid entertaining or fantasizing about what God has forbidden.\n\nLove fulfills the requirements of the commandments.",
    summary: "Jesus on purity and love fulfilling the law.",
    keywords: ["sermon notes"],
    mood: 'peaceful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 23, 20, 30).getTime()),
    scripture: 'Lev 18:5, 20',
  },
  {
    id: 'entry-2',
    timestamp: new Date(2026, 0, 22, 18, 0).getTime(),
    transcript: "Respect for the elderly\n\nPeople often find it easy to dismiss the opinions of the elderly and avoid taking time to visit with them. But the fact that God commanded the Israelites to show respect for the elderly shows how seriously we should take the responsibility of respecting those older than we are. Their wisdom gained from experience can save us from many pitfalls.",
    summary: "Honoring the elderly and valuing their wisdom.",
    keywords: [],
    mood: 'hopeful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 22, 18, 0).getTime()),
    scripture: 'Lev 19:32',
    prayerRequests: [
      {
        id: 'pr-1',
        personName: 'Grandma',
        request: 'Help me visit and honor my elders with patience and listen to their wisdom.',
        status: 'active',
        createdAt: new Date(2026, 0, 22, 17, 0).getTime(),
        term: 'long',
      },
    ],
  },
  {
    id: 'entry-3',
    timestamp: new Date(2026, 0, 20, 20, 0).getTime(),
    transcript: "Child sacrifice\n\nSacrificing children to the gods was a common practice in ancient religions. The Ammonites, Israel's neighbors, made child sacrifices to Molech (their national god) as part of their religion. They and other surrounding pagan nations saw their children as the greatest gift they could offer to ward off evil or appease angry gods. God made it clear that this practice was detestable and strictly forbidden. In Old Testament times, just as today, His character made human sacrifice unthinkable.\n\nUnlike the pagan gods, He is a God of love, who does not need to be appeased.\nHe is a God of life, who prohibits murder and encourages practices that lead to health and happiness.\nHe is a God of the helpless, who shows special concern for children.\nHe is a God of unselfishness, who, instead of demanding human sacrifices, sacrificed Himself for us.",
    summary: "God's character versus pagan sacrifice; His care for the helpless.",
    keywords: ["sermon notes"],
    mood: 'grateful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 20, 20, 0).getTime()),
    scripture: 'Lev 18:21; 20:2–5',
  },
  {
    id: 'entry-4',
    timestamp: new Date(2026, 0, 21, 19, 0).getTime(),
    transcript: "Summarizing the law\n\nSome people think the Bible is nothing but a book of rules. But Jesus neatly summarized all these rules when he said to love God with all your heart, and to love your neighbor as yourself. He called these the greatest commandments (or rules) of all. By carrying out Jesus' simple commands, we find ourselves following all of God's other laws as well.",
    summary: "Jesus' summary: love God and love your neighbor.",
    keywords: [],
    mood: 'peaceful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 21, 19, 0).getTime()),
    scripture: 'Lev 19:18',
  },
  {
    id: 'entry-5',
    timestamp: new Date(2026, 0, 19, 19, 0).getTime(),
    transcript: "Foreigners and compassion\n\nHow do you feel when you encounter foreigners, especially those who don't speak your language? Are you impatient? Do you think or act as if they should go back to where they came from? Are you tempted to take advantage of them? God says to treat foreigners as you'd treat fellow citizens, to love them as you love yourself. In reality, we are all foreigners in this world because it is only our temporary home. View your interactions with strangers, newcomers, and foreigners as opportunities to demonstrate God's love.",
    summary: "Treating foreigners with compassion as God commands.",
    keywords: [],
    mood: 'hopeful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 19, 19, 0).getTime()),
    scripture: 'Lev 19:33–34',
    prayerRequests: [
      {
        id: 'pr-2',
        personName: 'New neighbors',
        request: 'Give me a heart to welcome and love newcomers and foreigners as You do.',
        status: 'active',
        createdAt: new Date(2026, 0, 19, 17, 0).getTime(),
        term: 'long',
      },
    ],
  },
  {
    id: 'entry-6',
    timestamp: new Date(2026, 0, 18, 18, 0).getTime(),
    transcript: "THE OCCULT\n\nEveryone is interested in what the future holds, and we often look to others for guidance. But God warned about looking to the occult for advice. Mediums and spiritists were outlawed because God was not the source of their information. At best, occult practitioners are fakes whose predictions cannot be trusted. At worst, they are in contact with evil spirits and are thus extremely dangerous. We don't need to look to the occult for information about the future. God has given us the Bible so that we may obtain all the information we need—the Bible's teachings are trustworthy.",
    summary: "Avoiding the occult; trusting Scripture for the future.",
    keywords: ["sermon notes"],
    mood: 'peaceful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 18, 18, 0).getTime()),
    scripture: 'Lev 19:31; 20:6, 27',
  },
  // Seed prayer entries (with content)
  {
    id: 'erica-prayer-morning-2026-01-21',
    timestamp: new Date(2026, 0, 21, 7, 0, 0).getTime(),
    transcript: "Started the day with gratitude. Asked for strength to love my neighbor and to be patient with the new people at work. Remembered Grandma—prayed for her health and for a visit soon.",
    summary: "Morning prayer: gratitude, neighbor love, Grandma.",
    keywords: [],
    mood: 'hopeful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 21, 7, 0, 0).getTime()) as MoodLevel,
    isPrayerEntry: true,
    prayerSlotId: 'morning',
  },
  {
    id: 'erica-prayer-evening-2026-01-22',
    timestamp: new Date(2026, 0, 22, 21, 0, 0).getTime(),
    transcript: "Quiet reflection before bed. Thanked God for the sermon on loving God and neighbor. Confessed rushing through the day without pausing. Asked for a more present heart tomorrow.",
    summary: "Evening reflection: thanks for sermon, confession, tomorrow.",
    keywords: [],
    mood: 'peaceful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 22, 21, 0, 0).getTime()) as MoodLevel,
    isPrayerEntry: true,
    prayerSlotId: 'evening',
  },
];

// Roman's journal entries (1/25, 1/26, 1/31, 2/1 — 2026). Titles have no dates; no title when it would be empty.
const ROMAN_ENTRIES: JournalEntry[] = [
  {
    id: 'roman-1',
    timestamp: new Date(2026, 0, 25, 18, 30).getTime(),
    transcript: "Sunday Service\n\nDoes more pleasure give more brokenness. More pleasure leads to wanting more. Never satisfied. Pleasure is a gift of grace that points us to eternity. We forget grace is something we don't deserve. We start working and think we deserve things.",
    summary: "Pleasure, grace, and deserving—Sunday service reflection.",
    keywords: ["sermon notes"],
    mood: 'heavy',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 25, 18, 30).getTime()),
  },
  {
    id: 'roman-2',
    timestamp: new Date(2026, 0, 26, 20, 15).getTime(),
    transcript: "Woke up today and blessed the Lord. Went to the gym then went to work. The Lord has blessed me w/ a job. No christians in sight. The Lord has been helping me stop lying due to people pleasing. Anytime I get the urge to say a lie I get convicted. Praying the Lord helps me wake up sooner. Tired now so going to sleep. Lord heal my cough also.",
    summary: "Blessing the Lord, job, stopping lying, conviction, prayers for sleep and healing.",
    keywords: [],
    mood: 'grateful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 26, 20, 15).getTime()),
    prayerRequests: [
      {
        id: 'roman-pr-1',
        personName: 'Self',
        request: 'Lord help me wake up sooner. Heal my cough.',
        status: 'active',
        createdAt: new Date(2026, 0, 26, 20, 0).getTime(),
        term: 'short',
      },
    ],
  },
  {
    id: 'roman-3',
    timestamp: new Date(2026, 0, 31, 21, 0).getTime(),
    transcript: "Went to a Christian event. Sang worship and heard testimonies. These people are famous yet still seek the Lord. Crazy people like that exist. God is so good! Got to meet them like Ahawty, Jack, BG, Athang , Tiff, KP. All cool people.",
    summary: "Christian event, worship, testimonies, famous people seeking the Lord.",
    keywords: ["dream"],
    mood: 'grateful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 31, 21, 0).getTime()),
  },
  {
    id: 'roman-4',
    timestamp: new Date(2026, 1, 1, 22, 45).getTime(),
    transcript: "Sunday Service\n\nJesus tests us. He gives us things but not too easy so we need to rely on Him. As I pray I do not. Even if Jesus says NO keep praying. Mt 15:27 He could just be testing you to see if you want it bad enough.",
    summary: "Jesus tests us so we rely on Him; keep praying even if He says no.",
    keywords: ["sermon notes"],
    mood: 'hopeful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 1, 1, 22, 45).getTime()),
    scripture: 'Mt 15:27',
  },
  // Seed prayer entries (with content)
  {
    id: 'roman-prayer-morning-2026-01-25',
    timestamp: new Date(2026, 0, 25, 7, 0, 0).getTime(),
    transcript: "Woke up and blessed the Lord. Prayed for the Sunday service later—that I’d hear Him clearly. Asked for help to stop people-pleasing and to be honest today.",
    summary: "Morning: bless the Lord, Sunday service, honesty.",
    keywords: [],
    mood: 'grateful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 25, 7, 0, 0).getTime()) as MoodLevel,
    isPrayerEntry: true,
    prayerSlotId: 'morning',
  },
  {
    id: 'roman-prayer-evening-2026-01-26',
    timestamp: new Date(2026, 0, 26, 21, 0, 0).getTime(),
    transcript: "End of day. Thanked God for the job and for conviction when I was about to lie. Prayed again for my cough and for earlier wake-up. Good night Lord.",
    summary: "Evening: thanks for job and conviction; cough and sleep.",
    keywords: [],
    mood: 'grateful',
    moodLevel: detectMoodFromTimestamp(new Date(2026, 0, 26, 21, 0, 0).getTime()) as MoodLevel,
    isPrayerEntry: true,
    prayerSlotId: 'evening',
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

/** Jan 18 — "Where We Look for the Future" (Erica) */
const ERICA_DEVOTIONAL_2026_01_18: Devotional = {
  verse: '"Let no one be found among you who practices divination or sorcery, interprets omens, engages in witchcraft, or casts spells, or who is a medium or spiritist or who consults the dead."',
  reference: 'Deuteronomy 18:10–11',
  title: 'Where We Look for the Future',
  quote: 'Seeking the future apart from God never brings clarity—only false confidence.',
  reflection: `Uncertainty has a way of making us restless. When the future feels unclear, we instinctively look for guidance—someone who can tell us what is coming and how to prepare. Throughout history, people have turned to the occult, mediums, and spiritists for this very reason. But God speaks plainly about these practices, not out of fear, but out of protection.

The problem is not curiosity about the future; it is the source we trust to guide us. God forbids seeking insight from the occult because He is not its source. At best, such practices offer deception and false confidence. At worst, they open the door to spiritual forces that do not seek our good. God's warning is not restrictive—it is loving. He knows that guidance detached from truth always leads to harm.

In contrast, God has given us His Word. The Bible does not satisfy every curiosity about tomorrow, but it gives us everything we need to walk faithfully today. It reveals God's character, His promises, and His wisdom for life. Rather than offering control over the future, Scripture offers something better: trust. When we anchor ourselves in God's Word, we learn that we do not need secret knowledge to be secure—we need a faithful God to follow.`,
  prayer: `Lord, when fear or curiosity tempts me to seek answers apart from You, draw my heart back to Your truth. Teach me to trust Your Word more than hidden knowledge or quick predictions. Help me walk faithfully today, confident that my future is secure in Your hands. Amen.`,
  sections: [],
};

/** Jan 21 — "When Love Becomes the Measure" (Erica) */
const ERICA_DEVOTIONAL_2026_01_21: Devotional = {
  verse: '"You shall love the Lord your God with all your heart and with all your soul and with all your mind." This is the great and first commandment. And a second is like it: "You shall love your neighbor as yourself." On these two commandments depend all the Law and the Prophets.',
  reference: 'Matthew 22:37–40',
  title: 'When Love Becomes the Measure',
  quote: 'God\'s commands are not a test to pass, but a way of life shaped by love.',
  reflection: `It's easy to misunderstand the Bible as a long list of rules—things to do, things to avoid, standards to meet. When faith is framed this way, obedience can quickly feel heavy, and failure feels constant. But Jesus offers a surprising clarity when He summarizes all of God's commands with just two: love God with all your heart, and love your neighbor as yourself.

In doing so, Jesus is not minimizing the law. He is revealing its heart. Every command God gives flows from love and leads toward love. When love is missing, rules become rigid and burdensome. But when love is present, obedience is no longer about checking boxes—it becomes a natural response to relationship. Love doesn't ignore God's law; it fulfills it.

This reframes the way we examine our lives. The question is not only "Did I follow the rules?" but "Did love shape my actions?" Were my words rooted in love for God? Were my choices attentive to the people around me? When love becomes the measure, faith moves from performance to transformation. We find that in loving God and loving others, we are already walking in the way God intended all along.`,
  prayer: `Lord, free me from seeing faith as mere rule-keeping. Teach me to love You with my whole heart and to love others as a true expression of that love. Let my obedience flow from relationship, not fear, and shape my life according to Your heart. Amen.`,
  sections: [],
};

/** Jan 22 — "The Wisdom We Overlook" (Erica) */
const ERICA_DEVOTIONAL_2026_01_22: Devotional = {
  verse: '"Stand up in the presence of the aged, show respect for the elderly and revere your God. I am the LORD."',
  reference: 'Leviticus 19:32',
  title: 'The Wisdom We Overlook',
  quote: 'To honor the elderly is to honor the wisdom God forms through time.',
  reflection: `In a culture that prizes speed, innovation, and youth, it is easy to overlook the elderly. Their voices may seem slower, their stories familiar, their presence less urgent. But Scripture tells a different story. God's command to honor the elderly is not a sentimental gesture—it is a serious spiritual responsibility.

Age carries weight because experience forms wisdom. Those who have walked longer with God and through life have seen patterns we have not yet recognized. They have faced consequences we are only beginning to imagine. When we dismiss the elderly, we do not simply ignore people—we disregard insight that could protect us from unnecessary pain and repeated mistakes.

Honoring the elderly requires more than politeness. It calls for humility: the willingness to listen, to learn, and to slow down enough to receive wisdom that cannot be Googled or rushed. God values the wisdom formed through faithfulness over time, and He invites us to do the same. When we take time to listen to those who came before us, we honor not only them, but the God who has been shaping them through the years.`,
  prayer: `Lord, forgive me for the times I have rushed past wisdom in my desire for independence or speed. Teach me to honor those older than me with humility and attentiveness. Help me listen well, learn faithfully, and value the wisdom You have shaped through years of experience. Amen.`,
  sections: [],
};

const ERICA_DEVOTIONAL_BY_DATE: Record<string, Devotional> = {
  '2026-01-18': ERICA_DEVOTIONAL_2026_01_18,
  '2026-01-21': ERICA_DEVOTIONAL_2026_01_21,
  '2026-01-22': ERICA_DEVOTIONAL_2026_01_22,
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

/** Dates that must always show empty state (no devotional content). */
const ERICA_DEVOTIONAL_EMPTY_DATES: string[] = ['2026-01-25', '2026-01-26'];

/** Get devotional for display: date-specific if set, else unlocked default, else null (empty state). */
export function getDevotionalForUserAndDate(userId: CurrentUserId, dateStr: string): Devotional | null {
  const u = USER_DATA[userId];
  if (!u.devotional) return null;
  if (userId === 'erica' && ERICA_DEVOTIONAL_EMPTY_DATES.includes(dateStr)) return null;
  if (userId === 'erica' && ERICA_DEVOTIONAL_BY_DATE[dateStr]) return ERICA_DEVOTIONAL_BY_DATE[dateStr];
  if (userId === 'roman' && ROMAN_DEVOTIONAL_BY_DATE[dateStr]) return ROMAN_DEVOTIONAL_BY_DATE[dateStr];
  if (userId === 'angela' && ANGELA_DEVOTIONAL_BY_DATE[dateStr]) return ANGELA_DEVOTIONAL_BY_DATE[dateStr];
  if (typeof window !== 'undefined' && localStorage.getItem(`devotional_unlocked_${dateStr}`) === 'true') {
    return u.devotional;
  }
  return null;
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

// Angela: 日记与灵修来自 PDF「Devotional for Angela」，方案 A（每天一条，timestamp 取当日最后 [HH:MM] 或 20:00）
const ANGELA_ENTRIES: JournalEntry[] = [
  {
    id: 'angela-2025-12-11',
    timestamp: new Date(2025, 11, 11, 19, 47).getTime(),
    transcript: `心是话语的根源，如果我们的心真的是豆腐心我们不会忍心说出像刀子一样的话。比说出的话更重要的是内在语言，最大的神的话不是事实，是真理。事实会告诉你困难，神告诉你为他祷告在我手里没有难成的事。

凭爱心说成实话，诚实化的原文是说出真理，活出真理才能说出真理。我们知道很多的事实，但是事实并不是真理，并且事实不是在任何时候都可以讲出来的，很多人喜欢说真实，很多人喜欢说实话，但是他们没有凭着爱心。

做完全人的意思是做成熟的人在成熟的过程。`,
    summary: '心与真理、凭爱心说实话。',
    keywords: [],
    mood: 'grateful',
    moodLevel: 4,
  },
  {
    id: 'angela-2025-12-19',
    timestamp: new Date(2025, 11, 19, 20, 0).getTime(),
    transcript: `"你的服侍就是对神的敬拜"。重要的是以神为中心的服侍，有没有继续对神保持柔软，继续放下，follow 神的计划，你要我做什么我就做什么。我们只能从神的爱里来做什么。不是要达到我心里完美的预期。小Z牧师特会洗了三天的碗，神调整她的心态。上好的福分不是嫁给高富帅，也不是娶了高白富美，而是遇见神。以马内利。有神同在。主耶稣更看重的是我们对他的爱。如果没有爱我们没办法真的服侍他。有神同在是一份产业，挪不走的。真正服侍不一定是别人看得到的。我求你让我一生住在你的殿中。雅威：我是。我是那位创造你从一而终不曾改变的神。你不是意外，你是刻意被造的。`,
    summary: '服侍以神为中心、有神同在与刻意被造。',
    keywords: [],
    mood: 'grateful',
    moodLevel: 4,
  },
  {
    id: 'angela-2025-12-21',
    timestamp: new Date(2025, 11, 21, 11, 36).getTime(),
    transcript: `丁磊老师讲道：从小父母一直吵架，爸爸会拿刀砍妈妈，一刀下去鲜血直流，还会把手指掰断。11岁的时候父母终于离婚，妈妈带着我过着很苦的日子，经常吃晚上顿没有下顿，会去地里捡别人收割完剩下的白菜叶子吃。不久为了生存妈妈嫁给了另一个男人，在婚礼上我虽然理解妈妈是为了养活我才与别人建立家庭，但我感觉我是多余的，不应该存在这个地方。过了一年还是被我搅黄了，经过我的牵线爸爸又回到了一起，我期待爸爸不会像以前一样打妈妈，结果还是和以前一样。过了一年他们又离婚了，我也15岁了。过了一段时间妈妈查出来癌症晚期，三个月后就离世了。有人给我传福音跟我说耶稣爱你，我很不理解，我去到教会迫害教会，想看看他们什么反应，他们没有骂我也没有怪我。直到有一天神对我说话，我完全降服于他，将自己献上给他："世上的父母离弃你们，我耶和华永不离弃你"`,
    summary: '丁磊老师讲道：破碎家庭与耶和华永不离弃。',
    keywords: [],
    mood: 'grateful',
    moodLevel: 4,
  },
  {
    id: 'angela-2025-12-30',
    timestamp: new Date(2025, 11, 30, 20, 0).getTime(),
    transcript: `鬼是最表面的东西，更多的问题是在一个人内心深处的苦毒、不饶恕、埋怨。他给我们的生命是丰盛的到永恒，不是只是活着。他渴望我们去认识他，要祝福我们有一个丰盛的生命。

韩剧：如果连假的你都这么喜欢那真的呢。魔鬼最想偷走的是爱神爱人的心。`,
    summary: '内心苦毒与丰盛生命、爱神爱人的心。',
    keywords: [],
    mood: 'grateful',
    moodLevel: 4,
  },
  {
    id: 'angela-2026-01-27',
    timestamp: new Date(2026, 0, 27, 20, 0).getTime(),
    transcript: `如果从没体会过神的同在又何谈顺服和摆上。与神相处是 one of the motivation。我们更应该靠意志力还是更应该靠与神的关系？相辅相成？`,
    summary: '神的同在、顺服与和神的关系。',
    keywords: [],
    mood: 'grateful',
    moodLevel: 4,
  },
  {
    id: 'angela-2026-01-29',
    timestamp: new Date(2026, 0, 29, 20, 5).getTime(),
    transcript: `小小的事也可以有大大的赞美。越懂得感恩的人越喜乐。你不是一个暴躁抱怨的人，你只是不知道没有人教你如何去感恩。`,
    summary: '感恩与喜乐、学习感恩。',
    keywords: [],
    mood: 'grateful',
    moodLevel: 4,
  },
  {
    id: 'angela-2026-02-03',
    timestamp: new Date(2026, 1, 3, 22, 23).getTime(),
    transcript: `you worry bc you worshiped the wrong thing。你追求的往往会成为让你焦虑的事情，只有追求神敬拜神他永远不会让你失望焦虑。好难过。好想和他说点什么但又好像不应该大家都说不应该不用练ai都说不不用。主啊求你帮助我 be determined。奉耶稣的名祷告阿门。选择大于努力。`,
    summary: '忧虑与敬拜错误对象、求主帮助坚定。',
    keywords: [],
    mood: 'heavy',
    moodLevel: 2,
  },
];

const ANGELA_DEVOTIONAL: Devotional = {
  verse: 'The Lord is near to all who call on him, to all who call on him in truth.',
  reference: 'Psalm 145:18',
  title: 'Near to All Who Call',
  quote: 'God is never too far to hear; He is near to every sincere heart.',
  reflection: `When we feel alone or distant from God, Scripture reminds us that He is not far off. The Lord is near to all who call on Him in truth. Our part is to call—sincerely, honestly, without pretense. He responds to the heart that seeks Him.

Whatever you are carrying today, bring it to Him. He is near. He hears. He meets those who call on Him in truth.`,
  prayer: `Lord, draw my heart to call on You in truth. When I feel far away, remind me that You are near. Thank You for hearing and for being present with all who seek You. Amen.`,
  sections: [],
};

/** 2025-12-11 — 保守你心 (from PDF) */
const ANGELA_DEVOTIONAL_2025_12_11: Devotional = {
  verse: '你要保守你心，胜过保守一切，因为一生的果效是由心发出。',
  reference: '箴言 4:23',
  title: '保守你心',
  quote: '守住你的心，胜过守住一切。',
  reflection: `圣经提醒我们："你要保守你心，胜过保守一切，因为一生的果效是由心发出。"（箴4:23）我们的话语、行为、情绪，都不是随机流露，而是从我们的心发出。保罗也说，"我们若心里存着基督的平安，外面无论环境如何，都能心安"。保守心，就是让神的话语居首位、让神的话成为我们思想的尺度。不让愤怒、恐惧、不满或怀疑占据我们的思想空间，而是以神的真理更新我们的内心，使我们做出合神心意的选择和行动。`,
  prayer: `主啊，求祢保守我的心不被忧虑、恐惧、愤怒或怀疑占据。求祢以祢真实的话语填满我的内心，使我的思想被祢真理更新。让我的生命行为从合乎祢心意的地方发出。愿我的心常存祢的平安和喜乐。奉主耶稣名，阿们。`,
  sections: [],
};

/** 2025-12-19 — 服事 (from PDF) */
const ANGELA_DEVOTIONAL_2025_12_19: Devotional = {
  verse: '你们中间谁为大，就要作你们的用人。',
  reference: '马太福音 20:26',
  title: '服事以爱',
  quote: '服事不是成就的累积，而是以爱去回应神与人的动机。',
  reflection: `许多属灵领袖和信徒常被"服事必须成功"、"尽力做好工作"的心态驱使，却忽略了最根本的：服事不是为了成绩、名誉或人看见，而是因为我们曾被主耶稣深深爱过。耶稣说："你们中间谁为大，就要作你们的用人。"（太20:26）基督的服事不是居高临下的，而是谦卑、舍己、愿意成为别人背后的力量。真正的服事，是以爱为核心，而不是以效率和成就衡量。服事的动机决定服事的价值。若我们服事是为着神的荣耀和人的益处，那么无论我们做多少，都是蒙神悦纳的；若是为了被称赞、得到肯定、彰显自己，那即使看到外在成功，也是空虚。`,
  prayer: `主啊，求祢使我服事的心真切、纯净，不为表现、成就或人的称赞，而是因为我知道祢先爱我。愿我在服事中看见祢的荣耀、看见人的需要，让我的双手和心与祢的一样，成为别人生命的祝福。奉主耶稣的名，阿们。`,
  sections: [],
};

/** 2025-12-21 — 神与你同在 (from PDF) */
const ANGELA_DEVOTIONAL_2025_12_21: Devotional = {
  verse: '我必与你同在，你无论往哪里去，我必保守你。',
  reference: '创世记 28:15',
  title: '神与你同在',
  quote: '神与你同在，你被祂深深爱着。',
  reflection: `人最深的渴望不是被认可，而是被真心接纳。有些人来自破碎的家庭，被父母的争吵、离异、忽视或冷暴力伤害过。他们可能在年幼时就被迫成为"坚强者"，却内心深处渴望有人温柔地对他说一句："你值得被爱。"你经历了伤害、被赶走、被抛弃，这些不是不重要的痛，而是现实的痛。这样的经历常常让人自认多余，甚至怀疑自己是否有存在的价值。但神要你知道：你不是偶然被创造的，你不是失误里的产品。圣经中有一个真理特别宝贵："耶和华说：我必与你同在，你无论往哪里去，我必保守你。"（创世记28:15）这不是一种抽象的承诺，而是在你付不起代价、无处可依时仍与你同行的保证。神不会因为人的失败或冷漠而撤回祂的爱，也不会因为你过去的伤痕而拒绝拥抱你。你所经历的缺乏、痛苦和被忽略，并不是你价值的判决；正是在这些破碎中，神更要向你展示祂的慈爱和永不离弃。当你在痛苦中把真实的自己带到神面前，神不会拒绝你，也不会转脸；祂会用祂的爱覆盖你的伤口，用祂的应许抚平你心里的裂缝。今天，无论你的过去多么破碎，请记住：神与你同在，你被祂深深爱着。`,
  prayer: `主啊，求祢告诉我：即使过去我被人忽视、被遗弃、被伤害，但在祢里面我不是多余的、不是失误的、不是孤单的。祢应许与我同在，祢记念我，祢看顾我。求祢用祢永恒的爱覆盖我心里每一个裂缝，让我在祢里面得到真正的归属、真正的平安、真正的身份。主啊，让我每天忆起祢的信实，让我知道在我最软弱、最破碎的时候，祢仍然坚定地爱我、接纳我、带领我。奉主耶稣基督的名，阿们。`,
  sections: [],
};

/** 2025-12-30 — 全副军装 (from PDF) */
const ANGELA_DEVOTIONAL_2025_12_30: Devotional = {
  verse: '要穿戴神所赐的全副军装，使你们能抵挡魔鬼的诡计。',
  reference: '以弗所书 6:11',
  title: '全副军装',
  quote: '神配备我们，不是让我们靠自己，而是靠着基督的力量。',
  reflection: `保罗在以弗所书6章用很生动的比喻教导我们：我们不是与血肉之事争战，而是与属灵的邪恶势力争战。因此我们必须穿戴神所赐的全副军装。真理的带、正义的护心镜、和平的福音预备之鞋、信德作盾牌、救恩的头盔、神的话作为圣灵之剑…这不是象征，而是实际属灵真理。神配备我们，不是让我们靠自己，而是靠着基督的力量。当我们在祷告中带着信心、用神话语提醒自己的真理、抵挡恐惧和怀疑、以神的公义和救恩保护自己，我们就能够站立得稳，在属灵争战中得胜。`,
  prayer: `主啊，我承认属灵的争战真实存在，魔鬼的诡计常试探、恐吓、怀疑我的信心。求祢帮助我穿戴祢所赐的全副军装：真理、正义、信德、救恩、福音的脚鞋、祢的话语和祷告。求祢使我能在争战中站立得稳，抵挡邪恶的试探，不被恐惧吞噬。愿我的信心不靠自己、而是靠照着祢的应许活出祢的力量。奉主耶稣名，阿们。`,
  sections: [],
};

/** 2026-01-27 — 顺服的道路 (from PDF) */
const ANGELA_DEVOTIONAL_2026_01_27: Devotional = {
  verse: '顺服胜于献祭，听命胜于公羊的脂油。',
  reference: '撒母耳记上 15:22',
  title: '顺服的道路',
  quote: '走顺服的道路，就是打属灵的仗。',
  reflection: `一切真信主的人都愿意顺服神，但如果因为顺服神需要遭遇苦难，他们便畏缩不前了。绝大多数的信徒都愿意走顺服却不受苦的路，事实却不可能。因为这顺服的道路就是一个属灵的战场。战场是一个多有苦难危险的地方，顺服的道路上也是如此。在保罗所写的一段话语中我们可以看见这个真理："我现在被浇奠，我离世的时候到了。我已经打过了那美好的仗，我已经行完了我的道路，我已经保守了信心；从此以后，有公义的冠冕为我存留，就是按着公义审判的主到了那日要赐给我的；不但赐给我，也赐给凡爱慕祂显现的人。"（提摩太后书4:6‒8）注意，保罗所说"打过了那好的仗"与"行完了我的道路"是不能分开的。走顺服的路就是打属灵的仗。我们对神顺服，便是对魔鬼作战。因此走顺服的道路，便必须遭遇苦难。在这些苦难中，我们学习更大的顺服，更美的顺服。每一份顺服都是一次胜利。我们越肯顺服，我们的苦难就越增加；只要我们不退缩、不灰心，我们属灵的生命就越长进，我们也就越多得胜，越临近主所应许我们的荣耀。— 摘自今日灵修《顺服的道路是一个属灵战场》`,
  prayer: `主啊，我们知道顺服不是一条容易的路，但我们也知道你在顺服的过程中与我们同行。求你帮助我们不因苦难退缩，教我们在困境中仍然紧紧地握住你的手，不靠自己的力量去顺服，而是靠着你赐给我们的力量和信心。愿我们的顺服不是出于恐惧、压力或表现的义务，而是源自对你深深的信靠与爱。求你加添我们的勇气，使我们在属灵的争战中站立得稳，不退缩、不灰心，直到看见荣耀。奉主耶稣的名，阿们。`,
  sections: [],
};

/** 2026-01-29 — 感恩 (from PDF) */
const ANGELA_DEVOTIONAL_2026_01_29: Devotional = {
  verse: '要常常喜乐，不住地祷告，凡事谢恩，因为这是神在基督耶稣里向你们所定的旨意。',
  reference: '帖撒罗尼迦前书 5:16–18',
  title: '感恩',
  quote: '感恩不是忽视环境，而是看见神在一切处的同在。',
  reflection: `凡事谢恩是神给信徒的命令与福气。生活中我们往往容易因环境不顺、遭遇困难就心生埋怨，但神借使徒保罗教导我们："要常常喜乐，不住地祷告，凡事谢恩"（帖前5:16‒18）。不是祂忽略了我们的挣扎，而是祂希望我们明白：感恩并不是对困境的忽视，而是把一切带到神面前的呼求、信靠与回应。在感恩的祷告中，我们不再埋怨，而是在神的同在中经历喜乐。当我们常存感谢的心，我们就体验到神无处不在的恩典。无论是顺境还是逆境，因祂的信实与恩手伴随我们，我们有理由感谢。学习在日常生活中数算神的恩典，让心不断被祂更新，感恩就会成为我们与神持续的对话。感恩不是一时的情绪，而是对神日常同在的回应。当你把每件小事都交给神，你的心就会被祂的平安和喜乐充满。`,
  prayer: `主啊，我们感谢祢在这一天所赐的一切恩典。即使在看似困难、失望或挫折之中，我们仍要以感谢的心来到祢面前。求祢教导我们不凭感觉，而是凭信心祷告；不因环境改变而喜乐，而是因看见祢在我们中间。求祢用感恩来更新我们的心，使我们在祷告中与祢更亲近，并让我们的喜乐因祢同在而恒常。阿们。`,
  sections: [],
};

/** 2026-02-03 — 不要忧虑 (from PDF) */
const ANGELA_DEVOTIONAL_2026_02_03: Devotional = {
  verse: '所以，不要为明天忧虑，因为明天自有明天的忧虑；一天的难处一天当就够了。',
  reference: '马太福音 6:34',
  title: '不要忧虑',
  quote: '不要为明天忧虑，把一切交托给掌权、慈爱的神。',
  reflection: `耶稣在马太福音中清楚地说："不要为明天忧虑，因为明天自有明天的忧虑；一天的难处一天当就够了。"（太6:34）祂不是要我们忽略未来，也不是说我们不应规划生活或努力，而是告诉我们：忧虑不能改变任何事，它只会夺取我们的平安，模糊我们的信心视野。我们被呼召把担忧卸给神，把今天的心事与明天的未知都交托在祂手里。忧虑往往来自我们错误地把安全感放在自己计划、成就或信息控制之上，而神要我们把信任放在祂身上——因为祂是全知、全能、始终与我们同在的神。当我们把担忧交给神，我们获得真正的自由和平安。今天可能有忧虑，但神的同在和祂的慈爱仍然不断向我们彰显。`,
  prayer: `主啊，祢知道我心中的忧虑、惧怕和疑惑。我承认我常试图靠自己掌控明天，靠计划、预期、努力来制造安全感。但主啊，我将这一切卸给祢，把我的焦虑放在祢慈爱的手中。求祢赐我不为明天忧虑的信心和平安，因为祢是我不变的磐石、我的供应与护卫。求祢使我的心在今天、在每个未知中，都能安然 resting in You。奉主耶稣的名，阿们。`,
  sections: [],
};

const ANGELA_DEVOTIONAL_BY_DATE: Record<string, Devotional> = {
  '2025-12-11': ANGELA_DEVOTIONAL_2025_12_11,
  '2025-12-19': ANGELA_DEVOTIONAL_2025_12_19,
  '2025-12-21': ANGELA_DEVOTIONAL_2025_12_21,
  '2025-12-30': ANGELA_DEVOTIONAL_2025_12_30,
  '2026-01-27': ANGELA_DEVOTIONAL_2026_01_27,
  '2026-01-29': ANGELA_DEVOTIONAL_2026_01_29,
  '2026-02-03': ANGELA_DEVOTIONAL_2026_02_03,
};

/** 有按日灵修的日期，用于周历上显示圆点（Angela） */
export const ANGELA_DEVOTIONAL_DATES: string[] = Object.keys(ANGELA_DEVOTIONAL_BY_DATE);

const ANGELA_VERSES = [
  { verse: 'The Lord is near to all who call on him, to all who call on him in truth.', reference: 'Psalm 145:18' },
  { verse: 'Cast all your anxiety on him because he cares for you.', reference: '1 Peter 5:7' },
  { verse: 'For I know the plans I have for you, declares the Lord, plans for welfare and not for evil.', reference: 'Jeremiah 29:11' },
  { verse: 'Come to me, all who labor and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28' },
  { verse: 'Peace I leave with you; my peace I give to you.', reference: 'John 14:27' },
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
  angela: {
    entries: ANGELA_ENTRIES,
    devotional: ANGELA_DEVOTIONAL,
    verses: ANGELA_VERSES,
    avatarSeed: 'Angela',
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
    { id: 'angela', displayName: 'Angela', avatarSeed: USER_DATA.angela.avatarSeed, avatarUrl: USER_DATA.angela.avatarUrl },
  ];
}

const STORAGE_KEY = 'confidein_current_user';

export function getStoredUserId(): CurrentUserId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'erica' || raw === 'roman' || raw === 'angela') return raw;
  } catch (_) {}
  return 'erica';
}

export function setStoredUserId(id: CurrentUserId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch (_) {}
}

export function getInitialDataForUser(userId: CurrentUserId): UserInitialData {
  const u = USER_DATA[userId];
  const baseEntries = [...u.entries];
  const minTs = baseEntries.length ? Math.min(...baseEntries.map((e) => e.timestamp)) : now;
  const fromDate = startOfDay(new Date(Math.min(minTs, now)));
  const toDate = startOfDay(new Date(now));
  const entries = ensurePrayerEntriesForDates(baseEntries, fromDate, toDate);
  return {
    entries,
    devotional: u.devotional ? { ...u.devotional } : null,
    verses: [...u.verses],
    avatarSeed: u.avatarSeed,
    avatarUrl: u.avatarUrl,
  };
}

// Prayer Reminder Settings

export function getDefaultPrayerReminderSettings(): PrayerReminderSettings {
  return {
    enabled: true,
    timeSlots: [
      { id: 'morning', label: 'Morning Prayer', hour: 7, minute: 0, enabled: true },
      { id: 'evening', label: 'Evening Reflection', hour: 21, minute: 0, enabled: true },
    ],
  };
}

export function getPrayerReminderSettings(userId: CurrentUserId): PrayerReminderSettings {
  try {
    const key = `prayer_reminder_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 验证数据结构
      if (parsed && typeof parsed.enabled === 'boolean' && Array.isArray(parsed.timeSlots)) {
        // 迁移旧的中文标签到英文
        const migrated = {
          ...parsed,
          timeSlots: parsed.timeSlots.map((slot: any) => {
            if (slot.id === 'morning' && (slot.label === '晨祷' || slot.label === 'Morning Prayer')) {
              return { ...slot, label: 'Morning Prayer' };
            }
            if (slot.id === 'evening' && (slot.label === '晚祷' || slot.label === 'Evening Reflection')) {
              return { ...slot, label: 'Evening Reflection' };
            }
            return slot;
          }),
        };
        // 如果标签有变化，保存迁移后的设置
        const needsSave = parsed.timeSlots.some((slot: any, index: number) => 
          slot.label !== migrated.timeSlots[index].label
        );
        if (needsSave) {
          setPrayerReminderSettings(userId, migrated);
        }
        return migrated;
      }
    }
  } catch (_) {}
  // 如果不存在或解析失败，返回默认设置
  return getDefaultPrayerReminderSettings();
}

export function setPrayerReminderSettings(userId: CurrentUserId, settings: PrayerReminderSettings): void {
  try {
    const key = `prayer_reminder_${userId}`;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (_) {}
}

// Prayer Completion Records

export function getPrayerCompletionRecord(userId: CurrentUserId, date: string): PrayerCompletionRecord | null {
  try {
    const key = `prayer_completion_${userId}_${date}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === date && Array.isArray(parsed.completedSlots)) {
        return parsed;
      }
    }
  } catch (_) {}
  return null;
}

export function setPrayerCompletionRecord(userId: CurrentUserId, record: PrayerCompletionRecord): void {
  try {
    const key = `prayer_completion_${userId}_${record.date}`;
    localStorage.setItem(key, JSON.stringify(record));
  } catch (_) {}
}
