# Zentrix — Comportamiento de Casos de Uso

> Un diagrama por cada requisito general.
> - **«include»**: el caso base **siempre** ejecuta el caso incluido (obligatorio)
> - **«extend»**: el caso extensor **opcionalmente** agrega comportamiento al caso base (condicional)

---

## 1. Gestión de Usuarios

```mermaid
graph LR
    Admin(["👤 Administrador"])
    User(["👤 Usuario"])

    subgraph GU["Gestión de Usuarios"]
        IS("Iniciar sesión")
        RP("Recuperar contraseña")
        RU("Registrar usuario")
        MU("Modificar usuario")
        CS("Cambiar estado de usuario")

        VSA("Verificar estado activo")
        VR("Verificar rol del usuario")
        VD("Validar unicidad de datos")
        AR("Asignar rol al usuario")
    end

    Admin --> IS
    Admin --> RP
    Admin --> RU
    Admin --> MU
    Admin --> CS
    User  --> IS
    User  --> RP

    IS  -. "«include»" .-> VSA
    IS  -. "«include»" .-> VR
    RP  -. "«extend»"  .-> IS
    RU  -. "«include»" .-> VD
    RU  -. "«include»" .-> AR
    MU  -. "«include»" .-> VD
    CS  -. "«extend»"  .-> MU
```

---

## 2. Gestión de Informes

```mermaid
graph LR
    Admin(["👤 Administrador"])
    User(["👤 Usuario"])

    subgraph GI["Gestión de Informes"]
        CF("Consultar facturas")
        FF("Filtrar facturas")
        VG("Visualizar gráficas")
        EP("Exportar informe PDF")
        EE("Exportar informe Excel")
    end

    Admin --> CF
    Admin --> VG
    Admin --> EP
    Admin --> EE
    User  --> CF
    User  --> VG
    User  --> EP
    User  --> EE

    FF -. "«extend»"  .-> CF
    VG -. "«include»" .-> CF
    EP -. "«include»" .-> CF
    EE -. "«include»" .-> CF
    EP -. "«extend»"  .-> FF
    EE -. "«extend»"  .-> FF
```

---

## 3. Gestión de Alertas

```mermaid
graph LR
    Admin(["👤 Administrador"])
    User(["👤 Usuario"])

    subgraph GA["Gestión de Alertas"]
        GA1("Generar alertas automáticas")
        CN("Consultar notificaciones")
        ML("Marcar notificación como leída")

        CFF("Consultar facturas del usuario")
        CV("Calcular días hasta vencimiento")
        NA("Crear notificación tipo «alerta»")
        NI("Crear notificación tipo «info»")
    end

    Admin --> CN
    User  --> GA1
    User  --> CN
    User  --> ML

    GA1 -. "«include»" .-> CFF
    GA1 -. "«include»" .-> CV
    NA  -. "«extend»"  .-> GA1
    NI  -. "«extend»"  .-> GA1
    ML  -. "«extend»"  .-> CN
```

---

## Leyenda de relaciones

| Notación | Tipo | Significado |
|---|---|---|
| `──────►` | Asociación | El actor participa en el caso de uso |
| `- - -►` «include» | Include | El caso base **siempre** llama al incluido |
| `- - -►` «extend» | Extend | El caso extensor se activa **condicionalmente** |
