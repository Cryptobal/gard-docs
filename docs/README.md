# 📚 Documentación GARD DOCS

Bienvenido a la documentación completa del proyecto **GARD DOCS**, la plataforma de presentaciones comerciales inteligente de Gard Security.

---

## 🎯 Documento Maestro

El punto de partida para entender el producto completo:

📄 **[GARD DOCS - Documento Maestro](./00-product/001-gard-docs-master.md)**
- Visión del producto
- Características principales
- Roadmap y planificación
- Guía de uso

📄 **[OPAI Suite - Documento Maestro](./00-product/000-opai-suite-master.md)**
- Contexto de la suite OPAI
- Productos relacionados
- Visión estratégica

---

## 🏗️ Arquitectura

Documentación técnica de la arquitectura del sistema:

### Componentes Principales

📄 **[Arquitectura General](./01-architecture/overview.md)**
- Stack tecnológico
- Componentes del sistema
- Estructura de directorios
- Tecnologías y bibliotecas
- Seguridad

📄 **[Autenticación](./01-architecture/auth.md)**
- Sistema Auth.js v5
- Flujo de login
- Protección de rutas
- Seguridad y JWT
- 🆕 **Sistema de invitación de usuarios**
- 🆕 **RBAC y gestión de roles**

📄 **[Multi-Tenancy](./01-architecture/multitenancy.md)**
- Modelo SaaS
- Aislamiento de datos
- Filtrado por tenant
- Tenant switcher
- 🆕 **Gestión de usuarios multi-tenant**

### Architecture Decision Records (ADR)

📁 **[ADRs](./01-architecture/adr/)**
- Decisiones arquitectónicas documentadas
- Contexto y alternativas evaluadas
- Consecuencias y trade-offs

---

## 🔧 Implementación

Detalles de implementación, estado del proyecto y guías técnicas:

📄 **[Database Schema](./02-implementation/database-schema.md)**
- Esquema completo de base de datos
- Relaciones entre tablas
- Índices y constraints
- Migraciones aplicadas

📄 **[Estado del Proyecto](./02-implementation/estado-proyecto.md)**
- Estado actual de desarrollo
- Features implementados
- Próximos pasos
- Checklist de tareas

📄 **[Checklist Multi-Tenant](./02-implementation/checklist-multitenant.md)**
- Validación de implementación multi-tenant
- Estado en base de datos
- Validaciones pendientes
- Testing

📄 **🆕 [Sistema de Usuarios y Roles](./02-implementation/usuarios-roles.md)**
- Gestión de usuarios internos
- Invitación por email
- RBAC (Role-Based Access Control)
- Flujo completo de activación
- Dark mode design system

---

## 🔌 Integraciones

Documentación de integraciones con sistemas externos:

📄 **[Integración con Zoho CRM](./03-integrations/zoho-integration.md)**
- Configuración de webhooks
- Flujo de datos
- Mapping de campos
- Troubleshooting

📄 **[Tokens de Zoho](./03-integrations/tokens-zoho.md)**
- Sistema de tokens dinámicos
- Variables disponibles
- Implementación de reemplazo
- Ejemplos de uso

---

## 💼 Ventas y Comercial

Templates y guías para el equipo comercial:

📄 **[Presentación Comercial](./04-sales/presentacion-comercial.md)**
- Template comercial base
- Estructura de secciones
- Guía de contenido
- Mejores prácticas

---

## 📝 Changelog

📄 **[Changelog](./CHANGELOG.md)**
- Historial de cambios
- Versiones del sistema
- Nuevas features
- Bug fixes

---

## 🗂️ Estructura de Carpetas

```
docs/
├── README.md                          ← Este archivo
│
├── 00-product/                        ← Documentos maestros
│   ├── 000-opai-suite-master.md
│   └── 001-gard-docs-master.md
│
├── 01-architecture/                   ← Arquitectura técnica
│   ├── overview.md
│   ├── auth.md                        (🆕 incluye RBAC)
│   ├── multitenancy.md                (🆕 gestión usuarios)
│   └── adr/                           ← Architecture Decision Records
│
├── 02-implementation/                 ← Implementación y desarrollo
│   ├── database-schema.md
│   ├── estado-proyecto.md
│   ├── checklist-multitenant.md
│   └── usuarios-roles.md              (🆕 NEW)
│
├── 03-integrations/                   ← Integraciones externas
│   ├── zoho-integration.md
│   └── tokens-zoho.md
│
├── 04-sales/                          ← Ventas y comercial
│   └── presentacion-comercial.md
│
└── CHANGELOG.md                       ← Historial de cambios
```

---

## 🚀 Inicio Rápido

### Para Desarrolladores

1. Lee el **[Documento Maestro](./00-product/001-gard-docs-master.md)** para entender el producto
2. Revisa la **[Arquitectura General](./01-architecture/overview.md)** para conocer el stack
3. Consulta el **[Database Schema](./02-implementation/database-schema.md)** para conocer el modelo de datos
4. Verifica el **[Estado del Proyecto](./02-implementation/estado-proyecto.md)** para saber qué está implementado
5. 🆕 **[Sistema de Usuarios](./02-implementation/usuarios-roles.md)** para gestión de accesos

### Para Product Managers

1. Comienza con el **[Documento Maestro](./00-product/001-gard-docs-master.md)**
2. Revisa el **[Estado del Proyecto](./02-implementation/estado-proyecto.md)**
3. Consulta el **[Changelog](./CHANGELOG.md)** para conocer las últimas actualizaciones

### Para Equipo Comercial

1. Lee la **[Presentación Comercial](./04-sales/presentacion-comercial.md)** para conocer el template base
2. Revisa la **[Integración con Zoho](./03-integrations/zoho-integration.md)** para entender el flujo de datos

---

## 📞 Contacto

Para dudas o actualizaciones de la documentación:

- **Email:** carlos.irigoyen@gard.cl
- **Proyecto:** docs.gard.cl
- **Organización:** Gard Security

---

## 🔄 Historial de Actualizaciones

### v2.0 - 05 de Febrero de 2026

**Nuevas Funcionalidades:**
- ✅ Sistema de gestión de usuarios
- ✅ Invitación por email con tokens seguros
- ✅ RBAC (4 roles: owner, admin, editor, viewer)
- ✅ Cambio de roles inline desde tabla
- ✅ Auditoría completa de acciones
- ✅ Dark mode design system
- ✅ Documentación completa en `usuarios-roles.md`

### v1.0 - 05 de Febrero de 2026

**Reorganización Inicial:**
- ✅ Creada estructura de carpetas por categoría
- ✅ Descompuesto DOCUMENTO-MAESTRO-APLICACION.md en arquitectura
- ✅ Movidos documentos a ubicaciones lógicas
- ✅ Creados stubs de compatibilidad
- ✅ Creado índice general

---

**Última actualización:** 05 de Febrero de 2026  
**Versión de la documentación:** 2.0
