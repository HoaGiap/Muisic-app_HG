const Eye = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const EyeOff = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M2 12s3.5-6 10-6c2.2 0 4 .6 5.6 1.6M22 12s-3.5 6-10 6c-2.2 0-4-.6-5.6-1.6"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);
