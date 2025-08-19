"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface Review {
  id: string;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  helpful: number;
  verified: boolean;
  images?: string[];
}

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: [] as File[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productId]);

  useEffect(() => {
    // Check if current user has already reviewed this product
    if (user && reviews.length > 0) {
      const userReview = reviews.find(review => review.userId === user.id);
      setHasUserReviewed(!!userReview);
    } else {
      setHasUserReviewed(false);
    }
  }, [reviews, user]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/reviews/products/${productId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length + newReview.images.length > 5) {
      addToast({
        type: 'error',
        title: 'Too Many Images',
        message: 'You can upload a maximum of 5 images per review.'
      });
      return;
    }

    setNewReview(prev => ({
      ...prev,
      images: [...prev.images, ...imageFiles]
    }));
  };

  const removeImage = (index: number) => {
    setNewReview(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to leave a review.'
      });
      return;
    }

    if (!newReview.title.trim() || !newReview.comment.trim()) {
      addToast({
        type: 'error',
        title: 'Review Incomplete',
        message: 'Please fill in both title and comment fields.'
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('rating', newReview.rating.toString());
      formData.append('title', newReview.title);
      formData.append('comment', newReview.comment);
      
      newReview.images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const response = await fetch(`/api/reviews/products/${productId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Review Submitted',
          message: 'Thank you for your review!'
        });
        setNewReview({ rating: 5, title: '', comment: '', images: [] });
        setShowReviewForm(false);
        fetchReviews();
        fetchStats();
      } else {
        const error = await response.json();
        
        // Check for specific error messages
        if (error.message && error.message.includes('already reviewed')) {
          addToast({
            type: 'info',
            title: 'Review Already Submitted',
            message: 'You have already submitted a review for this product. You can only submit one review per product.'
          });
          setShowReviewForm(false);
          return;
        }
        
        throw new Error(error.message || 'Failed to submit review');
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Review Failed',
        message: error.message || 'Failed to submit review. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md', interactive = false, onStarClick?: (star: number) => void) => {
    const stars = [];
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onStarClick?.(i)}
          disabled={!interactive}
          className={`${interactive ? 'hover:scale-110 transition-transform' : ''} ${!interactive ? 'cursor-default' : ''}`}
        >
          <svg
            className={`${sizeClasses[size]} ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const averageRating = stats?.averageRating || 0;
  const totalReviews = stats?.totalReviews || 0;

  return (
    <div className="w-full py-8 border-t border-gray-100">
      {/* Reviews Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Customer Reviews</h3>
        {totalReviews > 0 && (
          <div className="flex items-center justify-center gap-2 mb-2">
            {renderStars(averageRating, 'md')}
            <span className="text-gray-600 text-sm">
              {averageRating.toFixed(1)} out of 5
            </span>
          </div>
        )}
        <p className="text-gray-500 text-sm">
          {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Review Submission Section */}
      {!showReviewForm ? (
        <div className="text-center mb-8">
          {hasUserReviewed ? (
            <div className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Review Submitted
            </div>
          ) : (
            <button
              onClick={() => {
                if (hasUserReviewed) {
                  addToast({
                    type: 'info',
                    title: 'Review Already Submitted',
                    message: 'You have already submitted a review for this product.'
                  });
                  return;
                }
                setShowReviewForm(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Write a Review
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Write Your Review</h4>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Share your experience with {productName}</p>
              <p className="text-xs text-gray-500 mt-1">You can only submit one review per product</p>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Rating Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Your Rating</label>
                  <div className="flex items-center gap-2">
                    {renderStars(newReview.rating, 'lg', true, (star) => 
                      setNewReview(prev => ({ ...prev, rating: star }))
                    )}
                    <span className="ml-3 text-sm text-gray-600">
                      {newReview.rating} out of 5 stars
                    </span>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Review Title</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    placeholder="Brief summary of your experience"
                    maxLength={100}
                  />
                </div>

                {/* Comment Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Your Review</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    rows={4}
                    placeholder="Share your detailed thoughts about this product..."
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newReview.comment.length}/1000 characters
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Add Photos (Optional)</label>
                  <div className="space-y-3">
                    {/* Image Upload Button */}
                    {newReview.images.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-gray-600 hover:text-gray-800"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add photos to your review</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Up to 5 images (JPG, PNG)</p>
                      </button>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {/* Image Preview */}
                    {newReview.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {newReview.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Review image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{review.userName}</span>
                  {review.verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(review.rating, 'sm')}
                </div>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.comment}</p>
              
              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Helpful ({review.helpful})
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience!</p>
        </div>
      )}
    </div>
  );
} 