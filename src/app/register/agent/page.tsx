// src/app/register/agent/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define validation schema for agent registration
const agentRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string(),
  
  // Agent specific fields
  companyName: z.string().min(2, 'Company name is required'),
  licenseNumber: z.string().min(2, 'License number is required'),
  licenseState: z.string().min(2, 'State is required'),
  businessAddress: z.string().min(5, 'Business address is required'),
  businessPhone: z.string().min(10, 'Business phone is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal(''))
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type AgentFormValues = z.infer<typeof agentRegisterSchema>;

export default function AgentRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<AgentFormValues>({
    resolver: zodResolver(agentRegisterSchema)
  });
  
  const onSubmit = async (data: AgentFormValues) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Register the agent
      const response = await fetch('/api/auth/register/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          role: 'AGENT'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }
      
      setSuccess('Registration successful! You can now log in with your credentials.');
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Real Estate Agent Registration</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-gray-700 font-medium mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium mb-4">Professional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-gray-700 font-medium mb-1">
                  Company/Brokerage Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  {...register('companyName')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.companyName && (
                  <p className="text-red-600 text-sm mt-1">{errors.companyName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="businessPhone" className="block text-gray-700 font-medium mb-1">
                  Business Phone
                </label>
                <input
                  id="businessPhone"
                  type="tel"
                  {...register('businessPhone')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.businessPhone && (
                  <p className="text-red-600 text-sm mt-1">{errors.businessPhone.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="licenseNumber" className="block text-gray-700 font-medium mb-1">
                  License Number
                </label>
                <input
                  id="licenseNumber"
                  type="text"
                  {...register('licenseNumber')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.licenseNumber && (
                  <p className="text-red-600 text-sm mt-1">{errors.licenseNumber.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="licenseState" className="block text-gray-700 font-medium mb-1">
                  State/Province Licensed
                </label>
                <input
                  id="licenseState"
                  type="text"
                  {...register('licenseState')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.licenseState && (
                  <p className="text-red-600 text-sm mt-1">{errors.licenseState.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="businessAddress" className="block text-gray-700 font-medium mb-1">
                  Business Address
                </label>
                <input
                  id="businessAddress"
                  type="text"
                  {...register('businessAddress')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.businessAddress && (
                  <p className="text-red-600 text-sm mt-1">{errors.businessAddress.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="website" className="block text-gray-700 font-medium mb-1">
                  Website (Optional)
                </label>
                <input
                  id="website"
                  type="url"
                  {...register('website')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourdomain.com"
                />
                {errors.website && (
                  <p className="text-red-600 text-sm mt-1">{errors.website.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-gray-700 font-medium mb-1">
                  Professional Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  {...register('bio')}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about your experience and expertise in real estate..."
                ></textarea>
                {errors.bio && (
                  <p className="text-red-600 text-sm mt-1">{errors.bio.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-1/2 bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Processing...' : 'Register as Agent'}
            </button>
            
            <p className="mt-4 text-gray-600 text-sm">
              By registering, you agree to our Terms of Service and Privacy Policy.
            </p>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}