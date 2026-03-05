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
        CS("Cambiar estado\nde usuario")

        VSA("Verificar estado\nactivo")
        VR("Verificar rol\ndel usuario")
        VD("Validar unicidad\nde datos")
        AR("Asignar rol\nal usuario")
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
        CF("Consultar\nfacturas")
        FF("Filtrar\nfacturas")
        VG("Visualizar\ngráficas")
        EP("Exportar informe\nPDF")
        EE("Exportar informe\nExcel")
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
        GA1("Generar alertas\nautomáticas")
        CN("Consultar\nnotificaciones")
        ML("Marcar notificación\ncomo leída")

        CFF("Consultar facturas\ndel usuario")
        CV("Calcular días\nhasta vencimiento")
        NA("Crear notificación\ntipo «alerta»")
        NI("Crear notificación\ntipo «info»")
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


  Gestión de Usuarios
  - Iniciar sesión «include» verificar estado activo y verificar rol → siempre se ejecutan
  - Recuperar contraseña «extend» iniciar sesión → solo cuando el usuario no puede acceder
  - Registrar usuario «include» validar datos y asignar rol → siempre obligatorio
  - Cambiar estado «extend» modificar usuario → es una acción opcional sobre el usuario

  Gestión de Informes
  - Visualizar gráficas, Exportar PDF/Excel «include» consultar facturas → siempre necesitan los datos primero
  - Filtrar facturas «extend» consultar facturas → opcional
  - Exportar «extend» filtrar → se puede exportar con o sin filtros aplicados

  Gestión de Alertas
  - Generar alertas «include» consultar facturas y calcular días → pasos obligatorios
  - Notificación alerta/info «extend» generar → condicional según los días restantes
  - Marcar como leída «extend» consultar notificaciones → acción opcional del usuario