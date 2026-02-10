# Solución: Error de Playwright en Producción

## Problema
El endpoint `/api/pdf/generate-pricing-v2` estaba fallando en producción (Vercel) con el error:
```
Error: browserType.launch: Executable doesn't exist at /home/sbx_user1051/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell
```

## Causa
Playwright requiere que los navegadores (chromium) se instalen explícitamente. En Vercel, estos navegadores no se instalan automáticamente, lo que causaba el fallo al intentar generar PDFs.

## Solución Implementada

### 1. Actualización de `package.json`
Modificamos el script `postinstall` para instalar chromium automáticamente:
```json
"postinstall": "prisma generate && npx playwright install chromium --with-deps"
```

Esto asegura que:
- Se instala chromium durante el deployment en Vercel
- Se incluyen todas las dependencias del sistema necesarias (`--with-deps`)

### 2. Creación de `vercel.json`
Configuramos recursos específicos para la función de generación de PDF:
```json
{
  "functions": {
    "src/app/api/pdf/generate-pricing-v2/route.ts": {
      "memory": 3008,
      "maxDuration": 60
    }
  },
  "env": {
    "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": ""
  }
}
```

Configuración:
- **memory: 3008 MB**: Máximo disponible en Vercel Pro para ejecutar Playwright
- **maxDuration: 60**: Timeout de 60 segundos para generar PDFs complejos
- **PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD**: Vacío para permitir la descarga

### 3. Contacto Actualizado
Corregimos la información de contacto en toda la aplicación:
- Email: `comercial@gard.cl` (antes: `carlos.irigoyen@gard.cl`)
- Teléfono: `+56 98 230 7771`

### 4. Link de Calendario Actualizado
Actualizamos el link de "Solicitar reunión" al calendario de Google:
```
https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1Pw1jeKf---C8bRMp7lqkoSZHhwwqW1kA5QkCjRSvOVGoDda0qVwbzELTHf8vIJCwX4bMkiH0Z
```

## Archivos Modificados

1. **`package.json`**: Script postinstall actualizado
2. **`vercel.json`**: Creado con configuración de recursos
3. **`src/app/api/pdf/generate-pricing-v2/route.ts`**: Email de contacto corregido
4. **`src/components/presentation/sections/Section23PropuestaEconomica.tsx`**: 
   - Email corregido
   - Link de "Solicitar reunión" actualizado
5. **`src/components/presentation/sections/Section28Cierre.tsx`**: Email corregido
6. **`src/components/pdf/PricingPDF.tsx`**: Email corregido
7. **`src/lib/mock-data.ts`**: 
   - Email y contacto actualizados
   - Link del calendario actualizado

## Deploy
Para aplicar estos cambios en producción:

```bash
# Commit de los cambios
git add .
git commit -m "fix: Configurar Playwright para Vercel y actualizar contactos"

# Push a producción
git push origin main
```

Vercel detectará automáticamente los cambios y reinstalará las dependencias con el nuevo script `postinstall`.

## Verificación
Después del deploy, verificar:

1. ✅ El botón "Descargar Propuesta PDF" funciona sin errores
2. ✅ El PDF se descarga con el diseño correcto del template
3. ✅ El footer del PDF muestra: `comercial@gard.cl` y `+56 98 230 7771`
4. ✅ El botón "Solicitar reunión" abre el calendario de Google
5. ✅ La sección de contacto muestra la información correcta

## Notas Adicionales

- **Costo**: La instalación de Playwright añade ~100MB al deployment
- **Tiempo de build**: Aumenta ~30-60 segundos por la instalación de chromium
- **Alternativa local**: Para desarrollo local, ejecutar `npx playwright install chromium`

## Troubleshooting

Si persisten problemas:

1. Verificar logs de Vercel para errores de instalación
2. Asegurar que el plan de Vercel soporta funciones con 3GB de memoria
3. Revisar que el timeout de 60s sea suficiente para PDFs muy largos
4. Considerar usar variables de entorno para el link del calendario si cambia frecuentemente
