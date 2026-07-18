'use client'

// The neural "knowledge universe" — moved out of the hero (which now shows a live
// demo) into its own band lower on the page.
import NeuralMap from './NeuralMap'
import { Reveal } from './ui'

const LEGEND: [string, string][] = [
  ['General Studies', '#0284c7'],
  ['Aptitude', '#6366f1'],
  ['Reasoning', '#059669'],
  ['English', '#d97706'],
  ['Tamil', '#e11d48'],
  ['Current Affairs', '#7c3aed'],
]

export default function KnowledgeUniverse() {
  return (
    <section id="knowledge-universe" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <Reveal>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">One connected syllabus</p>
          <h2 className="mt-2 text-[26px] font-extrabold tracking-tight text-gray-900 sm:text-[32px]">Your knowledge universe</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-gray-600">
            Every subject you&apos;ll master — woven into one disciplined path for SSC, RRB, Banking &amp; TN-Govt exams.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="relative mx-auto mt-7 max-w-lg overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-[0_1px_3px_rgba(16,24,40,0.07),0_24px_48px_-12px_rgba(16,24,40,0.12)] backdrop-blur-sm sm:p-5">
            <div className="relative h-[320px] w-full sm:h-[380px]">
              <NeuralMap />
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5">
              {LEGEND.map(([label, color]) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
