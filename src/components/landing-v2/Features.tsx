'use client'

/**
 * Landing v2 — Features / interactive product preview.
 * Two showcase rows (daily exam system, leaderboard) + a supporting grid.
 * All numbers mirror real platform mechanics: 6:00–8:30 AM window,
 * server-graded scores, AI mentor report per exam, batch leaderboard.
 * Bilingual (EN/தமிழ்) via useLang.
 */
import { BarChart, BookOpen, Brain, Calendar, Flame, MessageCircle, Target, Timer, Trophy, Zap } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

const LEADERBOARD_ROWS = [
  { rank: 1, name: 'Meena P.', days: 25, score: '2,840', tone: 'text-amber-500' },
  { rank: 2, name: 'Ravi V.', days: 23, score: '2,710', tone: 'text-gray-500' },
  { rank: 3, name: 'Arun K.', days: 21, score: '2,590', tone: 'text-orange-400' },
]

const GRID = {
  en: [
    { icon: Brain, tone: 'bg-indigo-50 text-indigo-600', title: 'AI Mentor reports', text: 'After every exam, an AI coach analyses your answers and tells you exactly what to fix — strengths, weak topics, and a predicted score range.' },
    { icon: BookOpen, tone: 'bg-sky-50 text-sky-600', title: 'Daily study materials', text: 'Fresh, exam-calibrated material published every day. Read it, take the test on it next morning. No hunting for resources.' },
    { icon: BarChart, tone: 'bg-emerald-50 text-emerald-600', title: 'Performance analytics', text: 'Subject-wise accuracy, rank trajectory and score trends — so you always know where your next mark comes from.' },
    { icon: Target, tone: 'bg-amber-50 text-amber-600', title: 'Adaptive question selection', text: 'The system learns your weak topics and serves more questions from them — your practice targets your gaps automatically.' },
    { icon: Flame, tone: 'bg-orange-50 text-orange-600', title: 'Streaks & achievements', text: 'Daily streaks, XP and badges reward consistency. Small wins every morning compound into exam-day confidence.' },
    { icon: MessageCircle, tone: 'bg-sky-50 text-sky-600', title: 'Direct support', text: 'Real humans on WhatsApp for payment, access or exam-day issues. No ticket queues, no bots.' },
  ],
  ta: [
    { icon: Brain, tone: 'bg-indigo-50 text-indigo-600', title: 'AI வழிகாட்டி அறிக்கைகள்', text: 'ஒவ்வொரு தேர்வுக்குப் பிறகும், AI பயிற்சியாளர் உங்கள் பதில்களை ஆய்வு செய்து எதைச் சரிசெய்ய வேண்டும் என்று துல்லியமாகச் சொல்கிறது — பலம், பலவீனமான தலைப்புகள், எதிர்பார்க்கப்படும் மதிப்பெண்.' },
    { icon: BookOpen, tone: 'bg-sky-50 text-sky-600', title: 'தினசரி பாடப் பொருட்கள்', text: 'தேர்வுக்கு ஏற்பத் தயாரிக்கப்பட்ட புதிய பாடங்கள் தினமும் வெளியாகும். இன்று படியுங்கள், நாளை காலை அதில் தேர்வு எழுதுங்கள். பாடம் தேடி அலைய வேண்டாம்.' },
    { icon: BarChart, tone: 'bg-emerald-50 text-emerald-600', title: 'செயல்திறன் பகுப்பாய்வு', text: 'பாடவாரியான துல்லியம், தரவரிசை போக்கு, மதிப்பெண் மாற்றங்கள் — உங்கள் அடுத்த மதிப்பெண் எங்கிருந்து வரும் என்பது எப்போதும் தெரியும்.' },
    { icon: Target, tone: 'bg-amber-50 text-amber-600', title: 'தகவமைப்புக் கேள்வித் தேர்வு', text: 'உங்கள் பலவீனமான தலைப்புகளை அமைப்பு கற்றுக்கொண்டு, அவற்றிலிருந்து அதிகக் கேள்விகள் தரும் — உங்கள் பயிற்சி தானாகவே உங்கள் இடைவெளிகளைக் குறி வைக்கும்.' },
    { icon: Flame, tone: 'bg-orange-50 text-orange-600', title: 'தொடர்ச்சி & சாதனைகள்', text: 'தினசரி தொடர்ச்சி, XP, பேட்ஜ்கள் — சீரான முயற்சிக்கு வெகுமதி. தினமும் காலை சிறு வெற்றிகள் தேர்வு நாள் நம்பிக்கையாக வளரும்.' },
    { icon: MessageCircle, tone: 'bg-sky-50 text-sky-600', title: 'நேரடி ஆதரவு', text: 'பணம், அணுகல், தேர்வு நாள் பிரச்சனைகளுக்கு WhatsApp-இல் உண்மையான மனிதர்கள். டிக்கெட் வரிசை இல்லை, bot இல்லை.' },
  ],
}

const EXAM_POINTS = {
  en: [
    ['Auto-submit on timeout', 'exactly like the real exam hall'],
    ['Instant results & explanations', 'learn from mistakes while they’re fresh'],
    ['Server-graded scores', 'no self-marking, no cheating the system'],
  ],
  ta: [
    ['நேரம் முடிந்ததும் தானாகச் சமர்ப்பிப்பு', 'உண்மையான தேர்வு அரங்கம் போலவே'],
    ['உடனடி முடிவுகள் & விளக்கங்கள்', 'தவறுகள் புதிதாக இருக்கும்போதே கற்றுக்கொள்ளுங்கள்'],
    ['சர்வர் மதிப்பீட்டு மதிப்பெண்கள்', 'சுய மதிப்பீடு இல்லை, அமைப்பை ஏமாற்ற முடியாது'],
  ],
}

const LB_POINTS = {
  en: [
    ['Real competitors, real stakes', 'ranked against your own batch, not anonymous millions'],
    ['Streak tracking built in', 'consistency is scored, not just marks'],
    ['Fresh start every batch', 'the board resets — early or late joiner, same fair race'],
  ],
  ta: [
    ['உண்மையான போட்டியாளர்கள், உண்மையான போட்டி', 'உங்கள் batch-க்குள் தரவரிசை — முகம் தெரியாத லட்சங்கள் அல்ல'],
    ['தொடர்ச்சி கண்காணிப்பு உள்ளடக்கம்', 'மதிப்பெண் மட்டுமல்ல, சீரான வருகைக்கும் மதிப்பு'],
    ['ஒவ்வொரு batch-க்கும் புதிய தொடக்கம்', 'தரவரிசை மீட்டமைக்கப்படும் — முன்னோ பின்னோ சேர்ந்தாலும் சம வாய்ப்பு'],
  ],
}

export default function Features() {
  const { lang, t } = useLang()
  return (
    <section id="features" className="bg-white py-16 sm:py-24" style={{ boxShadow: 'inset 0 1px 0 rgba(16,24,40,0.05), inset 0 -1px 0 rgba(16,24,40,0.05)' }}>
      <Container>
        <SectionHeading
          label={t('The system', 'அமைப்பு')}
          labelTone="indigo"
          title={t('Everything you need. Nothing you don\'t.', 'தேவையானது எல்லாம். தேவையற்றது எதுவும் இல்லை.')}
          sub={t(
            'One programme that handles your study plan, testing, analysis and motivation — end to end.',
            'படிப்புத் திட்டம், தேர்வு, பகுப்பாய்வு, ஊக்கம் — எல்லாவற்றையும் ஒரே திட்டம் முழுமையாகக் கவனிக்கிறது.',
          )}
        />

        {/* Showcase 1 — daily exam */}
        <div className="mx-auto mb-16 grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-sky-600">
              <Timer size={15} /> {t('Daily exam system', 'தினசரி தேர்வு முறை')}
            </span>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              {lang === 'ta'
                ? <>ஒரு நேரக் கட்டுப்பாட்டுத் தேர்வு.<br />தினமும் காலை. சரியாக 6 மணிக்கு.</>
                : <>One timed exam.<br />Every morning. 6 AM sharp.</>}
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600 sm:text-base">
              {t(
                'The window opens at 6:00 and closes at 8:30 AM IST. Miss it, and the day is marked missed — that\'s the point. Exam-day pressure becomes a daily habit, not a one-time shock.',
                'காலை 6:00-க்குத் திறந்து 8:30-க்கு மூடப்படும். தவறவிட்டால், அந்த நாள் தவறியதாகவே பதிவாகும் — அதுதான் நோக்கம். தேர்வு நாள் அழுத்தம் தினசரி பழக்கமாக மாறும், ஒருமுறை அதிர்ச்சியாக அல்ல.',
              )}
            </p>
            <ul className="mt-6 space-y-3.5">
              {EXAM_POINTS[lang].map(([h, s]) => (
                <li key={h} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-1 ring-sky-200/60">
                    <Zap size={11} />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-gray-700">
                    <strong className="font-semibold text-gray-900">{h}</strong> — {s}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={140}>
            {/* Exam window mock */}
            <div className="relative mx-auto max-w-sm">
              <div aria-hidden className="absolute -inset-5 rounded-[28px] bg-gradient-to-br from-sky-100/70 to-indigo-100/50 blur-xl" />
              <div className="relative rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_20px_44px_-12px_rgba(16,24,40,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-900">{t('Day 14 · General Studies', 'நாள் 14 · பொது அறிவு')}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t('Window open', 'தேர்வு திறந்துள்ளது')}
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t('Closes in', 'மூட இன்னும்')}</div>
                  <div className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-gray-900">01:24:37</div>
                  <div className="mt-1 text-[12px] text-gray-500">{t('6:00 – 8:30 AM IST · auto-submits', '6:00 – 8:30 AM IST · தானாகச் சமர்ப்பிக்கும்')}</div>
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-gray-600">{t('Questions', 'கேள்விகள்')}</span>
                    <span className="font-semibold tabular-nums text-gray-900">{t('100 MCQs · 100 marks', '100 MCQ · 100 மதிப்பெண்')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-gray-600">{t('Your average', 'உங்கள் சராசரி')}</span>
                    <span className="font-semibold tabular-nums text-emerald-600">78% ↑</span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-sky-600 py-3 text-center text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]">
                  {t('Start today\'s exam', 'இன்றைய தேர்வைத் தொடங்குங்கள்')}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Showcase 2 — leaderboard */}
        <div className="mx-auto mb-20 grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal delay={140} className="order-last lg:order-first">
            <div className="relative mx-auto max-w-sm">
              <div aria-hidden className="absolute -inset-5 rounded-[28px] bg-gradient-to-br from-amber-100/60 to-sky-100/60 blur-xl" />
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06),0_20px_44px_-12px_rgba(16,24,40,0.12)]">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                  <span className="inline-flex items-center gap-2 text-[13px] font-bold text-gray-900">
                    <Trophy size={15} className="text-amber-500" /> {t('Batch leaderboard', 'Batch தரவரிசை')}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">{t('updates after every exam', 'ஒவ்வொரு தேர்வுக்குப் பின் புதுப்பிப்பு')}</span>
                </div>
                {LEADERBOARD_ROWS.map((r) => (
                  <div key={r.rank} className="flex items-center gap-3 border-b border-gray-50 px-5 py-3">
                    <span className={`w-5 text-center text-[15px] font-bold tabular-nums ${r.tone}`}>{r.rank}</span>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-semibold text-gray-900">{r.name}</div>
                      <div className="text-[11.5px] text-gray-500">{t(`${r.days}-day streak`, `${r.days}-நாள் தொடர்ச்சி`)}</div>
                    </div>
                    <span className="text-[13.5px] font-bold tabular-nums text-gray-700">{r.score}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 border-l-2 border-sky-500 bg-sky-50/70 px-5 py-3">
                  <span className="w-5 text-center text-[15px] font-bold tabular-nums text-sky-600">12</span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-bold text-sky-700">{t('You', 'நீங்கள்')}</div>
                    <div className="text-[11.5px] text-sky-600/70">{t('14-day streak · climbing', '14-நாள் தொடர்ச்சி · முன்னேற்றம்')}</div>
                  </div>
                  <span className="text-[13.5px] font-bold tabular-nums text-sky-700">1,980</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 opacity-60">
                  <span className="w-5 text-center text-[15px] font-bold tabular-nums text-gray-500">13</span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold text-gray-900">Kavya S.</div>
                    <div className="text-[11.5px] text-gray-500">{t('12-day streak', '12-நாள் தொடர்ச்சி')}</div>
                  </div>
                  <span className="text-[13.5px] font-bold tabular-nums text-gray-700">1,940</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-amber-600">
              <Trophy size={15} /> {t('Live leaderboard', 'நேரடி தரவரிசை')}
            </span>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              {lang === 'ta'
                ? <>உங்கள் தரவரிசை அனைவருக்கும் தெரியும்.<br />உங்கள் ஒழுக்கமும் தான்.</>
                : <>Your rank is public.<br />So is your discipline.</>}
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600 sm:text-base">
              {t(
                'Every submission updates the batch leaderboard in real time. You always know exactly where you stand against the people you\'ll face in the actual exam — and that healthy pressure keeps you showing up on the days motivation doesn\'t.',
                'ஒவ்வொரு சமர்ப்பிப்பும் தரவரிசையை உடனுக்குடன் புதுப்பிக்கும். உண்மையான தேர்வில் நீங்கள் சந்திக்கப்போகும் போட்டியாளர்களுக்கு எதிராக எங்கே நிற்கிறீர்கள் என்பது எப்போதும் தெரியும் — ஊக்கம் இல்லாத நாட்களிலும் இந்த ஆரோக்கியமான அழுத்தம் உங்களை வரவைக்கும்.',
              )}
            </p>
            <ul className="mt-6 space-y-3.5">
              {LB_POINTS[lang].map(([h, s]) => (
                <li key={h} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
                    <Zap size={11} />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-gray-700">
                    <strong className="font-semibold text-gray-900">{h}</strong> — {s}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Supporting grid */}
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GRID[lang].map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="group h-full rounded-2xl border border-gray-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-300/80 hover:shadow-[0_12px_32px_-8px_rgba(16,24,40,0.12)]">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.tone} transition-transform duration-300 group-hover:scale-110`}>
                  <f.icon size={19} />
                </span>
                <h4 className="mt-4 text-[15.5px] font-bold text-gray-900">{f.title}</h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-gray-600">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Programme stats strip */}
        <Reveal delay={120}>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200/70 bg-gray-200/70 sm:grid-cols-4">
            {[
              [<Calendar key="i" size={18} className="text-sky-600" />, t('8 subjects', '8 பாடங்கள்'), t('one daily syllabus', 'ஒரே தினசரி பாடத்திட்டம்')],
              [<Timer key="i" size={18} className="text-indigo-600" />, '6:00 AM', t('daily exam window', 'தினசரி தேர்வு நேரம்')],
              [<Brain key="i" size={18} className="text-emerald-600" />, t('1 report', '1 அறிக்கை'), t('AI coaching per exam', 'ஒவ்வொரு தேர்வுக்கும் AI பயிற்சி')],
              [<Trophy key="i" size={18} className="text-amber-500" />, 'Live', t('batch leaderboard', 'batch தரவரிசை')],
            ].map(([icon, big, small], i) => (
              <div key={i} className="flex flex-col items-center gap-1 bg-white px-4 py-6 text-center">
                {icon}
                <div className="mt-1 text-xl font-bold tracking-tight text-gray-900">{big}</div>
                <div className="text-[12px] font-medium text-gray-500">{small}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
