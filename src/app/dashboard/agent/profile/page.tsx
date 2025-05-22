// src/app/dashboard/agent/profile/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AgentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    licenseNumber: '',
    licenseState: '',
    businessAddress: '',
    businessPhone: '',
    website: '',
    bio: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if user is authenticated and is an agent
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session.user.role !== 'AGENT') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, session, router]);
  
  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        
        // Initialize form data with profile data
        setFormData({
          companyName: data.user.companyName || '',
          licenseNumber: data.user.licenseNumber || '',
          licenseState: data.user.licenseState || '',
          businessAddress: data.user.businessAddress || '',
          businessPhone: data.user.businessPhone || '',
          website: data.user.website || '',
          bio: data.user.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      
      setSuccess('Profile updated successfully');
      
      // Refresh profile data
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-12 w-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/agent" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Edit Agent Profile</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="companyName" className="block text-gray-700 font-medium mb-1">
                Company/Brokerage Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="licenseNumber" className="block text-gray-700 font-medium mb-1">
                License Number
              </label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                value={formData.licenseNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="licenseState" className="block text-gray-700 font-medium mb-1">
                State/Province Licensed
              </label>
              <input
                id="licenseState"
                name="licenseState"
                type="text"
                value={formData.licenseState}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="businessPhone" className="block text-gray-700 font-medium mb-1">
                Business Phone
              </label>
              <input
                id="businessPhone"
                name="businessPhone"
                type="tel"
                value={formData.businessPhone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="businessAddress" className="block text-gray-700 font-medium mb-1">
                Business Address
              </label>
              <input
                id="businessAddress"
                name="businessAddress"
                type="text"
                value={formData.businessAddress}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="website" className="block text-gray-700 font-medium mb-1">
                Website (Optional)
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourdomain.com"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-gray-700 font-medium mb-1">
                Professional Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell clients about your experience and expertise in real estate..."
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard/agent')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}