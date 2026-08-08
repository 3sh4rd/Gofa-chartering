/* ===========================================================================
   Booking pricing & tour definitions — used by booking.html and checkout.html
   Edit prices here and both pages update.
   =========================================================================== */
window.TOURS = {
  snorkel: { name: 'Turtle Snorkel & Swim With Pigs', price: 170, per: 'person', max: 18,
             times: ['Morning', 'Afternoon (1:00 PM)'], img: 'TURTLES SNORKLING.jpg' },
  charter: { name: 'Private Charter',                  price: 1600, per: 'booking', max: 18,
             times: ['Morning', 'Afternoon (1:00 PM)'], img: 'charter image.jpg' },
  atv:     { name: 'ATV Adventure',                    price: 250, per: 'person', max: 18,
             times: ['Morning', 'Afternoon (1:00 PM)'], img: 'ATV.jpg' },
  fishing: { name: 'Fishing Trip (Eat Your Catch)',    price: 5000, per: 'booking', max: 8,
             times: ['Morning'], img: 'FISHING TRIPS.jpg' }   // fishing = mornings only
};
window.PICKUP_FEE = 50;      // flat, per booking
window.DEPOSIT_RATE = 0.5;   // 50% deposit at checkout

/* Payment settings — fill these in.
   PayPal: developer.paypal.com > Apps & Credentials > your LIVE app > Client ID
   SunCash: the SunCash number/handle customers send their deposit to           */
window.PAYPAL_CLIENT_ID = 'EAR6iU-LtHStN2L8X0zPY3QuY9tzGtM5DteXP8TPUMDnwjnxn-79K8NF0qo_W8yNNNKlK7LCzZIjh6fa';
window.SUNCASH_NUMBER   = 'YOUR_SUNCASH_NUMBER';

window.computeTotal = function (tourKey, guests, pickup) {
  var t = window.TOURS[tourKey]; if (!t) return { total: 0, deposit: 0 };
  var g = Math.max(1, parseInt(guests || 1, 10));
  var base = (t.per === 'person') ? t.price * g : t.price;
  var total = base + (pickup ? window.PICKUP_FEE : 0);
  return { total: total, deposit: Math.round(total * window.DEPOSIT_RATE * 100) / 100 };
};
