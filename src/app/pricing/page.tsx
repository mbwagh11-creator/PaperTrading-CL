const plans = [
  {
    name: "PRO-TRADER",
    price: "₹149",
    period: "/month",
    description: "One plan only. Start with a 7-day free trial and continue at ₹149 per month after that.",
    features: ["Unlimited paper trades", "Live Upstox-ready market access", "Dashboard analytics", "Trade journal & performance insights"],
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] p-8 md:p-10">
        <div className="space-y-3">
          <p className="text-accent text-sm font-semibold uppercase tracking-[0.2em]">Subscription</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">One plan. 7 days free, then ₹149/month.</h1>
          <p className="text-muted max-w-3xl text-sm md:text-base">
            Start with a free trial, then continue with a single monthly subscription for the full experience.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-1 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-6 md:p-7 transition-all duration-300 backdrop-blur-xl ${
              plan.highlight
                ? "border-accent/60 bg-accent/10 shadow-[0_0_0_1px_rgba(97,255,201,0.14),0_18px_60px_rgba(20,185,130,0.24)]"
                : "border-white/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
                <p className="text-muted mt-2 text-sm leading-6">{plan.description}</p>
              </div>
              {plan.highlight && (
                <span className="text-[11px] font-semibold uppercase px-3 py-1 rounded-full bg-accent text-black">
                  Most Popular
                </span>
              )}
            </div>

            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-bold text-white">{plan.price}</span>
              <span className="text-muted mb-1">{plan.period}</span>
            </div>

            <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
              7 days free trial included
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-muted">
                  <span className="text-accent">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className="mt-8 w-full rounded-xl bg-accent px-4 py-3 font-medium text-black transition-all hover:brightness-95"
            >
              Start 7-Day Free Trial
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
