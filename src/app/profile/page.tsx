// src/app/profile/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, isLoading } = useAuth({ required: true });
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  
  // Initialize name when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Here you would implement the profile update logic
    setIsEditing(false);
  };
  
  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-lg shadow p-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
            />
            <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Name</h2>
            <p className="mt-1 text-sm text-gray-900">{user.name}</p>
          </div>
          
          <div>
            <h2 className="text-sm font-medium text-gray-500">Email</h2>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <h2 className="text-sm font-medium text-gray-500">Role</h2>
            <p className="mt-1 text-sm text-gray-900">{user.role}</p>
          </div>
          
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}