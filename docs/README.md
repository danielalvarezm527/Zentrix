# Zentrix — Documentación del Proyecto

Sistema de gestión de facturas desarrollado con React y Firebase para el Hospital Pablo Tobón Uribe.

## Índice de Documentos

| # | Documento | Contenido |
|---|---|---|
| 01 | [Arquitectura del Sistema](./01-arquitectura.md) | Stack, estructura de archivos, jerarquía de componentes, rutas |
| 02 | [Esquema de Base de Datos](./02-esquema-base-de-datos.md) | ERD, colecciones Firestore, campos y tipos |
| 03 | [Flujos de Datos](./03-flujo-de-datos.md) | Diagramas de flujo: login, registro, dashboard, seed, exportación |
| 04 | [Diagramas de Secuencia](./04-diagramas-de-secuencia.md) | Interacciones detalladas entre componentes, servicios y Firebase |
| 05 | [Casos de Uso](./05-casos-de-uso.md) | Actores, casos de uso y descripciones funcionales |

## Renderizado de diagramas

Todos los diagramas están en formato **Mermaid**. Se pueden ver en:
- **GitHub** — renderizado automático en archivos `.md`
- **VS Code** — extensión [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)
- **Notion** — bloque de código con lenguaje `mermaid`
- **mermaid.live** — editor online en https://mermaid.live

## Resumen del Sistema

```
Roles:     Admin | User
Auth:      Firebase Authentication (email/password)
DB:        Cloud Firestore — 5 colecciones
Colecciones: users · Invoice · Notification · Erpcompany · Role
```
