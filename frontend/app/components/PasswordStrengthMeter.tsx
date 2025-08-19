"use client";

import { useState, useEffect } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface StrengthCriteria {
  label: string;
  test: (password: string) => boolean;
  color: string;
}

const criteria: StrengthCriteria[] = [
  {
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
    color: 'bg-red-500'
  },
  {
    label: 'Contains lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
    color: 'bg-orange-500'
  },
  {
    label: 'Contains uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
    color: 'bg-yellow-500'
  },
  {
    label: 'Contains number',
    test: (password: string) => /\d/.test(password),
    color: 'bg-blue-500'
  },
  {
    label: 'Contains special character',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    color: 'bg-green-500'
  }
];

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0);
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setMessage('');
      setColor('');
      return;
    }

    const passedCriteria = criteria.filter(criterion => criterion.test(password));
    const strengthPercentage = (passedCriteria.length / criteria.length) * 100;
    
    setStrength(strengthPercentage);

    // Set message and color based on strength
    if (strengthPercentage === 0) {
      setMessage('Very Weak');
      setColor('bg-red-500');
    } else if (strengthPercentage <= 20) {
      setMessage('Weak');
      setColor('bg-red-500');
    } else if (strengthPercentage <= 40) {
      setMessage('Fair');
      setColor('bg-orange-500');
    } else if (strengthPercentage <= 60) {
      setMessage('Good');
      setColor('bg-yellow-500');
    } else if (strengthPercentage <= 80) {
      setMessage('Strong');
      setColor('bg-blue-500');
    } else {
      setMessage('Very Strong');
      setColor('bg-green-500');
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2">
      {/* Strength bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${strength}%` }}
        />
      </div>
      
      {/* Strength message */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${color.replace('bg-', 'text-')}`}>
          {message}
        </span>
        <span className="text-gray-500">
          {Math.round(strength)}%
        </span>
      </div>

      {/* Criteria checklist */}
      <div className="mt-3 space-y-1">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center text-xs">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              criterion.test(password) ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span className={criterion.test(password) ? 'text-green-600' : 'text-gray-500'}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 