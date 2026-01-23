'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = process.env.NODE_ENV === 'development'
    ? error.message
    : 'Something went wrong!';
  return (
    <html>
      <body>
        <h2>{message}</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
