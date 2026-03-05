# Zentrix — Casos de Uso

## Diagrama General de Actores

```mermaid
graph LR
    Admin((Administrador))
    User((Usuario))
    Firebase((Firebase\nAuth + Firestore))

    Admin --> CU1[Iniciar sesión]
    Admin --> CU2[Recuperar contraseña]
    Admin --> CU3[Registrar usuario]
    Admin --> CU4[Gestionar usuarios]
    Admin --> CU5[Ver todas las facturas]
    Admin --> CU6[Ver todas las notificaciones]
    Admin --> CU7[Generar datos dummy]
    Admin --> CU8[Exportar reportes]

    User --> CU1
    User --> CU2
    User --> CU9[Ver mis facturas]
    User --> CU10[Ver mis notificaciones]
    User --> CU11[Exportar mis reportes]

    CU1 --> Firebase
    CU2 --> Firebase
    CU3 --> Firebase
    CU4 --> Firebase
    CU5 --> Firebase
    CU9 --> Firebase
```

---

## Casos de Uso por Actor

### Actor: Usuario

```mermaid
graph TD
    subgraph Sistema Zentrix
        CU1["CU-01\nIniciar Sesión"]
        CU2["CU-02\nRecuperar Contraseña"]
        CU9["CU-09\nVer Mis Facturas"]
        CU10["CU-10\nVer Mis Alertas"]
        CU11["CU-11\nExportar Mis Facturas\n(PDF / Excel)"]
        CU12["CU-12\nFiltrar Facturas"]
        CU13["CU-13\nCerrar Sesión"]
    end

    U((Usuario)) --> CU1
    U --> CU2
    U --> CU9
    U --> CU10
    U --> CU11
    U --> CU12
    U --> CU13

    CU9 -.include.-> CU10
    CU11 -.extend.-> CU12
```

---

### Actor: Administrador

```mermaid
graph TD
    subgraph Sistema Zentrix
        CU1["CU-01\nIniciar Sesión"]
        CU2["CU-02\nRecuperar Contraseña"]
        CU3["CU-03\nRegistrar Usuario"]
        CU4A["CU-04\nEditar Usuario"]
        CU4B["CU-05\nHabilitar/Inhabilitar Usuario"]
        CU5["CU-06\nVer Todas las Facturas"]
        CU6["CU-07\nVer Todas las Notificaciones"]
        CU7["CU-08\nGenerar Datos Dummy"]
        CU8A["CU-09\nExportar Facturas\n(PDF / Excel)"]
        CU8B["CU-10\nExportar Notificaciones\n(PDF / Excel)"]
        CU11["CU-11\nFiltrar Facturas"]
        CU12["CU-12\nFiltrar Notificaciones"]
        CU13["CU-13\nCerrar Sesión"]
    end

    A((Administrador)) --> CU1
    A --> CU2
    A --> CU3
    A --> CU4A
    A --> CU4B
    A --> CU5
    A --> CU6
    A --> CU7
    A --> CU8A
    A --> CU8B
    A --> CU13

    CU8A -.extend.-> CU11
    CU8B -.extend.-> CU12
```

---

## Descripción de Casos de Uso

### CU-01: Iniciar Sesión
| Campo | Detalle |
|---|---|
| **Actor** | Usuario, Administrador |
| **Precondición** | El usuario tiene una cuenta activa |
| **Flujo principal** | 1. Ingresa email y contraseña → 2. Sistema valida en Firebase Auth → 3. Sistema verifica estado activo en Firestore → 4. Sistema obtiene rol → 5. Redirige al dashboard correspondiente |
| **Flujo alternativo** | Credenciales incorrectas → Mensaje de error en español |
| **Flujo alternativo** | Cuenta inactiva → Cierre de sesión + mensaje de error |
| **Postcondición** | Usuario en su dashboard según rol |

---

### CU-02: Recuperar Contraseña
| Campo | Detalle |
|---|---|
| **Actor** | Usuario, Administrador |
| **Precondición** | El usuario tiene un email registrado |
| **Flujo principal** | 1. Ingresa email → 2. Firebase envía link → 3. Usuario accede al link → 4. Valida código → 5. Ingresa nueva contraseña → 6. Confirma cambio |
| **Flujo alternativo** | Email no registrado → Mensaje de error |
| **Flujo alternativo** | Link expirado → Mensaje de código inválido |
| **Postcondición** | Contraseña actualizada, usuario redirigido a /login |

---

### CU-03: Registrar Usuario
| Campo | Detalle |
|---|---|
| **Actor** | Administrador |
| **Precondición** | Admin autenticado |
| **Flujo principal** | 1. Completa formulario → 2. Valida username único → 3. Valida documento único → 4. Crea en Firebase Auth → 5. Guarda perfil en Firestore |
| **Flujo alternativo** | Username/documento duplicado → Error de validación |
| **Flujo alternativo** | Error en Firestore → Rollback: elimina usuario de Auth |
| **Postcondición** | Nuevo usuario creado con rol y estado activo |

---

### CU-04: Editar Usuario
| Campo | Detalle |
|---|---|
| **Actor** | Administrador |
| **Precondición** | Admin autenticado, usuario existe |
| **Flujo principal** | 1. Selecciona usuario → 2. Modifica campos → 3. Confirma → 4. updateDoc en Firestore |
| **Postcondición** | Datos del usuario actualizados |

---

### CU-05: Habilitar / Inhabilitar Usuario
| Campo | Detalle |
|---|---|
| **Actor** | Administrador |
| **Precondición** | Admin autenticado, usuario existe |
| **Flujo principal** | 1. Click en toggle de estado → 2. toggleUserStatus en Firestore → 3. Lista se actualiza |
| **Efecto** | Usuario con `isActive: false` no puede iniciar sesión |
| **Postcondición** | Estado del usuario actualizado |

---

### CU-06: Ver Facturas
| Campo | Detalle |
|---|---|
| **Actor** | Usuario (solo las propias), Administrador (todas) |
| **Precondición** | Autenticado |
| **Flujo principal** | 1. Carga dashboard → 2. Firestore devuelve facturas filtradas por rol → 3. Se muestran en tabla con estado coloreado |
| **Filtros disponibles** | Número, estado, usuario (solo admin), fecha de emisión, fecha de vencimiento |
| **Postcondición** | Facturas visibles en tabla y gráficas |

---

### CU-07: Exportar Reporte
| Campo | Detalle |
|---|---|
| **Actor** | Usuario, Administrador |
| **Precondición** | Autenticado, datos cargados |
| **Flujo principal** | 1. Click en PDF o Excel → 2. Se genera archivo con datos actuales de la tabla → 3. Descarga automática |
| **Postcondición** | Archivo descargado en el dispositivo |

---

### CU-08: Generar Datos Dummy
| Campo | Detalle |
|---|---|
| **Actor** | Administrador |
| **Precondición** | Admin autenticado |
| **Flujo principal** | 1. Click en "Generar datos" → 2. Confirmación → 3. Crea 3 empresas ERP + 20 facturas → 4. Recarga la página |
| **Nota** | Las notificaciones se generan automáticamente al iniciar sesión |
| **Postcondición** | Datos de prueba disponibles en el sistema |

---

### CU-09: Ver Alertas / Notificaciones
| Campo | Detalle |
|---|---|
| **Actor** | Usuario |
| **Precondición** | Autenticado |
| **Flujo principal** | 1. Carga dashboard → 2. Sistema genera notificaciones automáticas → 3. Clasifica en urgentes (≤7 días) y normales (8-22 días) → 4. Muestra badge con contador |
| **Postcondición** | Usuario informado sobre facturas próximas a vencer |
