const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('./database.sqlite');

// Realistic review data
const fakeReviews = [
  // Bul (Secret) - Have a Seat
  {
    productId: 91,
    userId: 3,
    rating: 5,
    title: "Amazing secret find!",
    comment: "Got this in my blind box and I'm so happy! The quality is incredible and it's even better in person. Definitely worth the money."
  },
  {
    productId: 91,
    userId: 5,
    rating: 4,
    title: "Great quality",
    comment: "Really nice figure. The details are perfect and it arrived quickly. Would buy again."
  },
  {
    productId: 91,
    userId: 6,
    rating: 5,
    title: "Perfect condition",
    comment: "Came in perfect condition. Love the secret variants, this one is my favorite so far."
  },
  {
    productId: 91,
    userId: 7,
    rating: 3,
    title: "Okay but expensive",
    comment: "It's nice but I think it's a bit overpriced for what you get. Quality is good though."
  },
  {
    productId: 91,
    userId: 8,
    rating: 5,
    title: "Exceeded expectations",
    comment: "Much better than I expected. The paint job is flawless and it's really well made."
  },

  // Box - Have a Seat
  {
    productId: 92,
    userId: 3,
    rating: 4,
    title: "Fun blind box experience",
    comment: "Love the surprise element. Got a figure I really wanted. Shipping was fast too."
  },
  {
    productId: 92,
    userId: 5,
    rating: 5,
    title: "Great for collecting",
    comment: "Perfect for building my collection. The mystery makes it exciting every time."
  },
  {
    productId: 92,
    userId: 6,
    rating: 4,
    title: "Good value",
    comment: "Reasonable price for what you get. The figures are always high quality."
  },
  {
    productId: 92,
    userId: 7,
    rating: 3,
    title: "Got a duplicate",
    comment: "Unfortunately got a duplicate of one I already have. But the quality is still good."
  },
  {
    productId: 92,
    userId: 8,
    rating: 5,
    title: "Addictive!",
    comment: "These are so addictive! Already ordered more. Great customer service too."
  },

  // Baba - Have a Seat
  {
    productId: 85,
    userId: 3,
    rating: 4,
    title: "Cute figure",
    comment: "Really cute design. Good quality for the price. Arrived quickly."
  },
  {
    productId: 85,
    userId: 5,
    rating: 5,
    title: "Love it!",
    comment: "Perfect addition to my collection. The details are amazing."
  },
  {
    productId: 85,
    userId: 6,
    rating: 4,
    title: "As expected",
    comment: "Exactly what I expected. Good quality and fast shipping."
  },
  {
    productId: 85,
    userId: 7,
    rating: 3,
    title: "Okay",
    comment: "It's fine. Nothing special but not bad either."
  },
  {
    productId: 85,
    userId: 8,
    rating: 5,
    title: "Great purchase",
    comment: "Really happy with this purchase. Will definitely buy more from this collection."
  },

  // Id (Secret) - Big Into Energy
  {
    productId: 99,
    userId: 3,
    rating: 5,
    title: "Incredible secret!",
    comment: "This secret variant is absolutely stunning. The colors are perfect and the quality is top notch."
  },
  {
    productId: 99,
    userId: 5,
    rating: 4,
    title: "Nice find",
    comment: "Happy I got this secret. The design is really unique compared to the regular ones."
  },
  {
    productId: 99,
    userId: 6,
    rating: 5,
    title: "Worth every penny",
    comment: "Expensive but totally worth it. The craftsmanship is incredible."
  },
  {
    productId: 99,
    userId: 7,
    rating: 4,
    title: "Good quality",
    comment: "Really nice quality. The paint job is flawless."
  },
  {
    productId: 99,
    userId: 8,
    rating: 5,
    title: "Amazing!",
    comment: "One of my favorite pieces in my collection. Absolutely love it!"
  },

  // Love - Big Into Energy
  {
    productId: 93,
    userId: 3,
    rating: 4,
    title: "Sweet design",
    comment: "Really sweet design. Good quality and arrived on time."
  },
  {
    productId: 93,
    userId: 5,
    rating: 5,
    title: "Perfect gift",
    comment: "Bought this as a gift and they loved it. Great quality."
  },
  {
    productId: 93,
    userId: 6,
    rating: 4,
    title: "Nice figure",
    comment: "Nice addition to my collection. The design is really cute."
  },
  {
    productId: 93,
    userId: 7,
    rating: 3,
    title: "Okay",
    comment: "It's okay. Nothing amazing but not bad either."
  },
  {
    productId: 93,
    userId: 8,
    rating: 5,
    title: "Love it!",
    comment: "Perfect for my collection. The details are really nice."
  },

  // Chestnut Cocoa (Secret) - Exciting Macarons
  {
    productId: 107,
    userId: 3,
    rating: 5,
    title: "Beautiful secret!",
    comment: "This secret variant is absolutely gorgeous. The colors are perfect and it's so well made."
  },
  {
    productId: 107,
    userId: 5,
    rating: 4,
    title: "Great find",
    comment: "Really happy with this purchase. The quality is excellent."
  },
  {
    productId: 107,
    userId: 6,
    rating: 5,
    title: "Exceeded expectations",
    comment: "Much better than I expected. The details are incredible."
  },
  {
    productId: 107,
    userId: 7,
    rating: 4,
    title: "Nice quality",
    comment: "Good quality for the price. Happy with my purchase."
  },
  {
    productId: 107,
    userId: 8,
    rating: 5,
    title: "Amazing!",
    comment: "One of my favorite pieces. The craftsmanship is outstanding."
  },

  // Some empty reviews (realistic)
  {
    productId: 85,
    userId: 3,
    rating: 4,
    title: "",
    comment: ""
  },
  {
    productId: 92,
    userId: 5,
    rating: 5,
    title: "",
    comment: ""
  },
  {
    productId: 93,
    userId: 6,
    rating: 3,
    title: "",
    comment: ""
  },
  {
    productId: 99,
    userId: 7,
    rating: 4,
    title: "",
    comment: ""
  },
  {
    productId: 107,
    userId: 8,
    rating: 5,
    title: "",
    comment: ""
  }
];

// Helper function to get random date within last 6 months
function getRandomDate() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime).toISOString();
}

// Insert reviews
db.serialize(() => {
  console.log('Adding fake reviews...');
  
  fakeReviews.forEach((review, index) => {
    const reviewId = `review_${uuidv4()}`;
    const createdAt = getRandomDate();
    
    db.run(`
      INSERT OR IGNORE INTO reviews (id, productId, userId, rating, title, comment, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      reviewId,
      review.productId,
      review.userId,
      review.rating,
      review.title,
      review.comment,
      createdAt
    ], (err) => {
      if (err) {
        console.error(`Error inserting review ${index + 1}:`, err.message);
      } else {
        console.log(`Added review ${index + 1} for product ${review.productId}`);
      }
    });
  });
  
  // Close database after all inserts
  setTimeout(() => {
    db.close();
    console.log('Finished adding fake reviews!');
  }, 2000);
});
