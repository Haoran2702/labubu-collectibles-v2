import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./contexts/CartContext";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import { CookieProvider } from "./contexts/CookieContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminLayoutClient from "./admin/AdminLayoutClient";
import CookieConsentWrapper from "./components/CookieConsentWrapper";
import ErrorBoundary from "./components/ErrorBoundary";
import StructuredData from "./components/StructuredData";
import GoogleAnalytics from "./components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Labubu Collectibles – Viral Labubu Toys & Figures",
  description: "Shop the latest Labubu collectibles, toys, and figures. Limited editions, fast shipping, and secure checkout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Google Analytics placeholder */}
        {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </script> */}
        <meta property="og:title" content="Labubu Collectibles – Viral Labubu Toys & Figures" />
        <meta property="og:description" content="Shop the latest Labubu collectibles, toys, and figures. Limited editions, fast shipping, and secure checkout." />
        <meta property="og:image" content="/placeholder-product.svg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Labubu Collectibles – Viral Labubu Toys & Figures" />
        <meta name="twitter:description" content="Shop the latest Labubu collectibles, toys, and figures. Limited editions, fast shipping, and secure checkout." />
        <meta name="twitter:image" content="/placeholder-product.svg" />
        <StructuredData 
          type="organization" 
          data={{
            name: "Labubu Collectibles",
            url: "https://labubu.com",
            description: "Your trusted source for authentic Labubu collectibles and exclusive editions."
          }} 
        />
        <StructuredData 
          type="website" 
          data={{
            name: "Labubu Collectibles",
            url: "https://labubu.com",
            description: "Shop the latest Labubu collectibles, toys, and figures. Limited editions, fast shipping, and secure checkout."
          }} 
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <CookieProvider>
              <CartProvider>
                <CurrencyProvider>
                  <ToastProvider>
                    <AdminLayoutClient>{children}</AdminLayoutClient>
                    <CookieConsentWrapper />
                    <GoogleAnalytics />
                  </ToastProvider>
                </CurrencyProvider>
              </CartProvider>
            </CookieProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
