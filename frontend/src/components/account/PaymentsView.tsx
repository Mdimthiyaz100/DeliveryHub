import React from "react";

interface PaymentsViewProps {
  orders: any[];
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ orders }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
          Payments & Transactions
        </h2>
        <p className="text-xs text-[#737373] mt-1">
          Review your connected payment options and verified settlement history
        </p>
      </div>

      {/* Available Payment Options Card */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 sm:p-7">
        <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-4">
          Supported Payment Methods
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* UPI */}
          <div className="p-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#EAEAEA] flex items-center justify-center text-orange-500 font-extrabold text-xs shadow-sm">
              UPI
            </div>
            <div>
              <p className="text-xs font-bold text-[#171717]">Instant UPI Transfer</p>
              <p className="text-[11px] text-[#737373]">Google Pay, PhonePe, Paytm</p>
            </div>
          </div>

          {/* Cards */}
          <div className="p-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#EAEAEA] flex items-center justify-center text-orange-500 font-extrabold text-xs shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-[#171717]">Credit / Debit Cards</p>
              <p className="text-[11px] text-[#737373]">Visa, Mastercard, RuPay</p>
            </div>
          </div>

          {/* Cash on Delivery */}
          <div className="p-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#EAEAEA] flex items-center justify-center text-emerald-600 font-extrabold text-xs shadow-sm">
              COD
            </div>
            <div>
              <p className="text-xs font-bold text-[#171717]">Cash on Delivery</p>
              <p className="text-[11px] text-[#737373]">Pay upon safe doorstep arrival</p>
            </div>
          </div>
        </div>

        <div className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center gap-3 text-amber-900 text-xs">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">
            DeliveryHub never stores raw CVVs or banking credentials. All payments are processed through PCI-DSS 256-bit encrypted gateways.
          </span>
        </div>
      </div>

      {/* Real Orders Transaction History */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 sm:p-7">
        <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider mb-4">
          Transaction History ({orders.length})
        </h3>

        {orders.length === 0 ? (
          <div className="py-10 text-center text-[#737373]">
            <p className="text-xs font-semibold">No payment transactions recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0]">
            {orders.map((order) => {
              const isPaid = order.payment_status === "paid" || order.delivery_status === "delivered";

              return (
                <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {isPaid ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#171717]">
                          #ORD{String(order.id).padStart(5, "0")}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          via {order.payment_method || "Cash on Delivery"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888888]">
                        {order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "Recent"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-xs font-extrabold text-[#171717]">
                      ₹{Number(order.amount || 0).toLocaleString()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {isPaid ? "Settled" : "Pending Collection"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsView;

