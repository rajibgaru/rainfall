// src/app/error.tsx
'use client';

import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Something went wrong!</h2>
        <p className="mt-2 text-sm text-gray-600">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="mt-5">
          <button
            onClick={reset}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}