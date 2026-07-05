/**
 * Landing v2 — brand logo with 3D hover.
 * Renders the official artwork /centumania-logo.png (1254×1254 source;
 * next/image serves it resized + optimized) inside a perspective wrapper;
 * tilt + lift on hover, gentle idle float. Styles live in LandingV2's CSS
 * block (.lv2-logo-wrap / .lv2-logo) so reduced-motion is a media query.
 */
import Image from 'next/image'

export default function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`lv2-logo-wrap ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/centumania-logo.png"
        alt="CentuMania logo"
        width={size}
        height={size}
        className="lv2-logo"
        priority
      />
    </span>
  )
}
