# Maison QR — MVP Frontend

PWA de menú y pago en mesa. El cliente escanea el QR, elige, paga y se va.
Sin app. Sin cuenta. Sin esperar al mozo.

## Estructura

```
maison-qr/
├── index.html          ← App completa (una sola página)
├── manifest.json       ← Configuración PWA
└── data/
    └── menu.json       ← Menú editable (nombre, platos, precios)
```

## Deploy en 5 minutos (Vercel)

1. Crear cuenta en https://vercel.com (gratis)
2. Subir esta carpeta a GitHub
3. Conectar repo en Vercel → deploy automático
4. URL generada: `https://tu-restaurante.vercel.app`

## Personalizar el menú

Editá `data/menu.json`:
- Cambiá `restaurant.name`, `tagline`, `whatsapp`, `google_review_url`
- Agregá/quitá items en el array `items`
- Cada item necesita: `id`, `category`, `name`, `desc`, `price`, `emoji`

## QR por mesa

Para cada mesa generá un link con el parámetro `?table=N`:
```
https://tu-restaurante.vercel.app?table=1
https://tu-restaurante.vercel.app?table=2
```

Generá el QR en https://qr-code-generator.com y pegalo en la mesa.

## Próximos pasos (backend)

1. **Integrar MercadoPago** — reemplazar `processPay()` en index.html con el SDK
2. **Backend Python/FastAPI** — guardar pedidos en Supabase
3. **Panel del restaurante** — ver pedidos en tiempo real
4. **WhatsApp receipt** — enviar comprobante via Twilio o WhatsApp Business API

## Stack sugerido MVP completo

| Capa | Tecnología | Costo |
|------|-----------|-------|
| Frontend | HTML/JS (este repo) | Gratis |
| Hosting | Vercel | Gratis |
| Backend | FastAPI (Python) | Gratis (Railway) |
| Base de datos | Supabase | Gratis hasta 500MB |
| Pagos | MercadoPago | 3.49% por transacción |
| WhatsApp | Twilio / WABA | ~$0.005 por mensaje |
