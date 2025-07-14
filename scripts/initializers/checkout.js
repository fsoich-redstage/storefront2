import { getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { initializers } from '@dropins/tools/initializer.js';
import { initialize, setFetchGraphQlHeaders } from '@dropins/storefront-checkout/api.js';
import { initializeDropin } from './index.js';
import { fetchPlaceholders } from '../commerce.js';
import { events } from '@dropins/tools/event-bus.js';

console.log('[checkout.js] Start initializing Drop-in...');

await initializeDropin(async () => {
  setFetchGraphQlHeaders((prev) => ({ ...prev, ...getHeaders('checkout') }));
  console.log('[checkout.js] GraphQL headers set:', getHeaders('checkout'));

  const labels = await fetchPlaceholders('placeholders/checkout.json');
  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  console.log('[checkout.js] Labels loaded:', labels);

  // Paso 2: Extend Checkout schema (OOPE)
  const models = {
    CartModel: {
      transformer: (data) => {
        console.log('[checkout.js] CartModel transformer input:', data);
        return {
          availablePaymentMethods: data?.available_payment_methods,
          selectedPaymentMethod: data?.selected_payment_method,
        };
      },
    },
  };

  // Paso 3: Evento de inicialización del Checkout
  events.on('checkout/initialized', (payload) => {
    console.log('[checkout.js] Event: checkout/initialized', payload);
  }, { eager: true });

  // Paso 4: Evento con data del carrito
  events.on('cart/data', (payload) => {
    console.log('[checkout.js] Event: cart/data', payload);
  }, { eager: true });

  console.log('[checkout.js] Mounting checkout with Drop-in...');

  return initializers.mountImmediately(initialize, {
    langDefinitions,
    models,
  });
});

console.log('[checkout.js] Drop-in initialized ✅');
