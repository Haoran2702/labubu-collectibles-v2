"use client";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  image: string;
  stock: number;
  collection: string;
}

interface StructuredDataProps {
  type: 'product' | 'organization' | 'website';
  data: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const generateStructuredData = () => {
    switch (type) {
      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data.name,
          "description": data.description,
          "image": data.imageUrl || data.image,
          "brand": {
            "@type": "Brand",
            "name": "Labubu"
          },
          "offers": {
            "@type": "Offer",
            "price": data.price,
            "priceCurrency": "USD",
            "availability": data.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": `https://labubu.com/products/${data.id}`
          },
          "category": data.collection
        };
      
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Labubu Collectibles",
          "url": "https://labubu.com",
          "logo": "https://labubu.com/favicon.svg",
          "description": "Your trusted source for authentic Labubu collectibles and exclusive editions.",
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "url": "https://labubu.com/contact"
          },
          "sameAs": [
            "https://instagram.com/labubucollectibles",
            "https://facebook.com/labubucollectibles"
          ]
        };
      
      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Labubu Collectibles",
          "url": "https://labubu.com",
          "description": "Shop the latest Labubu collectibles, toys, and figures. Limited editions, fast shipping, and secure checkout.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://labubu.com/products?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        };
      
      default:
        return null;
    }
  };

  const structuredData = generateStructuredData();
  
  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 