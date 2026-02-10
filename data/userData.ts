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
