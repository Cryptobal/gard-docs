# 📧 Configuración de Webhooks de Resend

## ⚠️ Problema Actual

Los "Opens" y "Clicks" están en 0 porque el webhook de Resend no está configurado.

## ✅ Solución: Configurar Webhook en Resend

### Paso 1: Ir a Resend Dashboard

1. Accede a https://resend.com/webhooks
2. Haz login con tu cuenta

### Paso 2: Crear Webhook

1. Click en **"Add Webhook"**
2. Configura:

   **Endpoint URL:**
   ```
   https://docs.gard.cl/api/webhook/resend
   ```

   **Events to listen:**
   - ✅ `email.delivered` - Email entregado
   - ✅ `email.opened` - Email abierto (IMPORTANTE)
   - ✅ `email.clicked` - Links clickeados (IMPORTANTE)
   - ✅ `email.bounced` - Email rebotado
   - ✅ `email.complained` - Marcado como spam

3. Click en **"Create Webhook"**

### Paso 3: Copiar Signing Secret (Opcional)

Resend te dará un `Signing Secret` para validar webhooks.

**Por ahora no es necesario**, pero para producción deberías:

1. Copiar el secret: `whsec_...`
2. Agregarlo a `.env.local`:
   ```
   RESEND_WEBHOOK_SECRET=whsec_xxxxx
   ```
3. Validar firma en el webhook

### Paso 4: Probar

1. Envía un email de prueba desde el dashboard
2. Abre el email
3. Verifica en el dashboard que "Opens" aumentó

---

## 🔍 Verificar que Funciona

### En los Logs de Resend:

1. Ve a https://resend.com/logs
2. Busca el email que enviaste
3. En "Events" deberías ver:
   - ✅ delivered
   - ✅ opened (cuando abras el email)
   - ✅ clicked (cuando hagas click en un link)

### En el Dashboard de Gard Docs:

1. Ve a http://localhost:3001/inicio
2. Busca la presentación que enviaste
3. Deberías ver:
   - **Opens**: Cantidad de veces que se abrió el email
   - Esto se actualiza en tiempo real vía webhook

---

## 🐛 Troubleshooting

### Los Opens siguen en 0:

**Posibles causas:**

1. **Webhook no configurado** → Sigue Paso 2
2. **URL incorrecta** → Verifica que sea `https://docs.gard.cl/api/webhook/resend`
3. **Eventos no seleccionados** → Verifica que `email.opened` esté marcado
4. **Cliente de email bloquea tracking** → Gmail/Outlook a veces bloquean pixels

### Ver logs del webhook:

En producción (Vercel):
```bash
vercel logs
```

En desarrollo:
```bash
npm run dev
```

Busca: `📧 Resend webhook recibido`

---

## 📊 Diferencia entre Métricas

### VISTAS 👁️
- Cliente hizo **click en "Ver Propuesta"** en el email
- Se abrió el link público: `/p/[uniqueId]`
- **Tracking:** Automático cuando carga la página
- **Esto es lo MÁS IMPORTANTE**

### OPENS 📧 (Resend Webhook)
- Cliente **abrió el email** (sin hacer click aún)
- **Tracking:** Pixel invisible de 1x1px
- **Limitación:** Algunos clientes bloquean esto
- **Menos confiable que Vistas**

### CLICKS 🖱️ (Resend Webhook) - REMOVIDO DEL DASHBOARD
- Clicks en **cualquier link del email**
- Incluye "Ver Propuesta" y otros links
- **Redundante con Vistas** → Por eso lo removimos

---

## 🎯 Recomendación

**Métricas principales a seguir:**

1. **Vistas** → Cliente vio la propuesta ✅
2. **Sin Leer** → Cliente no ha visto aún ⏳

Los "Opens" de email son menos importantes porque:
- Pueden bloquearse
- No garantizan que vio la propuesta
- Las "Vistas" son más precisas

---

## 📝 Notas Adicionales

- Resend puede tardar **hasta 5 minutos** en enviar webhooks
- Los webhooks se reintentan **hasta 3 veces** si fallan
- En desarrollo, usa **ngrok** o **localtunnel** para testear webhooks:
  ```bash
  npx localtunnel --port 3001 --subdomain gard-docs-dev
  ```

---

**Última actualización:** 05 de Febrero de 2026
