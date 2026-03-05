# Zentrix — Diagramas de Flujo de Datos

## 1. Flujo de Autenticación y Login

```mermaid
flowchart TD
    A([Usuario ingresa\nemail y contraseña]) --> B[Login.js\nhandleLogin]
    B --> C{¿Campos vacíos?}
    C -- Sí --> D[Mostrar error:\nCampos obligatorios]
    C -- No --> E[Firebase Auth\nsignInWithEmailAndPassword]
    E --> F{¿Autenticación\nexitosa?}
    F -- No --> G{Tipo de error}
    G --> H[Mapear a mensaje\nen español]
    H --> D
    F -- Sí --> I[isUserActive uid\nFirestore: users]
    I --> J{¿Usuario activo?}
    J -- No --> K[signOut\nMostrar: cuenta inactiva]
    J -- Sí --> L[getUserRole uid\nFirestore: users]
    L --> M{¿Rol?}
    M -- Admin --> N[Navigate\n/dashboard/admin]
    M -- User --> O[Navigate\n/dashboard/user]
    M -- Sin rol --> P[Mostrar error:\nrol no encontrado]
```

---

## 2. Flujo de Recuperación de Contraseña

```mermaid
flowchart TD
    A([Usuario en Login\nclic en ¿Olvidaste tu contraseña?]) --> B[Navigate /forgot-password]
    B --> C[Usuario ingresa email]
    C --> D[Firebase Auth\nsendPasswordResetEmail]
    D --> E{¿Email existe\nen el sistema?}
    E -- No --> F[Firebase Error\nUsuario no encontrado]
    F --> G[Mostrar error]
    E -- Sí --> H[Firebase envía\ncorreo con link]
    H --> I[Mostrar confirmación\nal usuario]
    I --> J([Usuario abre\nel correo])
    J --> K[Click en link\n/reset-password?oobCode=...]
    K --> L[ResetPassword.js\nverifyPasswordResetCode]
    L --> M{¿Código válido?}
    M -- No/Expirado --> N[Mostrar error:\ncódigo inválido]
    M -- Sí --> O[Mostrar email\ndel usuario]
    O --> P[Usuario ingresa\nnueva contraseña x2]
    P --> Q{¿Contraseñas\ncoinciden y ≥6 chars?}
    Q -- No --> R[Mostrar error\nde validación]
    Q -- Sí --> S[Firebase Auth\nconfirmPasswordReset]
    S --> T[Mostrar éxito]
    T --> U([Navigate /login])
```

---

## 3. Flujo del UserDashboard (carga de datos)

```mermaid
flowchart TD
    A([Usuario navega a\n/dashboard/user]) --> B[onAuthStateChanged\nFirebase Auth]
    B --> C{¿Usuario\nautenticado?}
    C -- No --> D[Navigate /login]
    C -- Sí --> E[getUserById uid\nFirestore: users]
    E --> F[Cargar facturas del usuario\nFirestore: Invoice\nwhere user_id == uid]
    F --> G[generateUserNotifications uid\nnotificationService]
    G --> H[Query facturas\nstatus != radicada]
    H --> I{Por cada factura\ncalcular días hasta vencimiento}
    I --> J{¿Ya existe notificación\npara esta factura hoy?}
    J -- Sí --> K[Saltar]
    J -- No --> L{Días hasta vencimiento}
    L -- "≤ -1 (vencida)" --> M["Crear: alerta\n'está vencida'"]
    L -- "= 0 (hoy)" --> N["Crear: alerta\n'vence hoy - URGENTE'"]
    L -- "1-7 días" --> O["Crear: alerta\n'vence en X días - Crítica'"]
    L -- "8-22 días" --> P["Crear: info\n'vence en X días'"]
    M & N & O & P --> Q[addDoc Notification\nFirestore]
    Q --> R[Cargar notificaciones sin leer\nFirestore: Notification\nwhere user_id == uid]
    R --> S[Clasificar alertas\nUrgentes ≤7 días vs Normales 8-22 días]
    S --> T[Calcular datos para gráficas\nPie + Line]
    T --> U([Renderizar Dashboard])
```

---

## 4. Flujo de Registro de Usuario (Admin)

```mermaid
flowchart TD
    A([Admin completa formulario\nde registro]) --> B{¿Campos\nobligatorios?}
    B -- Vacíos --> C[Mostrar error]
    B -- Completos --> D[Query Firestore: users\nwhere username ==]
    D --> E{¿Username\nya existe?}
    E -- Sí --> F[Mostrar: usuario duplicado]
    E -- No --> G[Query Firestore: users\nwhere documento ==]
    G --> H{¿Documento\nya existe?}
    H -- Sí --> I[Mostrar: documento duplicado]
    H -- No --> J[Firebase Auth\ncreateUserWithEmailAndPassword]
    J --> K{¿Auth exitoso?}
    K -- No --> L[Mostrar error Auth]
    K -- Sí --> M[saveUserData uid\nFirestore: users]
    M --> N{¿Firestore exitoso?}
    N -- Sí --> O[Mostrar éxito\nCerrar formulario]
    N -- No --> P[ROLLBACK:\nEliminar usuario de Auth]
    P --> Q[Mostrar error]
```

---

## 5. Flujo de Generación de Datos Dummy (Seed)

```mermaid
flowchart TD
    A([Admin clic en\n'Generar datos dummy']) --> B[window.confirm]
    B -- Cancelar --> C([Nada])
    B -- Confirmar --> D[seedAllData]
    D --> E[generateErpCompanies 3]
    E --> F["Crear 3 empresas ERP\n(datos fijos hardcodeados)"]
    F --> G[addDoc × 3\nFirestore: Erpcompany]
    G --> H[generateInvoices 20]
    H --> I[Por cada factura\ngenerar aleatoriamente]
    I --> J["30% radicada\n35% pendiente\n25% pendiente/devuelta crítica\n10% vencida"]
    J --> K[addDoc × 20\nFirestore: Invoice]
    K --> L[Mostrar resultado\nX empresas, X facturas]
    L --> M[setTimeout 3s\nwindow.location.reload]

    style J text-align:left
```

---

## 6. Flujo de Exportación (PDF / Excel)

```mermaid
flowchart LR
    A([Usuario clic\nExportar]) --> B{¿Tipo?}

    B -- PDF --> C[jsPDF\nnew jsPDF]
    C --> D[Agregar título]
    D --> E[Agregar encabezados\nde columnas]
    E --> F[Iterar filas\nde datos]
    F --> G[Formatear valores\nfechas, montos, estado]
    G --> H[doc.save\narchivo.pdf]

    B -- Excel --> I[XLSX\naoa_to_sheet]
    I --> J[Convertir array\na worksheet]
    J --> K[book_append_sheet]
    K --> L[writeFile\narchivo.xlsx]
```
