import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-24 text-center bg-white">
      <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Labubu Collectibles</h1>
      <p className="text-xl text-gray-500 mb-8">Discover viral Labubu toys & figures. Limited editions, exclusive designs, and fast shipping.</p>
      <Link href="/products" className="inline-block px-8 py-3 rounded-full bg-black text-white font-semibold text-lg tracking-wide hover:bg-gray-800 transition-colors">Shop Now</Link>
    </section>
  );
} 