import Hero from "./components/Hero";
import FeaturedProducts from "./components/FeaturedProducts";
import Features from "./components/Features";
import Testimonials from "./components/Testimonials";
import EmailSignupForm from "./EmailSignupForm";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Labubu Collectibles - Premium Collectible Figures & Toys</title>
        <meta name="description" content="Discover authentic Labubu collectibles, limited edition figures, and exclusive releases. Fast shipping, secure checkout, and premium customer service." />
        <meta name="keywords" content="Labubu, Labubu collectibles, collectible figures, limited edition toys, Labubu blind boxes, premium collectibles" />
        <meta name="author" content="Labubu Collectibles" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://labubu.com" />
        <meta property="og:title" content="Labubu Collectibles - Premium Collectible Figures & Toys" />
        <meta property="og:description" content="Discover authentic Labubu collectibles, limited edition figures, and exclusive releases. Fast shipping, secure checkout, and premium customer service." />
        <meta property="og:image" content="/placeholder-product.svg" />
        <meta property="og:url" content="https://labubu.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Labubu Collectibles - Premium Collectible Figures & Toys" />
        <meta name="twitter:description" content="Discover authentic Labubu collectibles, limited edition figures, and exclusive releases. Fast shipping, secure checkout, and premium customer service." />
        <meta name="twitter:image" content="/placeholder-product.svg" />
      </Head>
      <div>
        <Hero />
        <FeaturedProducts />
        <Features />
        <Testimonials />
      
      {/* Email Signup Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stay in the Loop
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get notified about new Labubu launches, exclusive offers, and collectible news.
          </p>
          <div className="max-w-md mx-auto">
            <EmailSignupForm />
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
