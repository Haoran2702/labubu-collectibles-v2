"use client";

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { apiCall } from '../utils/api';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentProps {
  amount: number;
  orderData: any;
  onSuccess: (paymentIntentId: string, orderData: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

function CheckoutForm({ amount, orderData, onSuccess, onError, disabled }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  // Don't create payment intent on mount - wait for user to submit

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Defensive check for amount
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      addToast({
        type: 'error',
        title: 'Cart Error',
        message: 'Order total is invalid. Please check your cart.'
      });
      onError('Order total is invalid. Please check your cart.');
      return;
    }

    if (!stripe || !elements) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    // If no client secret, try to create payment intent
    if (!clientSecret) {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          onError('Authentication required. Please log in again.');
          return;
        }

        const response = await apiCall('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            currency: 'usd',
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            onError('Authentication expired. Please log in again.');
            return;
          }
          throw new Error(`Failed to create payment intent: ${response.status}`);
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        // Continue with payment after creating intent
        await processPayment(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          onError('Unable to connect to payment server. Please check your connection.');
        } else {
          onError('Failed to initialize payment');
        }
        setLoading(false);
        return;
      }
    } else {
      // Process payment with existing client secret
      await processPayment(clientSecret);
    }
  };

  const processPayment = async (secret: string) => {
    if (!stripe || !elements) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.firstName + ' ' + user?.lastName,
            email: user?.email,
          },
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
        addToast({
          type: 'error',
          title: 'Payment Failed',
          message: error.message || 'There was an error processing your payment.',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id, { ...orderData, paymentIntentId: paymentIntent.id });
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError('Payment processing failed');
      addToast({
        type: 'error',
        title: 'Payment Error',
        message: 'There was an error processing your payment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-300">
        <CardElement options={cardElementOptions} />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || loading || disabled}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function StripePayment({ amount, orderData, onSuccess, onError }: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} orderData={orderData} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
} 