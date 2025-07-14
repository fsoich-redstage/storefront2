import { getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { initializers } from '@dropins/tools/initializer.js';
import { initialize, setFetchGraphQlHeaders } from '@dropins/storefront-checkout/api.js';
import { initializeDropin } from './index.js';
import { fetchPlaceholders } from '../commerce.js';
import { events } from '@dropins/tools/event-bus.js';

console.log('[checkout.js] 🚀  *** Start Drop-in init...');

await initializeDropin(async () => {
  const headers = getHeaders('checkout');
  console.log('[checkout.js] 🧠 getHeaders(\'checkout\') result:', headers);

  setFetchGraphQlHeaders((prev) => {
    const merged = { ...prev, ...headers };
    console.log('[checkout.js] 🔗 Merged GraphQL headers:', merged);
    return merged;
  });

  const labels = await fetchPlaceholders('placeholders/checkout.json');
  console.log('[checkout.js] 🏷️ Labels loaded:', labels);

  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  const models = {
    CartModel: {
      transformer: (data) => {
        console.log('[checkout.js] 🛒 CartModel transformer called with:', data);

        if (!data) {
          console.warn('[checkout.js] ⚠️ CartModel received no data.');
          return {
            availablePaymentMethods: [],
            selectedPaymentMethod: null,
          };
        }

        if (data?.id) {
          console.log(`[checkout.js] 🆔 Cart ID from CartModel: ${data.id}`);
        } else {
          console.warn('[checkout.js] ⚠️ No cart ID found in data.');
        }

        if (data?.shipping_addresses?.length > 0) {
          data.shipping_addresses.forEach((address, index) => {
            console.log(`[checkout.js] 📦 Shipping Address [${index}]:`, address);

            if (address.available_shipping_methods?.length > 0) {
              console.log(`[checkout.js] 🚚 Shipping Methods [${index}]:`, address.available_shipping_methods);
            } else {
              console.warn(`[checkout.js] ⚠️ No shipping methods in address [${index}]`);
            }
          });
        } else {
          console.warn('[checkout.js] ⚠️ No shipping_addresses present.');
        }

        if (data?.available_payment_methods) {
          console.log('[checkout.js] 💳 availablePaymentMethods:', data.available_payment_methods);
        }

        return {
          availablePaymentMethods: data?.available_payment_methods || [],
          selectedPaymentMethod: data?.selected_payment_method || null,
        };
      },
    },
  };

  // EVENTOS

  events.on('checkout/initialized', (payload) => {
    console.log('[checkout.js] ✅ Event: checkout/initialized', payload);
  }, { eager: true });

  events.on('cart/data', (payload) => {
    console.log('[checkout.js] 📦 Event: cart/data', payload);

    if (payload?.id) {
      console.log(`[checkout.js] 🆔 Cart ID from cart/data: ${payload.id}`);
    }

    if (payload?.shipping_addresses?.length > 0) {
      payload.shipping_addresses.forEach((address, index) => {
        console.log(`[checkout.js] 📬 Shipping Address [${index}]:`, address);
        if (address?.available_shipping_methods?.length > 0) {
          console.log(`[checkout.js] 🚚 Shipping Methods [${index}]:`, address.available_shipping_methods);
        } else {
          console.warn(`[checkout.js] ⚠️ No shipping methods found in address [${index}]`);
        }
      });
    } else {
      console.warn('[checkout.js] ⚠️ cart/data → No shipping_addresses present.');
    }
  }, { eager: true });

  events.on('checkout/values', (payload) => {
    console.log('[checkout.js] 🔁 Event: checkout/values', payload);
  }, { eager: true });

  // EXTRA DEBUG: intentamos capturar el cart desde window.__storefrontInstance__
  setTimeout(() => {
    if (window?.__storefrontInstance__) {
      console.log('[checkout.js] 🧠 window.__storefrontInstance__:', window.__storefrontInstance__);
      try {
        const cartId = window.__storefrontInstance__?.cart?.state?.id;
        if (cartId) {
          console.log('[checkout.js] 🆔 Cart ID from __storefrontInstance__:', cartId);
        } else {
          console.warn('[checkout.js] ⚠️ __storefrontInstance__.cart.state.id not found');
        }
      } catch (e) {
        console.error('[checkout.js] ❌ Error reading __storefrontInstance__.cart.state:', e);
      }
    } else {
      console.warn('[checkout.js] ❌ window.__storefrontInstance__ not available yet.');
    }
  }, 2000);

  console.log('[checkout.js] 🧱 Mounting Drop-in...');
  return initializers.mountImmediately(initialize, { langDefinitions, models });
});

console.log('[checkout.js] ✅ Drop-in initialization complete.');
