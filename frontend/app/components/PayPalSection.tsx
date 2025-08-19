import { PayPalScriptProvider, PayPalButtons, SCRIPT_LOADING_STATE } from "@paypal/react-paypal-js";
import { CreateOrderActions, OnApproveData, OnApproveActions } from "@paypal/paypal-js";

interface PayPalSectionProps {
  amount: number;
  orderData: any;
  onSuccess: (details: any) => void;
  onError: (error: string) => void;
}

export default function PayPalSection({ amount, orderData, onSuccess, onError }: PayPalSectionProps) {
  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "" }}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={async (_data: Record<string, unknown>, actions: CreateOrderActions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{ amount: { currency_code: 'USD', value: amount.toFixed(2) } }],
          });
        }}
        onApprove={async (data: OnApproveData, _actions: OnApproveActions) => {
          if (!data.orderID) return onError("No orderID returned");
          // Defensive check for orderData.total
          if (typeof orderData.total !== 'number' || isNaN(orderData.total) || orderData.total <= 0) {
            onError('Order total is invalid. Please check your cart.');
            return;
          }
          // Call backend to capture order and send orderData
          const res = await fetch("/api/payments/paypal-capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID, orderData }),
          });
          if (!res.ok) {
            const error = await res.text();
            onError(error || 'Failed to capture PayPal order');
            return;
          }
          onSuccess({ ...orderData, orderID: data.orderID });
        }}
        onError={(err: unknown) => onError(typeof err === 'string' ? err : 'PayPal error')}
      />
    </PayPalScriptProvider>
  );
} 