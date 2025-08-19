"use client";

import { useState } from 'react';
import DataRightsForm from '../components/DataRightsForm';

export default function Legal() {
  const [showDataRightsForm, setShowDataRightsForm] = useState(false);

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Legal</h1>
          <p className="text-xl text-gray-500 mb-8">Legal information for Labubu Collectibles.</p>
        </header>
        <div className="space-y-12 text-left mx-auto">
          <section id="privacy-policy" className="scroll-mt-20">
            <h2 className="font-bold text-2xl text-gray-900 mb-4">Privacy Policy</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                Labubu Collectibles ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and make purchases.
              </p>
              
              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Information We Collect</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Personal Information:</strong> Name, email address, shipping address, phone number, and payment information</li>
                <li><strong>Order Information:</strong> Purchase history, order details, and shipping information</li>
                <li><strong>Technical Information:</strong> IP address, browser type, device information, and cookies</li>
                <li><strong>Usage Information:</strong> Pages visited, time spent on site, and interaction with features</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">How We Use Your Information</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders and account</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our website and services</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Your Rights (GDPR)</h3>
              <p className="text-gray-600 mb-4">Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to processing of your data</li>
                <li><strong>Withdrawal:</strong> Withdraw consent at any time</li>
              </ul>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Exercise Your Rights</h4>
                <p className="text-blue-700 text-sm mb-3">
                  You can exercise any of these rights by submitting a request through our secure form.
                </p>
                <button
                  onClick={() => setShowDataRightsForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Data Rights Request
                </button>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Data Retention</h3>
              <p className="text-gray-600 mb-4">We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Account Data:</strong> Retained until account deletion or 3 years of inactivity</li>
                <li><strong>Order Data:</strong> Retained for 7 years for tax and accounting purposes</li>
                <li><strong>Marketing Data:</strong> Retained until consent withdrawal or 2 years of inactivity</li>
                <li><strong>Analytics Data:</strong> Retained for 26 months (anonymized after 14 months)</li>
                <li><strong>Support Data:</strong> Retained for 2 years after ticket resolution</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Data Processing Purposes</h3>
              <p className="text-gray-600 mb-4">We process your personal data for the following specific purposes:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Order Processing:</strong> To process and fulfill your orders, including payment processing and shipping</li>
                <li><strong>Customer Support:</strong> To provide customer service and respond to your inquiries</li>
                <li><strong>Account Management:</strong> To manage your account and provide personalized services</li>
                <li><strong>Marketing (with consent):</strong> To send promotional offers and newsletters</li>
                <li><strong>Analytics (with consent):</strong> To improve our website and services</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and prevent fraud</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Data Sharing</h3>
              <p className="text-gray-600 mb-4">We may share your data with the following third parties:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Payment Processors:</strong> Stripe and PayPal for secure payment processing</li>
                <li><strong>Shipping Partners:</strong> DHL and other carriers for order delivery</li>
                <li><strong>Analytics Providers:</strong> Google Analytics (with consent) for website analytics</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Data Security</h3>
              <p className="text-gray-600 mb-4">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security assessments.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Data Breach Notification</h3>
              <p className="text-gray-600 mb-4">
                In the event of a data breach that poses a risk to your rights and freedoms, we will notify the relevant supervisory authority within 72 hours and inform affected individuals without undue delay.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">International Data Transfers</h3>
              <p className="text-gray-600 mb-4">
                Your data may be transferred to and processed in countries outside the European Economic Area (EEA). We ensure appropriate safeguards are in place through Standard Contractual Clauses and adequacy decisions.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Automated Decision Making</h3>
              <p className="text-gray-600 mb-4">
                We do not make automated decisions that significantly affect you without human intervention. If this changes, you will be informed and have the right to request human review.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Contact Us</h3>
              <p className="text-gray-600 mb-4">
                For privacy-related inquiries or to exercise your rights, please contact us at:<br />
                Email: privacy@labubu-collectibles.com<br />
                Address: [Your Business Address]<br />
                Data Protection Officer: dpo@labubu-collectibles.com
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Supervisory Authority</h3>
              <p className="text-gray-600 mb-4">
                You have the right to lodge a complaint with your local data protection supervisory authority if you believe we have not addressed your concerns adequately.
              </p>
            </div>
          </section>

          <section id="cookie-policy" className="border-t border-gray-100 pt-10 scroll-mt-20">
            <h2 className="font-bold text-2xl text-gray-900 mb-4">Cookie Policy</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to enhance your browsing experience and analyze site traffic. This policy explains what cookies we use, why we use them, and how you can control them.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">What Are Cookies?</h3>
              <p className="text-gray-600 mb-4">
                Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and analyzing how you use our site.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Types of Cookies We Use</h3>
              
              <h4 className="font-medium text-gray-900 mt-4 mb-2">Necessary Cookies (Always Active)</h4>
              <p className="text-gray-600 mb-4">
                These cookies are essential for the website to function properly. They enable basic functions like page navigation, secure areas access, and shopping cart functionality. These cookies do not store any personally identifiable information.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Necessary Cookies We Use:</h5>
                                 <ul className="list-disc pl-6 text-gray-600 space-y-1 text-sm">
                   <li><strong>labubu_cookie_consent</strong> - Stores your cookie consent preferences (1 year)</li>
                   <li><strong>authToken</strong> - Stores your authentication token for logged-in sessions (until logout)</li>
                   <li><strong>admin_jwt</strong> - Stores admin authentication token (session only)</li>
                   <li><strong>guestCart</strong> - Stores shopping cart items for guest users (until browser close)</li>
                   <li><strong>redirectAfterLogin</strong> - Stores redirect path after login (session only)</li>
                   <li><strong>ticket_last_seen_[id]</strong> - Stores last seen timestamp for support tickets (session only)</li>
                 </ul>
              </div>

              <h4 className="font-medium text-gray-900 mt-4 mb-2">Analytics Cookies (Optional)</h4>
              <p className="text-gray-600 mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and services.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Analytics Cookies (Currently Not Active):</h5>
                <ul className="list-disc pl-6 text-gray-600 space-y-1 text-sm">
                  <li><strong>Google Analytics</strong> - Website analytics and performance tracking (26 months)</li>
                  <li><strong>_ga</strong> - Google Analytics user identification (2 years)</li>
                  <li><strong>_gid</strong> - Google Analytics session identification (24 hours)</li>
                  <li><strong>_gat</strong> - Google Analytics request rate limiting (1 minute)</li>
                </ul>
              </div>

              <h4 className="font-medium text-gray-900 mt-4 mb-2">Marketing Cookies (Optional)</h4>
              <p className="text-gray-600 mb-4">
                These cookies are used to deliver personalized advertisements and content. They may be set by us or third-party advertising partners.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Marketing Cookies (Currently Not Active):</h5>
                <ul className="list-disc pl-6 text-gray-600 space-y-1 text-sm">
                  <li><strong>Facebook Pixel</strong> - Social media advertising tracking (90 days)</li>
                  <li><strong>Google Ads</strong> - Google advertising conversion tracking (90 days)</li>
                  <li><strong>Retargeting Cookies</strong> - Personalized advertising based on browsing history (30 days)</li>
                </ul>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Third-Party Cookies</h3>
              <p className="text-gray-600 mb-4">
                We may use third-party services that set their own cookies. These services include:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <ul className="list-disc pl-6 text-gray-600 space-y-1 text-sm">
                  <li><strong>Stripe</strong> - Payment processing (necessary for checkout)</li>
                  <li><strong>PayPal</strong> - Payment processing (necessary for checkout)</li>
                  <li><strong>DHL</strong> - Shipping tracking (necessary for order tracking)</li>
                </ul>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Managing Your Cookie Preferences</h3>
              <p className="text-gray-600 mb-4">
                You have several options for managing cookies:
              </p>
              
              <div className="space-y-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Cookie Consent Banner</h5>
                  <p className="text-blue-700 text-sm">
                    Use our cookie consent banner to control which types of cookies you allow. You can change your preferences at any time by clicking the "Customize" button in the banner.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Browser Settings</h5>
                  <p className="text-gray-700 text-sm">
                    You can control cookies through your browser settings. However, disabling necessary cookies may affect website functionality.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Device Settings</h5>
                  <p className="text-gray-700 text-sm">
                    On mobile devices, you can control cookies through your device's privacy settings.
                  </p>
                </div>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Cookie Retention Periods</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <ul className="list-disc pl-6 text-gray-600 space-y-1 text-sm">
                  <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                  <li><strong>Persistent Cookies:</strong> Remain until expiration date or manual deletion</li>
                  <li><strong>Authentication Tokens:</strong> Until logout or expiration</li>
                  <li><strong>Analytics Cookies:</strong> Up to 26 months (if enabled)</li>
                  <li><strong>Marketing Cookies:</strong> Up to 90 days (if enabled)</li>
                </ul>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Updates to This Policy</h3>
              <p className="text-gray-600 mb-4">
                We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Contact Us</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about our use of cookies, please contact us at:<br />
                Email: privacy@labubu-collectibles.com
              </p>
            </div>
          </section>

          <section id="terms-of-service" className="border-t border-gray-100 pt-10 scroll-mt-20">
            <h2 className="font-bold text-2xl text-gray-900 mb-4">Terms of Service</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                By using our website and services, you agree to these terms and conditions. These terms apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h3>
              <p className="text-gray-600 mb-4">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">2. Use License</h3>
              <p className="text-gray-600 mb-4">
                Permission is granted to temporarily download one copy of the materials (information or software) on Labubu Collectibles's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">3. Account Registration and Security</h3>
              <p className="text-gray-600 mb-4">
                To access certain features of our website, you may be required to create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Maintaining the confidentiality of your account and password</li>
                <li>Restricting access to your computer and mobile devices</li>
                <li>Accepting responsibility for all activities that occur under your account</li>
                <li>Providing accurate and complete information when creating your account</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">4. Product Information and Pricing</h3>
              <p className="text-gray-600 mb-4">
                We strive to provide accurate product information, but we do not warrant that product descriptions, colors, information, or other content available on the site is accurate, complete, reliable, current, or error-free.
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Prices are subject to change without notice</li>
                <li>Product availability is not guaranteed</li>
                <li>Images are for illustrative purposes only</li>
                <li>We reserve the right to modify or discontinue any product at any time</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">5. Order Processing and Acceptance</h3>
              <p className="text-gray-600 mb-4">
                All orders are subject to acceptance and availability. We reserve the right to refuse service to anyone for any reason at any time.
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Orders are processed in the order they are received</li>
                <li>We may cancel orders if products are unavailable</li>
                <li>We may limit quantities or refuse orders that appear to be placed by dealers or resellers</li>
                <li>Order confirmation emails do not constitute acceptance of your order</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">6. Payment Terms</h3>
              <p className="text-gray-600 mb-4">
                Payment is due at the time of order placement. We accept payment through secure third-party processors including Stripe and PayPal.
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>All prices are in EUR and include applicable taxes</li>
                <li>Payment processing fees may apply</li>
                <li>Failed payments may result in order cancellation</li>
                <li>We do not store your payment information on our servers</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">7. Right of Withdrawal (EU Consumer Rights)</h3>
              <p className="text-gray-600 mb-4">
                Under EU consumer law, you have the right to withdraw from your purchase within 14 days of receiving your order, without giving any reason. This right applies to all purchases made through our website.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Withdrawal Period:</h4>
                <ul className="list-disc pl-6 text-blue-700 space-y-1 text-sm">
                  <li>14 days from the day you receive the goods</li>
                  <li>14 days from the day you receive the last item (for multiple items)</li>
                  <li>14 days from the day you receive the first item (for recurring deliveries)</li>
                </ul>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">8. Shipping and Delivery</h3>
              <p className="text-gray-600 mb-4">
                We ship worldwide using reliable carriers. Delivery times are estimates and may vary based on location and carrier availability.
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Shipping costs are calculated at checkout</li>
                <li>Delivery times are estimates only</li>
                <li>Risk of loss and title pass to you upon delivery</li>
                <li>We are not responsible for delays beyond our control</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">9. Intellectual Property Rights</h3>
              <p className="text-gray-600 mb-4">
                The content on this website, including but not limited to text, graphics, images, logos, and software, is the property of Labubu Collectibles and is protected by copyright and other intellectual property laws.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">10. Prohibited Uses</h3>
              <p className="text-gray-600 mb-4">
                You may not use our website for any unlawful purpose or to solicit others to perform unlawful acts. You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Transmit viruses or any code of a destructive nature</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Use automated systems to access the service</li>
              </ul>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">11. Limitation of Liability</h3>
              <p className="text-gray-600 mb-4">
                Our liability is limited to the amount you paid for the product. We are not liable for indirect, incidental, or consequential damages.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Limitations:</h4>
                <ul className="list-disc pl-6 text-gray-600 space-y-1 text-sm">
                  <li>Maximum liability limited to purchase price</li>
                  <li>No liability for indirect or consequential damages</li>
                  <li>No liability for third-party actions</li>
                  <li>No liability for force majeure events</li>
                </ul>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">12. Indemnification</h3>
              <p className="text-gray-600 mb-4">
                You agree to indemnify and hold harmless Labubu Collectibles and its affiliates from any claims, damages, or expenses arising from your use of the website or violation of these terms.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">13. Governing Law and Jurisdiction</h3>
              <p className="text-gray-600 mb-4">
                These terms are governed by the laws of Italy. Any disputes shall be resolved in the courts of Italy, with preference for alternative dispute resolution methods.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">14. Changes to Terms</h3>
              <p className="text-gray-600 mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of the modified terms.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">15. Contact Information</h3>
              <p className="text-gray-600 mb-4">
                For questions about these terms, please contact us at:<br />
                Email: legal@labubu-collectibles.com<br />
                Address: [Your Business Address]
              </p>
            </div>
          </section>

          <section id="shipping-delivery" className="border-t border-gray-100 pt-10 scroll-mt-20">
            <h2 className="font-bold text-2xl text-gray-900 mb-4">Shipping & Delivery</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                We ship worldwide using DHL Express. All orders include tracking numbers and insurance.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Contact Information</h3>
              <p className="text-gray-600 mb-4">
                For shipping-related questions, please contact us:<br />
                Email: tancredi.m.buzzi@gmail.com<br />
                Response Time: Within 24 hours
              </p>
            </div>
          </section>

          <section id="return-policy" className="border-t border-gray-100 pt-10 scroll-mt-20">
            <h2 className="font-bold text-2xl text-gray-900 mb-4">Return Policy</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                You have the right to return items within 14 days of delivery under EU consumer law. Items must be unused and in original packaging.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Contact Information</h3>
              <p className="text-gray-600 mb-4">
                For returns, please contact us:<br />
                Email: tancredi.m.buzzi@gmail.com<br />
                Response Time: Within 24 hours
              </p>
            </div>
          </section>

          <section id="warranty" className="border-t border-gray-100 pt-10 scroll-mt-20">
            <h2 className="font-bold text-2xl text-gray-900 mb-4">Warranty Information</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                We do not offer additional warranties beyond the statutory rights provided by EU consumer law. All products are sold as-is, subject to your statutory consumer rights.
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Statutory Warranty Rights (EU Consumer Law)</h3>
              <p className="text-gray-600 mb-4">
                Under EU consumer law, you have the following statutory rights:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Your Statutory Rights:</h4>
                <ul className="list-disc pl-6 text-blue-700 space-y-1 text-sm">
                  <li><strong>Conformity:</strong> Products must conform to the contract (as described, fit for purpose)</li>
                  <li><strong>Defects:</strong> Right to claim for defects that existed at the time of delivery</li>
                  <li><strong>Remedies:</strong> Right to repair, replacement, price reduction, or contract termination</li>
                  <li><strong>Time Limit:</strong> 2 years from delivery for defects (minimum)</li>
                  <li><strong>Burden of Proof:</strong> Seller must prove conformity for first 6 months</li>
                </ul>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">No Additional Warranty</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">What This Means:</h4>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                  <li>We do not offer extended warranties or additional protection plans</li>
                  <li>All products are sold "as-is" subject to statutory rights</li>
                  <li>No warranty coverage for normal wear and tear</li>
                  <li>No warranty coverage for accidental damage</li>
                  <li>No warranty coverage for environmental damage</li>
                </ul>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Contact Information</h3>
              <p className="text-gray-600 mb-4">
                For questions about statutory rights or product defects, please contact us:<br />
                Email: tancredi.m.buzzi@gmail.com<br />
                Response Time: Within 24 hours
              </p>
            </div>
          </section>

          <section id="dispute-resolution" className="border-t border-gray-100 pt-10 scroll-mt-20">
            <h2 className="font-bold text-2xl text-gray-900 mb-4">Dispute Resolution</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                For disputes, please contact us first. Under EU law, you also have the right to use the EU's Online Dispute Resolution platform: ec.europa.eu/consumers/odr
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Contact Information</h3>
              <p className="text-gray-600 mb-4">
                For dispute resolution, please contact us:<br />
                Email: tancredi.m.buzzi@gmail.com<br />
                Response Time: Within 24 hours
              </p>
            </div>
          </section>

          <section id="contact-information" className="border-t border-gray-100 pt-10 scroll-mt-20">
            <h2 className="font-bold text-2xl text-gray-900 mb-4">Contact Information</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                For all inquiries, please contact us:
              </p>

              <h3 className="font-semibold text-lg text-gray-900 mt-6 mb-3">Contact Details</h3>
              <p className="text-gray-600 mb-4">
                Email: tancredi.m.buzzi@gmail.com<br />
                Response Time: Within 24 hours
              </p>
            </div>
          </section>
        </div>
      </div>
      
      {showDataRightsForm && (
        <DataRightsForm onClose={() => setShowDataRightsForm(false)} />
      )}
    </div>
  );
} 