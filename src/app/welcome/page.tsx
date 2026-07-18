import type { Metadata } from 'next'
import WelcomeFlow from '@/src/components/welcome/WelcomeFlow'

export const metadata: Metadata = {
  title: 'Welcome to CentuMania — choose your language',
  description:
    'CentuMania (CentuM = 100/100 marks + Mania = obsession). Choose English or Tamil and tell us your exam so we can tailor your daily plan.',
}

export default function WelcomePage() {
  return <WelcomeFlow />
}
