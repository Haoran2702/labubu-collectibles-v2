"use client";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Labubu Collectibles</h1>
          <p className="text-lg text-gray-600">
            Your trusted source for authentic Labubu collectibles and exclusive editions.
          </p>
        </div>

        <div className="space-y-12">
          {/* Our Story */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                We are passionate collectors who understand the value of authentic, high-quality collectibles. 
                Our mission is to provide genuine Labubu products to fellow enthusiasts who appreciate the 
                craftsmanship and artistry behind each piece.
              </p>
              <p className="text-gray-600 mb-4">
                As a small, dedicated business, we take pride in curating our collection with care, 
                ensuring every item meets our standards for authenticity and quality.
              </p>
            </div>
          </section>

          {/* Authenticity Commitment */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Commitment to Authenticity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Quality Sourcing</h3>
                <p className="text-blue-700 text-sm">
                  We carefully select our products from reputable sources and authorized distributors 
                  to ensure the highest standards of authenticity and quality.
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">Product Verification</h3>
                <p className="text-green-700 text-sm">
                  Each item in our collection undergoes thorough inspection to verify its authenticity 
                  and ensure it meets our quality standards before being offered to our customers.
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3">Transparent Information</h3>
                <p className="text-purple-700 text-sm">
                  We provide detailed product information and clear descriptions to help you make 
                  informed decisions about your collectible purchases.
                </p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-3">Customer Trust</h3>
                <p className="text-orange-700 text-sm">
                  Your trust is our priority. We stand behind the quality of our products and are 
                  committed to providing excellent customer service and support.
                </p>
              </div>
            </div>
          </section>

          {/* What Makes Us Different */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What Makes Us Different</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Curated Selection</h3>
                  <p className="text-gray-600 text-sm">
                    We don't just sell products - we curate a carefully selected collection of 
                    the finest Labubu pieces, each chosen for its quality and appeal.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quality Assurance</h3>
                  <p className="text-gray-600 text-sm">
                    Every product in our inventory is personally inspected to ensure it meets 
                    our high standards for condition, authenticity, and presentation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personal Service</h3>
                  <p className="text-gray-600 text-sm">
                    As a small business, we provide personalized attention to every customer. 
                    We're here to help you find the perfect addition to your collection.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-white text-sm font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Secure Packaging</h3>
                  <p className="text-gray-600 text-sm">
                    We understand the value of your collectibles. Every item is carefully packaged 
                    to ensure it arrives in perfect condition, protected during transit.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Authenticity</h3>
                <p className="text-gray-600 text-sm">
                  We are committed to offering only genuine, high-quality products that meet 
                  the standards collectors expect.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Passion</h3>
                <p className="text-gray-600 text-sm">
                  Our love for collectibles drives everything we do, from product selection 
                  to customer service.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
                <p className="text-gray-600 text-sm">
                  We're part of the collector community and understand what makes a great 
                  collectible experience.
                </p>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="bg-gray-50 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h2>
            <p className="text-gray-600 mb-6">
              We're here to help you find the perfect addition to your collection. 
              Get in touch with us for personalized assistance.
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Contact Us
            </a>
          </section>
        </div>
      </div>
    </div>
  );
} 