/** Logo SIPETILANG */
export default function Logo({ size = 32, showText = true, hideTextOnMobile = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="20" fill="#EAF3FF" />
        <circle cx="24" cy="12" r="3.2" fill="#155fdc" />
        <path
          d="M8 19c2.2 2.2 4.4 2.2 6.6 0 2.2-2.2 4.4-2.2 6.6 0 2.2 2.2 4.4 2.2 6.6 0 2.2-2.2 4.4-2.2 6.6 0"
          stroke="#155fdc"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M6 25c2.2 2.2 4.4 2.2 6.6 0 2.2-2.2 4.4-2.2 6.6 0 2.2 2.2 4.4 2.2 6.6 0 2.2-2.2 4.4-2.2 6.6 0 2.2 2.2 4.4 2.2 6.6 0"
          stroke="#59b0ff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      {showText && (
        <span
          className={`text-xl font-bold tracking-tight text-primary-700 ${
            hideTextOnMobile ? 'hidden sm:inline' : ''
          }`}
        >
          SIPETILANG
        </span>
      )}
    </div>
  )
}
