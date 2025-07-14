import { getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { initializers } from '@dropins/tools/initializer.js';
import { initialize, setFetchGraphQlHeaders } from '@dropins/storefront-checkout/api.js';
import { initializeDropin } from './index.js';
import { fetchPlaceholders } from '../commerce.js';
import { events } from '@dropins/tools/event-bus.js';

console.log('[checkout.js] 🚀 Start Drop-in init...');

await initializeDropin(async () => {
  const headers = getHeaders('checkout');
  console.log('[checkout.js] 🧠 GraphQL Headers:', headers);
  setFetchGraphQlHeaders((prev) => ({ ...prev, ...headers }));

  const labels = await fetchPlaceholders('placeholders/checkout.json');
  console.log('[checkout.js] 🏷️ Labels:', labels);

  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  const models = {
    CartModel: {
      transformer: (data) => {
        console.log('[checkout.js] 🛒 CartModel input:', data);

        if (data?.id) {
          console.log(`[checkout.js] 🆔 Cart ID: ${data.id}`);
        }

        if (data?.shipping_addresses?.length > 0) {
          data.shipping_addresses.forEach((address, index) => {
            console.log(`[checkout.js] 📦 Shipping Address [${index}]:`, address);

            if (address.available_shipping_methods?.length > 0) {
              console.log(`[checkout.js] 🚚 Available Shipping Methods [${index}]:`, address.available_shipping_methods);
            } else {
              console.warn(`[checkout.js] ⚠️ No shipping methods found in address [${index}]`);
            }
          });
        } else {
          console.warn('[checkout.js] ⚠️ No shipping addresses present');
        }

        // 💥 FIXED: return default values to avoid breaking the drop-in
        return {
          availablePaymentMethods: data?.available_payment_methods || [],
          selectedPaymentMethod: data?.selected_payment_method || null,
        };
      },
    },
  };

  events.on('checkout/initialized', (payload) => {
    console.log('[checkout.js] ✅ Event: checkout/initialized →', payload);
  }, { eager: true });

  events.on('cart/data', (payload) => {
    console.log('[checkout.js] 🧾 Event: cart/data →', payload);

    if (payload?.id) {
      console.log(`[checkout.js] 🆔 [cart/data] Cart ID: ${payload.id}`);
    }

    if (payload?.shipping_addresses?.length > 0) {
      payload.shipping_addresses.forEach((address, index) => {
        console.log(`[checkout.js] 📬 [cart/data] Shipping Address [${index}]:`, address);

        if (address.available_shipping_methods?.length > 0) {
          console.log(`[checkout.js] ✅ [cart/data] Shipping Methods [${index}]:`, address.available_shipping_methods);
        } else {
          console.warn(`[checkout.js] ⚠️ [cart/data] No shipping methods found [${index}]`);
        }
      });
    }
  }, { eager: true });

  events.on('checkout/values', (payload) => {
    console.log('[checkout.js] 🔁 Event: checkout/values →', payload);
  }, { eager: true });

  // Extra: log de cart desde window.__storefrontInstance__
  setTimeout(() => {
    if (window?.__storefrontInstance__) {
      console.log('[checkout.js] 🧠 window.__storefrontInstance__:', window.__storefrontInstance__);
      try {
        const internalCartId = window.__storefrontInstance__?.cart?.state?.id;
        if (internalCartId) {
          console.log('[checkout.js] 🆔 Cart ID from __storefrontInstance__:', internalCartId);
        }
      } catch (e) {
        console.warn('[checkout.js] ❌ Error accediendo al cart desde __storefrontInstance__');
      }
    } else {
      console.warn('[checkout.js] ❌ window.__storefrontInstance__ no disponible');
    }
  }, 2000);

  console.log('[checkout.js] 🧱 Mounting Drop-in...');
  return initializers.mountImmediately(initialize, { langDefinitions, models });
});

console.log('[checkout.js] ✅ Drop-in initialization complete.');
