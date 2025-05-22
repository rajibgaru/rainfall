// src/components/LogoutButton.tsx
'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-red-600 hover:text-red-800"
    >
      Sign Out
    </button>
  );
}