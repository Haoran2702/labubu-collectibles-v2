# Payment Processing Setup Guide

## Stripe Integration

This e-commerce platform now includes Stripe payment processing. Follow these steps to set up payments:

### 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete the account verification process
3. Navigate to the Stripe Dashboard

### 2. Get Your API Keys

1. In the Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** and **Secret key**
3. For testing, use the keys that start with `pk_test_` and `sk_test_`

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Existing variables
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3001
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Add these new Stripe variables
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 4. Set Up Webhooks (Optional but Recommended)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/payments/webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to your backend `.env` file

### 5. Test the Integration

1. Start the backend server: `cd backend && npm start`
2. Start the frontend server: `cd frontend && npm run dev`
3. Navigate to `/checkout-with-payment` to test the payment flow
4. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits

### 6. Test Card Numbers

Use these test card numbers for testing:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Visa (successful payment) |
| 4000 0000 0000 0002 | Visa (declined payment) |
| 4000 0000 0000 9995 | Visa (insufficient funds) |
| 4000 0000 0000 9987 | Visa (lost card) |
| 4000 0000 0000 9979 | Visa (stolen card) |

### 7. Production Deployment

When deploying to production:

1. Switch to live Stripe keys (remove `_test` suffix)
2. Update webhook endpoints to your production domain
3. Ensure HTTPS is enabled
4. Set up proper error monitoring
5. Configure webhook retry settings

### 8. Security Considerations

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Enable webhook signature verification
- Implement proper error handling
- Set up monitoring for failed payments
- Regular security audits

### 9. Payment Flow

The payment flow works as follows:

1. **Customer fills shipping information**
2. **Payment intent is created** (reserves the amount)
3. **Customer enters payment details**
4. **Payment is confirmed** via Stripe
5. **Order is created** in the database
6. **Customer is redirected** to order confirmation

### 10. Error Handling

The system handles various payment scenarios:

- **Successful payments**: Order created, customer redirected
- **Failed payments**: Error shown, customer can retry
- **Network errors**: Graceful fallback with user feedback
- **Invalid cards**: Real-time validation via Stripe

### 11. Next Steps

After setting up payments, consider implementing:

- [ ] Inventory management
- [ ] Shipping cost calculation
- [ ] Order status tracking
- [ ] Email notifications
- [ ] Refund processing
- [ ] Analytics dashboard

---

**Note**: This is a test implementation. For production use, ensure you comply with PCI DSS requirements and implement additional security measures. 