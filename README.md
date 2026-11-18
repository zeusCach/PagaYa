# PagaYa

MVP local para un comercio que crea enlaces de cobro en MXN y consulta su estado. Usa Next.js, TypeScript y SQLite. Requiere Node.js 24.

## Demostración local

```powershell
npm.cmd ci
npm.cmd run dev
```

Abre http://127.0.0.1:3000, crea un cobro de al menos $10 MXN, abre el enlace y pulsa **Simular pago**. El historial se actualiza automáticamente. La base se crea en `.data/pagaya.sqlite`. Los enlaces de demostración funcionan en el equipo que ejecuta PagaYa.

## Stripe en modo de pruebas

1. Copia `.env.example` a `.env.local` y configura `STRIPE_SECRET_KEY` con una clave `sk_test_…`.
2. Ejecuta `stripe listen --events checkout.session.completed --forward-to http://127.0.0.1:3000/api/webhooks/stripe` con Stripe CLI y configura `STRIPE_WEBHOOK_SECRET` con el secreto que muestra el comando.
3. Reinicia Next.js, crea un cobro nuevo y abre su enlace de Stripe Checkout. Usa la tarjeta de prueba `4242 4242 4242 4242`, con fecha futura y CVC de prueba.
4. Comprueba que el webhook confirma la orden y que el panel muestra **Pagado**. Los cobros de demostración existentes conservan su modalidad.

El servidor arranca en la interfaz local. El piloto requiere autenticación del panel y un despliegue con almacenamiento persistente antes de exponerse a Internet. Para liquidar a múltiples comercios, la siguiente versión requiere vincular una cuenta de proveedor por comercio.
