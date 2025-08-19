"use client";

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How long does shipping take?",
    answer: "We ship worldwide using DHL Express. Delivery times vary by location, typically 3-7 business days for most countries."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Stripe and PayPal for secure payments."
  },
  {
    question: "Can I return my order?",
    answer: "Yes, you have the right to return items within 14 days of delivery under EU consumer law. Items must be unused and in original packaging."
  },
  {
    question: "Do you offer warranty?",
    answer: "We do not offer additional warranties beyond the statutory rights provided by EU consumer law. All products are sold as-is, subject to your statutory consumer rights."
  },
  {
    question: "How can I contact you?",
    answer: "You can contact us at tancredi.m.buzzi@gmail.com. We respond within 24 hours."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship worldwide. Import duties may apply in some countries."
  },
  {
    question: "How do I track my order?",
    answer: "You'll receive a tracking number via email when your order ships. You can track it on the DHL website."
  },
  {
    question: "What if my order arrives damaged?",
    answer: "Contact us immediately with photos of the damage. We'll handle the return and provide a replacement or refund."
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about our products and services.
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openItems.includes(index) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openItems.includes(index) && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Still have questions? We're here to help!
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
} 