-- =============================================================================
-- Migration 034: daily_test_engine_questions
--
-- SECURITY FIX: the 'Today's Test' engine (public/study/daily-test-engine.html)
-- previously shipped its ENTIRE question bank — including correct answers for
-- every day — as a hardcoded JS array inside a static, unauthenticated HTML
-- file. Any visitor (paid or not, logged in or not) who loaded the file got
-- full access to every day's Q&A, and the 'free tier' lock was driven by a
-- ?free=N query param the wrapper page never actually set, so it defaulted to
-- unlimited for everyone.
--
-- This migration moves the question bank server-side. Questions are now
-- fetched per-day via an authenticated, payment-gated API route which never
-- returns correct_option to the client; grading happens server-side via a
-- second route. RLS denies all direct client access — only the service-role
-- API routes may read this table.
--
-- Seed data: the 128 questions (Days 1-5) migrated verbatim from the old
-- QUESTION_BANK array, so existing content is preserved exactly.
--
-- Idempotent: IF NOT EXISTS guards + ON CONFLICT DO NOTHING on seed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.daily_test_engine_questions (
  id              text        NOT NULL,
  day             smallint    NOT NULL,
  subject         text        NOT NULL,
  star            boolean     NOT NULL DEFAULT false,
  question_text   text        NOT NULL,
  option_a        text        NOT NULL,
  option_b        text        NOT NULL,
  option_c        text        NOT NULL,
  option_d        text        NOT NULL,
  correct_option  smallint    NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
  explanation     text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT daily_test_engine_questions_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.daily_test_engine_questions IS
  'Question bank for the Today''s Test daily exam engine. correct_option is '
  '0-based (0=A,1=B,2=C,3=D). Server-only — never queried with the anon/'
  'authenticated client key. RLS has no permissive policies by design.';

CREATE INDEX IF NOT EXISTS idx_dteq_day ON public.daily_test_engine_questions (day);

-- RLS enabled, NO policies granted — defense in depth. Only the service-role
-- key (used exclusively by the API routes below) can read this table.
ALTER TABLE public.daily_test_engine_questions ENABLE ROW LEVEL SECURITY;

-- ── Seed: Days 1-5 (migrated from the old static QUESTION_BANK) ────────────

INSERT INTO public.daily_test_engine_questions
  (id, day, subject, star, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
VALUES
  ('D1-01', 1, 'History', true, 'In which year was the English East India Company chartered?', '1600', '1757', '1764', '1526', 0, 'The EIC received its royal charter in 1600, long before it gained political power in India.'),
  ('D1-02', 1, 'History', true, 'The Battle of Plassey (1757) was fought between Robert Clive and which Indian ruler?', 'Siraj-ud-Daulah', 'Mir Qasim', 'Shah Alam II', 'Tipu Sultan', 0, 'Plassey (1757), Clive vs Siraj-ud-Daulah, gave the British their first foothold in Bengal.'),
  ('D1-03', 1, 'History', true, 'After which battle did the British win the Diwani (revenue rights) of Bengal?', 'Battle of Buxar (1764)', 'Battle of Plassey (1757)', 'Third Battle of Panipat', 'Battle of Wandiwash', 0, 'At Buxar (1764) the British beat Mir Qasim + Nawab of Awadh + Shah Alam II, winning the Diwani — real power in Bengal.'),
  ('D1-04', 1, 'History', false, 'The Subsidiary Alliance system was introduced by which Governor-General?', 'Lord Wellesley', 'Lord Dalhousie', 'Lord Cornwallis', 'Lord Bentinck', 0, 'Wellesley''s Subsidiary Alliance made a ruler keep British troops and cede revenue while losing control of foreign policy.'),
  ('D1-05', 1, 'History', true, 'The Doctrine of Lapse is associated with which Governor-General?', 'Lord Dalhousie', 'Lord Wellesley', 'Lord Curzon', 'Lord Ripon', 0, 'Dalhousie''s Doctrine of Lapse annexed states with no natural male heir — Jhansi, Satara, Nagpur, Sambalpur.'),
  ('D1-06', 1, 'History', false, 'Which state was annexed under the Doctrine of Lapse?', 'Jhansi', 'Mysore', 'Hyderabad', 'Travancore', 0, 'Jhansi, Satara, Nagpur and Sambalpur were annexed under the Doctrine of Lapse.'),
  ('D1-07', 1, 'History', true, 'The Permanent Settlement (1793) in Bengal was introduced by whom?', 'Cornwallis', 'Munro', 'Wellesley', 'Dalhousie', 0, 'Permanent Settlement 1793 — Cornwallis, with zamindars as revenue intermediaries in Bengal.'),
  ('D1-08', 1, 'History', false, 'The Ryotwari land-revenue system is associated with which official?', 'Thomas Munro', 'Cornwallis', 'Warren Hastings', 'Robert Clive', 0, 'Ryotwari (Munro) collected revenue directly from ryots (cultivators) in the Madras and Bombay regions.'),
  ('D1-09', 1, 'History', false, 'In the Mahalwari system, revenue was assessed on the basis of which unit?', 'The village (mahal)', 'The individual ryot', 'The zamindar''s estate', 'The district', 0, 'Mahalwari assessed revenue on the whole village/mahal, mainly in North India.'),
  ('D1-10', 1, 'History', false, 'Under the Subsidiary Alliance, an Indian ruler primarily lost control over which area?', 'Foreign policy / foreign affairs', 'Religion', 'Local festivals', 'Language of court', 0, 'The ally kept British troops and ceded territory/revenue, but crucially lost control of foreign policy.'),
  ('D1-11', 1, 'Polity', false, 'The Constituent Assembly of India was formed in which month and year?', 'December 1946', 'January 1950', 'August 1947', 'November 1949', 0, 'The Constituent Assembly was formed in Dec 1946; it adopted the Constitution on 26 Nov 1949.'),
  ('D1-12', 1, 'Polity', false, 'Who moved the Objectives Resolution in the Constituent Assembly?', 'Jawaharlal Nehru', 'B.R. Ambedkar', 'Rajendra Prasad', 'Sardar Patel', 0, 'Nehru moved the Objectives Resolution, which later became the basis of the Preamble.'),
  ('D1-13', 1, 'Polity', true, 'The Drafting Committee of the Constitution was chaired by whom?', 'B.R. Ambedkar', 'Jawaharlal Nehru', 'Rajendra Prasad', 'B.N. Rau', 0, 'The Drafting Committee was chaired by Dr. B.R. Ambedkar.'),
  ('D1-14', 1, 'Polity', false, 'The Directive Principles of State Policy (DPSP) were borrowed from the constitution of which country?', 'Ireland', 'USA', 'UK', 'Canada', 0, 'DPSP were borrowed from Ireland; FR/judicial review from USA; parliamentary system from UK.'),
  ('D1-15', 1, 'Polity', false, 'India''s parliamentary/cabinet form of government was borrowed from which country?', 'United Kingdom', 'United States', 'Ireland', 'Canada', 0, 'The UK gave India the parliamentary and cabinet system and the rule of law.'),
  ('D1-16', 1, 'Polity', true, 'The words ''Socialist'' and ''Secular'' were added to the Preamble by which amendment?', '42nd Amendment, 1976', '44th Amendment, 1978', '1st Amendment, 1951', '73rd Amendment, 1992', 0, 'The 42nd Amendment (1976) added ''Socialist'', ''Secular'' and ''Integrity'' to the Preamble.'),
  ('D1-17', 1, 'Polity', false, 'On which date did the Constitution of India come into force?', '26 January 1950', '26 November 1949', '15 August 1947', '26 January 1949', 0, 'Adopted 26 Nov 1949; enforced 26 Jan 1950 (celebrated as Republic Day).'),
  ('D1-18', 1, 'Polity', false, 'How many Articles did the original Constitution of India contain?', '395', '448', '356', '300', 0, 'Originally 395 Articles, 8 Schedules and 22 Parts.'),
  ('D1-19', 1, 'Reasoning', false, 'In the EJOTY rule, which letter stands at position 15?', 'O', 'T', 'J', 'Y', 0, 'EJOTY marks 5,10,15,20,25 → E=5, J=10, O=15, T=20, Y=25.'),
  ('D1-20', 1, 'Reasoning', false, 'Opposite letter pairs sum to 27 (A↔Z). The opposite of B is?', 'Y', 'X', 'A', 'W', 0, 'B=2, and 27−2=25=Y. So B↔Y.'),
  ('D1-21', 1, 'Reasoning', false, 'Find the next term: 2, 6, 12, 20, 30, ?', '42', '40', '44', '36', 0, 'Differences are 4,6,8,10,12 → 30+12 = 42.'),
  ('D1-22', 1, 'Reasoning', false, 'Find the next term: 1, 4, 9, 16, ?', '25', '20', '24', '36', 0, 'Perfect squares 1²,2²,3²,4² → next is 5² = 25.'),
  ('D1-23', 1, 'Reasoning', false, 'If CAT is coded as DBU (each letter +1), then DOG is coded as?', 'EPH', 'CPF', 'EPG', 'DPH', 0, 'Apply the same +1 shift: D→E, O→P, G→H = EPH.'),
  ('D1-24', 1, 'Reasoning', false, 'Using reverse-alphabet coding (A↔Z, B↔Y…), the code for C is?', 'X', 'W', 'Y', 'D', 0, 'C=3, 27−3=24=X.'),
  ('D1-25', 1, 'Reasoning', false, 'If 2→5 and 3→7 under the rule (×2 + 1), then 4→?', '9', '8', '10', '7', 0, '4×2+1 = 9. Apply the same operation found on the first pair.'),
  ('D1-26', 1, 'Reasoning', false, 'Find the next term: 3, 6, 11, 18, 27, ?', '38', '36', '40', '35', 0, 'Differences are 3,5,7,9,11 → 27+11 = 38.'),
  ('D2-01', 2, 'History', true, 'What was the immediate cause of the Revolt of 1857?', 'Greased Enfield cartridges', 'Doctrine of Lapse', 'Economic drain', 'Permanent Settlement', 0, 'The greased cartridges (rumoured cow/pig fat) were the immediate trigger; deeper causes included Doctrine of Lapse and economic drain.'),
  ('D2-02', 2, 'History', false, 'Who fired the first spark of the 1857 revolt at Barrackpore?', 'Mangal Pandey', 'Tantia Tope', 'Kunwar Singh', 'Nana Sahib', 0, 'Mangal Pandey at Barrackpore was the first spark of the 1857 revolt.'),
  ('D2-03', 2, 'History', false, 'Who led the 1857 revolt at Jhansi?', 'Rani Lakshmibai', 'Begum Hazrat Mahal', 'Rani Durgavati', 'Ahilyabai Holkar', 0, 'Rani Lakshmibai led at Jhansi; the British recaptured Jhansi in April 1858.'),
  ('D2-04', 2, 'History', false, 'Which pair led the revolt at Kanpur?', 'Nana Sahib and Tantia Tope', 'Bahadur Shah Zafar and Bakht Khan', 'Kunwar Singh and Amar Singh', 'Nana Sahib and Mangal Pandey', 0, 'Kanpur was led by Nana Sahib along with Tantia Tope.'),
  ('D2-05', 2, 'History', false, 'Begum Hazrat Mahal was associated with the 1857 revolt at which centre?', 'Lucknow', 'Delhi', 'Kanpur', 'Bihar', 0, 'Begum Hazrat Mahal led at Lucknow.'),
  ('D2-06', 2, 'History', false, 'Who was the symbolic leader of the 1857 revolt at Delhi?', 'Bahadur Shah Zafar', 'Nana Sahib', 'Kunwar Singh', 'Tantia Tope', 0, 'The rebels rallied around the last Mughal, Bahadur Shah Zafar, as the symbol at Delhi.'),
  ('D2-07', 2, 'History', false, 'The 1857 revolt formally began at Meerut on which date?', '10 May 1857', '4 February 1922', '13 April 1919', '8 August 1942', 0, 'It started at Meerut on 10 May 1857 and moved to Delhi.'),
  ('D2-08', 2, 'History', true, 'Company rule was replaced by Crown rule through which Act?', 'Government of India Act 1858', 'Regulating Act 1773', 'Indian Councils Act 1861', 'Pitt''s India Act 1784', 0, 'The Government of India Act 1858 ended Company rule and created the office of Secretary of State for India.'),
  ('D2-09', 2, 'History', false, 'Who described the 1857 revolt as the ''First War of Independence''?', 'V.D. Savarkar', 'British historians', 'Jawaharlal Nehru', 'Dadabhai Naoroji', 0, 'Savarkar called it the First War of Independence; the British called it a ''Sepoy Mutiny''.'),
  ('D2-10', 2, 'History', false, 'Which office was created by the Government of India Act 1858?', 'Secretary of State for India', 'Viceroy of India', 'Governor-General', 'Attorney General', 0, 'The Act created the Secretary of State for India, a member of the British Cabinet.'),
  ('D2-11', 2, 'Polity', false, 'Fundamental Rights are contained in which range of Articles?', 'Articles 12–35', 'Articles 36–51', 'Articles 52–78', 'Articles 5–11', 0, 'Part III (Fundamental Rights) covers Articles 12–35.'),
  ('D2-12', 2, 'Polity', false, 'The Right to Equality is guaranteed under which Articles?', 'Articles 14–18', 'Articles 19–22', 'Articles 23–24', 'Articles 25–28', 0, 'Right to Equality = Art 14–18; Freedom = 19–22; against Exploitation = 23–24.'),
  ('D2-13', 2, 'Polity', true, 'Which Fundamental Right did Ambedkar call the ''heart and soul'' of the Constitution?', 'Right to Constitutional Remedies (Art 32)', 'Right to Freedom (Art 19)', 'Right to Equality (Art 14)', 'Right to Life (Art 21)', 0, 'Art 32 (writs) was called the ''heart and soul'' by Ambedkar.'),
  ('D2-14', 2, 'Polity', true, 'The Right to Life and Personal Liberty is guaranteed under which Article?', 'Article 21', 'Article 19', 'Article 14', 'Article 32', 0, 'Art 21 is the most-litigated FR, now including dignity, privacy, livelihood and clean environment.'),
  ('D2-15', 2, 'Polity', false, 'Which of these Fundamental Rights is available ONLY to citizens?', 'Article 19 (Freedoms)', 'Article 21 (Life)', 'Article 20 (protection re: conviction)', 'Article 14 (Equality before law)', 0, 'Art 15,16,19,29,30 are citizens-only; Art 14,20,21,22 apply to all persons.'),
  ('D2-16', 2, 'Polity', false, 'Which writ is issued to produce a detained person before the court?', 'Habeas Corpus', 'Mandamus', 'Quo Warranto', 'Certiorari', 0, 'Habeas Corpus (''to have the body'') is used against unlawful detention.'),
  ('D2-17', 2, 'Polity', false, 'The Right against Exploitation is covered under which Articles?', 'Articles 23–24', 'Articles 25–28', 'Articles 29–30', 'Articles 14–18', 0, 'Right against Exploitation = Art 23–24 (bans forced labour and child labour).'),
  ('D2-18', 2, 'Polity', false, 'How many Fundamental Rights does the Constitution currently guarantee?', 'Six', 'Seven', 'Five', 'Four', 0, 'Six FRs remain after Right to Property was removed by the 44th Amendment.'),
  ('D2-19', 2, 'Quant', false, 'The unit digit of powers of 2 repeats with a cyclicity of?', '4', '2', '1', '3', 0, '2,4,8,6 repeats — cyclicity 4 (same for 3,7,8).'),
  ('D2-20', 2, 'Quant', false, 'A number is divisible by 4 if which part is divisible by 4?', 'Last two digits', 'Digit sum', 'Last three digits', 'Alternating sum', 0, 'Divisibility by 4 depends on the last two digits; by 8 on the last three.'),
  ('D2-21', 2, 'Quant', false, 'The divisibility rule for 11 uses which test?', 'Alternating sum of digits', 'Sum of all digits', 'Last two digits', 'Product of digits', 0, 'For 11, take the alternating sum of digits and check divisibility by 11.'),
  ('D2-22', 2, 'Quant', true, 'For two numbers, HCF × LCM equals?', 'The product of the two numbers', 'Their sum', 'Their difference', 'Their average', 0, 'HCF × LCM = product of the two numbers (valid only for two numbers).'),
  ('D2-23', 2, 'Quant', false, 'If n = p^a × q^b (p, q prime), the number of factors of n is?', '(a+1)(b+1)', 'a×b', 'a+b', '(a−1)(b−1)', 0, 'Number of factors of p^a q^b is (a+1)(b+1).'),
  ('D2-24', 2, 'Quant', false, 'Two numbers are called co-prime when their HCF is?', '1', '0', '2', 'Equal to the smaller number', 0, 'Co-prime numbers share no common factor other than 1, so HCF = 1.'),
  ('D2-25', 2, 'Quant', false, 'What is the unit digit of 2¹⁰?', '4', '2', '8', '6', 0, 'Cycle of 2 is 2,4,8,6 (length 4). 10 mod 4 = 2 → 2nd term = 4.'),
  ('D2-26', 2, 'Quant', false, 'A number is divisible by 9 if?', 'Its digit sum is divisible by 9', 'Its last digit is 9', 'Its last two digits are divisible by 9', 'It is even', 0, 'Divisibility by 3 and 9 both use the digit sum.'),
  ('D3-01', 3, 'History', false, 'Who founded the Brahmo Samaj (1828)?', 'Raja Ram Mohan Roy', 'Dayananda Saraswati', 'Swami Vivekananda', 'Keshab Chandra Sen', 0, 'Raja Ram Mohan Roy founded the Brahmo Samaj in 1828.'),
  ('D3-02', 3, 'History', true, 'Sati was abolished in 1829 during the tenure of which Governor-General?', 'Lord William Bentinck', 'Lord Dalhousie', 'Lord Curzon', 'Lord Wellesley', 0, 'Sati was banned in 1829 by Bentinck, aided by Raja Ram Mohan Roy''s campaign.'),
  ('D3-03', 3, 'History', false, 'The slogan ''Back to the Vedas'' is associated with which reformer?', 'Dayananda Saraswati', 'Raja Ram Mohan Roy', 'Sir Syed Ahmed Khan', 'Jyotiba Phule', 0, 'Dayananda Saraswati founded the Arya Samaj (1875) with the call ''Back to the Vedas''.'),
  ('D3-04', 3, 'History', false, 'The Ramakrishna Mission (1897) was founded by whom?', 'Swami Vivekananda', 'Ramakrishna Paramhansa', 'Dayananda Saraswati', 'Keshab Chandra Sen', 0, 'Swami Vivekananda founded the Ramakrishna Mission in 1897.'),
  ('D3-05', 3, 'History', true, 'Who delivered the famous 1893 speech at the Chicago Parliament of Religions?', 'Swami Vivekananda', 'Raja Ram Mohan Roy', 'Rabindranath Tagore', 'Dayananda Saraswati', 0, 'Vivekananda''s 1893 Chicago address introduced Indian philosophy to the West.'),
  ('D3-06', 3, 'History', false, 'The Aligarh Movement and MAO College are associated with whom?', 'Sir Syed Ahmed Khan', 'Jyotiba Phule', 'Sir Syed Ali', 'Badruddin Tyabji', 0, 'Sir Syed Ahmed Khan founded MAO College (1875), which grew into Aligarh Muslim University.'),
  ('D3-07', 3, 'History', false, 'The Satyashodhak Samaj was founded by whom?', 'Jyotiba Phule', 'B.R. Ambedkar', 'Dayananda Saraswati', 'Narayana Guru', 0, 'Jyotiba Phule founded the Satyashodhak Samaj for women''s and lower-caste education.'),
  ('D3-08', 3, 'History', true, 'The Indian National Congress (1885) was founded by whom?', 'A.O. Hume', 'W.C. Bonnerjee', 'Dadabhai Naoroji', 'Gopal Krishna Gokhale', 0, 'A.O. Hume founded the INC in 1885; the first session was at Bombay under W.C. Bonnerjee.'),
  ('D3-09', 3, 'Polity', true, 'The Directive Principles of State Policy are contained in which Articles?', 'Articles 36–51', 'Articles 12–35', 'Articles 52–78', 'Articles 5–11', 0, 'DPSP (Art 36–51) are non-justiciable welfare ideals borrowed from Ireland.'),
  ('D3-10', 3, 'Polity', true, 'Which amendment is nicknamed the ''Mini-Constitution''?', '42nd Amendment (1976)', '44th Amendment (1978)', '1st Amendment (1951)', '73rd Amendment (1992)', 0, 'The 42nd Amendment (1976) made sweeping changes, earning it the ''Mini-Constitution'' tag.'),
  ('D3-11', 3, 'Polity', false, 'Fundamental Duties (Art 51A) were added to the Constitution by which amendment?', '42nd Amendment', '44th Amendment', '73rd Amendment', '91st Amendment', 0, 'The 42nd Amendment (1976) added Fundamental Duties as Art 51A.'),
  ('D3-12', 3, 'Polity', true, 'The Right to Property was removed from Fundamental Rights by which amendment?', '44th Amendment (1978)', '42nd Amendment (1976)', '1st Amendment (1951)', '24th Amendment (1971)', 0, 'The 44th Amendment (1978) made Right to Property a legal right under Art 300A.'),
  ('D3-13', 3, 'Polity', true, 'Panchayati Raj was given constitutional status by which amendment?', '73rd Amendment (1992)', '74th Amendment (1992)', '42nd Amendment (1976)', '61st Amendment (1988)', 0, 'The 73rd Amendment (1992) created 3-tier Panchayati Raj; the 74th covered urban local bodies.'),
  ('D3-14', 3, 'Polity', false, 'The idea of DPSP was borrowed from which country?', 'Ireland', 'USA', 'UK', 'Canada', 0, 'DPSP are modelled on the Irish Constitution.'),
  ('D3-15', 3, 'Polity', false, 'In which year was the 42nd Amendment enacted?', '1976', '1978', '1971', '1992', 0, 'The 42nd Amendment was passed in 1976 during the Emergency.'),
  ('D3-16', 3, 'Polity', false, 'After 1978, the Right to Property exists as a legal right under which Article?', 'Article 300A', 'Article 21', 'Article 19(1)(f)', 'Article 31', 0, 'Right to Property is now a legal (not fundamental) right under Art 300A.'),
  ('D3-17', 3, 'English', true, 'Choose the correct preposition: ''He is senior ___ me.''', 'to', 'than', 'from', 'of', 0, 'Use ''senior TO'' (also junior/superior/prior TO), never ''senior than''.'),
  ('D3-18', 3, 'English', false, 'Choose the correct article: ''I waited for ___ hour.''', 'an', 'a', 'the', 'no article', 0, '''Hour'' begins with a vowel SOUND (the h is silent), so ''an hour''.'),
  ('D3-19', 3, 'English', false, 'Choose the correct verb: ''One of the boys ___ absent.''', 'is', 'are', 'were', 'have', 0, '''One of + plural noun'' takes a singular verb → ''One of the boys IS''.'),
  ('D3-20', 3, 'English', false, 'Choose the correct verb: ''Each of the students ___ a book.''', 'has', 'have', 'are', 'were', 0, '''Each/every/either/neither'' take a singular verb → ''Each … has''.'),
  ('D3-21', 3, 'English', false, 'Which sentence is correct?', 'We discussed the matter.', 'We discussed about the matter.', 'We discussed on the matter.', 'We discussed for the matter.', 0, '''Discuss'' takes no preposition — ''discuss the matter'', not ''discuss about''.'),
  ('D3-22', 3, 'English', false, 'Choose the correct article: ''She holds ___ MBA degree.''', 'an', 'a', 'the', 'no article', 0, '''MBA'' starts with the vowel sound ''em'', so ''an MBA''.'),
  ('D3-23', 3, 'English', false, 'Choose the correct verb: ''The team ___ winning the match.''', 'is', 'are', 'were', 'have', 0, 'A collective noun like ''team'' takes a singular verb when acting as one unit.'),
  ('D3-24', 3, 'English', false, 'In ''Neither the teacher nor the students ___ present'', the verb agrees with?', 'the nearer subject (students → are)', 'the farther subject', 'either subject', 'always singular', 0, 'With ''neither…nor / either…or'', the verb agrees with the NEARER subject.'),
  ('D3-25', 3, 'History', false, 'The first session of the Indian National Congress (1885) was held in which city?', 'Bombay', 'Calcutta', 'Madras', 'Allahabad', 0, 'The first INC session (1885) met in Bombay under president W.C. Bonnerjee.'),
  ('D3-26', 3, 'English', false, 'Choose the correct sentence:', 'He reached the station on time.', 'He reached to the station on time.', 'He reached at the station on time.', 'He reached in the station on time.', 0, '''Reach'' takes no preposition — ''reached the station'', not ''reached to/at the station''.'),
  ('D4-01', 4, 'History', true, 'The ''Drain of Wealth'' theory was propounded by whom?', 'Dadabhai Naoroji', 'Gopal Krishna Gokhale', 'Bal Gangadhar Tilak', 'R.C. Dutt', 0, 'Dadabhai Naoroji explained the Drain of Wealth in ''Poverty and Un-British Rule in India''.'),
  ('D4-02', 4, 'History', false, 'Who declared ''Swaraj is my birthright and I shall have it''?', 'Bal Gangadhar Tilak', 'Lala Lajpat Rai', 'Bipin Chandra Pal', 'Dadabhai Naoroji', 0, 'The slogan belongs to Bal Gangadhar Tilak of Maharashtra.'),
  ('D4-03', 4, 'History', false, 'In the Lal-Bal-Pal trio, who represented Punjab?', 'Lala Lajpat Rai', 'Bal Gangadhar Tilak', 'Bipin Chandra Pal', 'Gopal Krishna Gokhale', 0, 'Lala Lajpat Rai (Punjab), Tilak (Maharashtra) and Bipin Chandra Pal (Bengal) were the extremist trio.'),
  ('D4-04', 4, 'History', true, 'The Swadeshi Movement of 1905 was triggered by which event?', 'Partition of Bengal by Curzon', 'Jallianwala Bagh massacre', 'Rowlatt Act', 'Simon Commission', 0, 'Curzon''s 1905 Partition of Bengal led to the boycott of foreign goods (Swadeshi).'),
  ('D4-05', 4, 'History', false, 'In which year was the Partition of Bengal annulled?', '1911', '1905', '1919', '1907', 0, 'The partition was annulled in 1911, when the capital shifted to Delhi.'),
  ('D4-06', 4, 'History', false, 'In which year did the Surat Split of the Congress occur?', '1907', '1905', '1916', '1920', 0, 'The Surat Split (1907) divided Moderates and Extremists.'),
  ('D4-07', 4, 'History', false, 'The Muslim League was founded in which year?', '1906', '1885', '1916', '1919', 0, 'The All-India Muslim League was founded in 1906.'),
  ('D4-08', 4, 'History', false, 'Separate electorates were introduced by which reforms?', 'Morley-Minto Reforms (1909)', 'Montagu-Chelmsford Reforms', 'Government of India Act 1935', 'Regulating Act 1773', 0, 'The Morley-Minto Reforms of 1909 introduced separate electorates for Muslims.'),
  ('D4-09', 4, 'History', false, 'Bipin Chandra Pal, of the extremist trio, belonged to which region?', 'Bengal', 'Punjab', 'Maharashtra', 'Madras', 0, 'Bipin Chandra Pal represented Bengal in the Lal-Bal-Pal trio.'),
  ('D4-10', 4, 'Geography', true, 'Which is the most widespread soil type in India?', 'Alluvial soil', 'Black soil', 'Red soil', 'Laterite soil', 0, 'Alluvial soil (Indo-Gangetic plains) is the largest and most fertile soil group.'),
  ('D4-11', 4, 'Geography', true, 'Which soil is considered best for growing cotton?', 'Black (Regur) soil', 'Red soil', 'Laterite soil', 'Alluvial soil', 0, 'Moisture-retentive Black/Regur soil is ideal for cotton — Maharashtra, MP, Gujarat.'),
  ('D4-12', 4, 'Geography', false, 'Black soil is formed from which parent material?', 'Deccan trap lava', 'River alluvium', 'Leached laterite', 'Wind-blown loess', 0, 'Black soil forms from weathered Deccan trap basalt (lava).'),
  ('D4-13', 4, 'Geography', false, 'New, fertile alluvium in the plains is called?', 'Khadar', 'Bhangar', 'Regur', 'Laterite', 0, 'Khadar = new fertile alluvium; Bhangar = old alluvium with kankar nodules.'),
  ('D4-14', 4, 'Geography', false, 'Red soil gets its colour mainly from?', 'Iron oxide', 'Humus', 'Lime', 'Silica', 0, 'Iron oxide gives red soil its colour; it is porous and less fertile.'),
  ('D4-15', 4, 'Geography', false, 'Which crop is well suited to laterite soil?', 'Coffee', 'Wheat', 'Cotton', 'Sugarcane', 0, 'Laterite (acidic, leached) suits plantation crops — cashew, coffee, tea, rubber.'),
  ('D4-16', 4, 'Geography', false, 'Red soil is chiefly found in which part of India?', 'South and East India', 'Indo-Gangetic plains', 'Western Ghats', 'Thar Desert', 0, 'Red soil occurs across South and East India where crystalline rocks weather.'),
  ('D4-17', 4, 'Geography', false, 'Alluvial soil is most associated with which crops?', 'Wheat and rice', 'Coffee and tea', 'Cashew and rubber', 'Groundnut and millets', 0, 'Fertile alluvial plains grow wheat and rice.'),
  ('D4-18', 4, 'Geography', false, 'Old alluvium with kankar (lime nodules) is called?', 'Bhangar', 'Khadar', 'Regur', 'Bangar-free', 0, 'Bhangar is the older alluvium; Khadar is the newer, more fertile layer.'),
  ('D4-19', 4, 'Reasoning', false, 'Doctor : Hospital :: Teacher : ?', 'School', 'Book', 'Student', 'Class', 0, 'A doctor works in a hospital as a teacher works in a school (workplace relation).'),
  ('D4-20', 4, 'Reasoning', true, 'What is the recommended first step in every blood-relations question?', 'Draw the family tree', 'Solve it mentally', 'Guess the gender', 'Start from the answer options', 0, 'Always draw the family tree — never solve blood relations in your head.'),
  ('D4-21', 4, 'Reasoning', false, '2 : 8 :: 3 : ?', '27', '9', '12', '18', 0, '2³=8, so apply cube: 3³ = 27.'),
  ('D4-22', 4, 'Reasoning', false, 'Pen : Write :: Knife : ?', 'Cut', 'Sharp', 'Kitchen', 'Metal', 0, 'A pen is used to write as a knife is used to cut (tool-function relation).'),
  ('D4-23', 4, 'Reasoning', false, 'If P is the mother of Q, and Q is the sister of R, then P is R''s?', 'Mother', 'Aunt', 'Sister', 'Grandmother', 0, 'Q and R are siblings, and P is Q''s mother, so P is also R''s mother.'),
  ('D4-24', 4, 'Reasoning', false, '6 : 36 :: 8 : ?', '64', '48', '56', '72', 0, '6²=36, so apply square: 8² = 64.'),
  ('D4-25', 4, 'Reasoning', false, 'Hot : Cold :: Up : ?', 'Down', 'High', 'Above', 'Top', 0, 'These are opposite (antonym) pairs, so Up ↔ Down.'),
  ('D5-01', 5, 'History', false, 'In which year did Gandhi return to India from South Africa?', '1915', '1917', '1919', '1920', 0, 'Gandhi returned in 1915; his political guru was Gopal Krishna Gokhale.'),
  ('D5-02', 5, 'History', false, 'Who was Gandhi''s political guru?', 'Gopal Krishna Gokhale', 'Bal Gangadhar Tilak', 'Dadabhai Naoroji', 'Motilal Nehru', 0, 'Gandhi regarded Gopal Krishna Gokhale as his political guru.'),
  ('D5-03', 5, 'History', true, 'The Champaran Satyagraha (1917) was launched on behalf of which group?', 'Indigo farmers', 'Textile mill workers', 'Salt makers', 'Plantation tea workers', 0, 'Champaran (1917) fought the tinkathia indigo system — Gandhi''s first civil disobedience in India.'),
  ('D5-04', 5, 'History', false, 'Gandhi''s first hunger strike in India took place during which struggle?', 'Ahmedabad Mill Strike (1918)', 'Champaran Satyagraha', 'Kheda Satyagraha', 'Salt March', 0, 'The 1918 Ahmedabad Mill Strike saw Gandhi''s first hunger strike.'),
  ('D5-05', 5, 'History', false, 'The Kheda Satyagraha (1918) demanded what?', 'Tax relief for crop-failed farmers', 'Higher indigo prices', 'Abolition of salt tax', 'Repeal of the Rowlatt Act', 0, 'At Kheda (1918) Gandhi sought remission of land revenue after crop failure.'),
  ('D5-06', 5, 'History', true, 'The Rowlatt Act (1919) was popularly called the?', 'Black Act', 'Vernacular Act', 'Charter Act', 'Pitt''s Act', 0, 'The Rowlatt Act allowed detention without trial and was nicknamed the ''Black Act''.'),
  ('D5-07', 5, 'History', true, 'On which date did the Jallianwala Bagh massacre occur?', '13 April 1919', '10 May 1857', '12 March 1930', '8 August 1942', 0, 'On 13 April 1919, General Dyer opened fire on a crowd at Amritsar.'),
  ('D5-08', 5, 'History', false, 'Who ordered the firing at Jallianwala Bagh?', 'General Dyer', 'Lord Curzon', 'General Outram', 'Lord Chelmsford', 0, 'General Dyer ordered the firing; the Hunter Commission later inquired into it.'),
  ('D5-09', 5, 'History', false, 'Who returned his knighthood in protest against the Jallianwala Bagh massacre?', 'Rabindranath Tagore', 'Mahatma Gandhi', 'Motilal Nehru', 'C.R. Das', 0, 'Rabindranath Tagore renounced his knighthood after the massacre.'),
  ('D5-10', 5, 'Geography', false, 'Which is the highest (northernmost) range of the Himalayas?', 'Greater Himalaya (Himadri)', 'Lesser Himalaya (Himachal)', 'Shiwaliks (Outer)', 'Aravalli', 0, 'The Greater Himalaya (Himadri) is the highest range and holds Mt. Everest.'),
  ('D5-11', 5, 'Geography', false, 'Arrange the Himalayan ranges from north to south:', 'Himadri → Himachal → Shiwaliks', 'Shiwaliks → Himachal → Himadri', 'Himachal → Himadri → Shiwaliks', 'Himadri → Shiwaliks → Himachal', 0, 'North to south: Greater (Himadri) → Lesser (Himachal) → Outer (Shiwaliks).'),
  ('D5-12', 5, 'Geography', true, 'Which physiographic region of India is the most densely populated?', 'Northern Plains', 'Peninsular Plateau', 'Himalayas', 'Coastal islands', 0, 'The fertile Indus-Ganga-Brahmaputra Northern Plains are the most densely populated.'),
  ('D5-13', 5, 'Geography', false, 'Which landform is made of the oldest, hard crystalline rock?', 'Peninsular Plateau', 'Northern Plains', 'Greater Himalaya', 'Coastal plains', 0, 'The Peninsular Plateau is the oldest, most stable landmass in India.'),
  ('D5-14', 5, 'Geography', true, 'The Andaman and Nicobar Islands are located in which water body?', 'Bay of Bengal', 'Arabian Sea', 'Indian Ocean (south)', 'Lakshadweep Sea', 0, 'Andaman & Nicobar (volcanic — Barren Island) lie in the Bay of Bengal.'),
  ('D5-15', 5, 'Geography', false, 'The Lakshadweep Islands are of which origin?', 'Coral', 'Volcanic', 'Tectonic', 'Alluvial', 0, 'Lakshadweep in the Arabian Sea are coral islands (Andaman & Nicobar are volcanic).'),
  ('D5-16', 5, 'Geography', false, 'Which ghats are continuous and generally higher?', 'Western Ghats', 'Eastern Ghats', 'Aravalli Ghats', 'Satpura Ghats', 0, 'The Western Ghats are continuous and higher; the Eastern Ghats are broken.'),
  ('D5-17', 5, 'Geography', false, 'What is the approximate height of Mt. Everest?', '8,849 m', '8,611 m', '8,167 m', '7,816 m', 0, 'Mt. Everest, in the Greater Himalaya, is about 8,849 m high.'),
  ('D5-18', 5, 'Quant', true, 'Express 1/8 as a percentage.', '12.5%', '16.67%', '14.28%', '10%', 0, '1/8 = 0.125 = 12.5%.'),
  ('D5-19', 5, 'Quant', false, 'Express 1/3 as a percentage (approx).', '33.33%', '30%', '35%', '3.33%', 0, '1/3 ≈ 33.33%.'),
  ('D5-20', 5, 'Quant', false, 'A successive increase of 10% then 20% gives a net increase of?', '32%', '30%', '28%', '35%', 0, 'Net = a + b + ab/100 = 10 + 20 + 200/100 = 32%.'),
  ('D5-21', 5, 'Quant', true, 'If price rises 25%, by how much must consumption fall to keep expenditure constant?', '20%', '25%', '30%', '15%', 0, 'Reduction = [x/(100+x)]×100 = [25/125]×100 = 20%.'),
  ('D5-22', 5, 'Quant', false, 'If a:b = 2:3 and b:c = 4:5, then a:b:c = ?', '8:12:15', '2:3:5', '2:12:5', '6:12:15', 0, 'Make b common (LCM 12): a:b = 8:12, b:c = 12:15 → a:b:c = 8:12:15.'),
  ('D5-23', 5, 'Quant', false, 'Express 1/7 as a percentage (approx).', '14.28%', '16.67%', '12.5%', '11.11%', 0, '1/7 ≈ 14.28%.'),
  ('D5-24', 5, 'Quant', false, 'Which fraction equals 25%?', '1/4', '1/5', '1/3', '2/5', 0, '25% = 25/100 = 1/4.'),
  ('D5-25', 5, 'Quant', false, 'If 40% of a number is 80, the number is?', '200', '160', '240', '320', 0, 'Number = 80 ÷ 0.40 = 200.')
ON CONFLICT (id) DO NOTHING;
