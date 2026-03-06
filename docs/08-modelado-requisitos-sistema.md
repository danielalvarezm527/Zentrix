# Zentrix — Modelado de Requisitos del Sistema

```mermaid
graph LR
    Admin(["👤 Administrador"])
    User(["👤 Usuario"])

    subgraph Zentrix["  Sistema Zentrix  "]

        subgraph GU["Gestión de Usuarios"]
            RF01("Autenticar usuario")
            RF02("Recuperar contraseña")
            RF03("Crear usuario")
            RF04("Modificar datos de usuario")
            RF05("Cambiar estado de usuario inactivo / activo")
        end

        subgraph GI["Gestión de Informes"]
            RF06("Consultar facturas propias")
            RF07("Consultar todas las facturas")
            RF08("Filtrar facturas")
            RF09("Visualizar gráficas de indicadores")
            RF10("Exportar informe en PDF / Excel")
        end

        subgraph GA["Gestión de Alertas"]
            RF11("Generar alertas automáticas por vencimiento de factura")
            RF12("Consultar alertas y notificaciones")
            RF13("Marcar notificación como leída")
        end

    end

    Admin --> RF01
    Admin --> RF02
    Admin --> RF03
    Admin --> RF04
    Admin --> RF05
    Admin --> RF07
    Admin --> RF08
    Admin --> RF09
    Admin --> RF10
    Admin --> RF12

    User --> RF01
    User --> RF02
    User --> RF06
    User --> RF08
    User --> RF09
    User --> RF10
    User --> RF11
    User --> RF12
    User --> RF13
```

---

## Requisitos Funcionales

### Gestión de Usuarios

| ID | Requisito | Actor |
|---|---|---|
| RF01 | Autenticar usuario mediante email y contraseña | Administrador, Usuario |
| RF02 | Recuperar contraseña vía correo electrónico | Administrador, Usuario |
| RF03 | Crear nuevo usuario con rol asignado | Administrador |
| RF04 | Modificar datos de un usuario existente | Administrador |
| RF05 | Cambiar estado de usuario (activo / inactivo) | Administrador |

### Gestión de Informes

| ID | Requisito | Actor |
|---|---|---|
| RF06 | Consultar las facturas propias del usuario | Usuario |
| RF07 | Consultar todas las facturas del sistema | Administrador |
| RF08 | Filtrar facturas por número, estado y fechas | Administrador, Usuario |
| RF09 | Visualizar gráficas de indicadores de facturación | Administrador, Usuario |
| RF10 | Exportar informe de facturas en PDF o Excel | Administrador, Usuario |

### Gestión de Alertas

| ID | Requisito | Actor |
|---|---|---|
| RF11 | Generar alertas automáticas cuando una factura está próxima a vencer o vencida | Usuario |
| RF12 | Consultar alertas y notificaciones del sistema | Administrador, Usuario |
| RF13 | Marcar notificación como leída | Usuario |
