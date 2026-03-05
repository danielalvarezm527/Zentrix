# Zentrix — Diagramas de Secuencia

## 1. Login Exitoso

```mermaid
sequenceDiagram
    actor U as Usuario
    participant L as Login.js
    participant FA as Firebase Auth
    participant FS as Firestore
    participant R as React Router

    U->>L: Ingresa email y contraseña
    U->>L: Click en "Iniciar sesión"
    L->>FA: signInWithEmailAndPassword(email, pass)
    FA-->>L: user (uid, email)
    L->>FS: getDoc(users/{uid})
    FS-->>L: { isActive: true, rol: "User" }
    L->>R: navigate("/dashboard/user")
    R-->>U: Renderiza UserDashboard
```

---

## 2. Login Fallido (usuario inactivo)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant L as Login.js
    participant FA as Firebase Auth
    participant FS as Firestore

    U->>L: Ingresa credenciales válidas
    L->>FA: signInWithEmailAndPassword(email, pass)
    FA-->>L: user (uid)
    L->>FS: getDoc(users/{uid})
    FS-->>L: { isActive: false }
    L->>FA: signOut()
    FA-->>L: OK
    L-->>U: Error: "Tu cuenta está deshabilitada"
```

---

## 3. Carga del UserDashboard

```mermaid
sequenceDiagram
    actor U as Usuario
    participant UD as UserDashboard.js
    participant FA as Firebase Auth
    participant FS as Firestore
    participant NS as notificationService

    U->>UD: Navega a /dashboard/user
    UD->>FA: onAuthStateChanged()
    FA-->>UD: user (uid)

    par Carga de datos
        UD->>FS: getDoc(users/{uid})
        FS-->>UD: userData (nombre)
    and
        UD->>FS: getDocs(Invoice where user_id == uid)
        FS-->>UD: facturas[]
    end

    UD->>NS: generateUserNotifications(uid)
    NS->>FS: getDocs(Invoice where user_id == uid AND status != radicada)
    FS-->>NS: facturasPendientes[]
    loop Por cada factura
        NS->>NS: calcular días hasta vencimiento
        NS->>FS: getDocs(Notification where invoice_id == id AND sent_date == hoy)
        FS-->>NS: notifExistente?
        alt No existe notificación hoy
            NS->>FS: addDoc(Notification)
            FS-->>NS: OK
        end
    end

    UD->>FS: getDocs(Notification where user_id == uid AND is_read == false)
    FS-->>UD: notificaciones[]
    UD->>UD: Clasificar alertas urgentes/normales
    UD->>UD: Calcular datos gráficas
    UD-->>U: Renderiza dashboard completo
```

---

## 4. Registro de Nuevo Usuario (Admin)

```mermaid
sequenceDiagram
    actor A as Administrador
    participant AD as AdminDashboard.js
    participant FS as Firestore
    participant FA as Firebase Auth
    participant US as userService

    A->>AD: Completa formulario y confirma
    AD->>FS: getDocs(users where username == X)
    FS-->>AD: [] (vacío)
    AD->>FS: getDocs(users where documento == X)
    FS-->>AD: [] (vacío)
    AD->>FA: createUserWithEmailAndPassword(email, pass)
    FA-->>AD: newUser (uid)
    AD->>US: saveUserData(uid, { nombre, rol, ... })
    US->>FS: setDoc(users/{uid}, data)

    alt Éxito
        FS-->>US: OK
        US-->>AD: OK
        AD-->>A: "Usuario creado exitosamente"
    else Error en Firestore
        FS-->>US: Error
        US-->>AD: Error
        AD->>FA: deleteUser(newUser)
        FA-->>AD: OK (rollback)
        AD-->>A: "Error al guardar datos"
    end
```

---

## 5. Recuperación de Contraseña

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FP as ForgotPassword.js
    participant RP as ResetPassword.js
    participant FA as Firebase Auth
    participant Email as Servicio de Email

    U->>FP: Ingresa email
    FP->>FA: sendPasswordResetEmail(email)
    FA->>Email: Enviar link con oobCode
    FA-->>FP: OK
    FP-->>U: "Revisa tu correo"

    U->>Email: Abre correo
    Email-->>U: Link con ?oobCode=ABC123
    U->>RP: Navega al link
    RP->>FA: verifyPasswordResetCode(oobCode)

    alt Código válido
        FA-->>RP: email del usuario
        RP-->>U: Muestra formulario nueva contraseña
        U->>RP: Ingresa nueva contraseña (x2)
        RP->>FA: confirmPasswordReset(oobCode, newPassword)
        FA-->>RP: OK
        RP-->>U: "Contraseña actualizada"
    else Código inválido/expirado
        FA-->>RP: Error
        RP-->>U: "El enlace no es válido o expiró"
    end
```

---

## 6. Toggle de Estado de Usuario (Admin)

```mermaid
sequenceDiagram
    actor A as Administrador
    participant AD as AdminDashboard.js
    participant US as userService
    participant FS as Firestore

    A->>AD: Click en Habilitar/Inhabilitar usuario
    AD->>US: toggleUserStatus(uid, !isActive)
    US->>FS: updateDoc(users/{uid}, { isActive: newValue })
    FS-->>US: OK
    US-->>AD: OK
    AD->>US: getAllUsers()
    US->>FS: getDocs(users)
    FS-->>US: usuarios[]
    US-->>AD: usuarios[]
    AD-->>A: Lista actualizada con nuevo estado
```
