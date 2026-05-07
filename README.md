# CRUD - VIDEOGAMES

## Descripción

**GameVault CRUD** es una aplicación web para gestionar una colección de videojuegos. Permite registrar, consultar, editar y eliminar videojuegos de forma sencilla e intuitiva. Utiliza **IndexedDB** como base de datos persistente en el navegador, sin necesidad de instalar ningún servidor.

---

## Tecnologías utilizadas

| Tecnología | Rol |
|---|---|
| **HTML5** | Estructura de la aplicación |
| **CSS3** | Estilos y diseño responsivo |
| **JavaScript (ES6+)** | Lógica de la aplicación |
| **IndexedDB** | Base de datos persistente en el navegador (no requiere servidor) |

> **¿Por qué IndexedDB?** Es una base de datos real integrada en todos los navegadores modernos. Persiste los datos entre sesiones, soporta índices, transacciones y puede almacenar miles de registros. Es la opción ideal para aplicaciones web sin backend.

---

## Funcionalidades

- **Registrar** nuevos videojuegos con validación de campos obligatorios
- **Consultar** la lista completa de videojuegos en una tabla
- **Buscar** por título, género o desarrollador en tiempo real
- **Filtrar** por género (Acción, RPG, Aventura, Deportes, etc.)
- **Editar** información de videojuegos existentes
- **Eliminar** videojuegos con confirmación previa
- **Estadísticas** en tiempo real (total, géneros, rating promedio)

### Campos del registro

Cada videojuego cuenta con los siguientes campos:

| Campo | Tipo | Descripción |
|---|---|---|
| `titulo` | Texto | Nombre del videojuego *(obligatorio)* |
| `genero` | Selección | Categoría del juego (Acción, RPG, etc.) |
| `plataforma` | Selección | PC, PS5, Nintendo Switch, Xbox, etc. |
| `anio` | Número | Año de lanzamiento |
| `desarrollador` | Texto | Empresa/estudio que lo desarrolló *(obligatorio)* |
| `calificacion` | Número (1–10) | Rating del juego con visualización de estrellas |
| `descripcion` | Texto | Breve descripción del juego |

---

## Instrucciones para ejecutar el proyecto

### Opción 1 – Abrir directamente (recomendado)

1. Clona o descarga el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/GameVault-CRUD.git
   cd GameVault-CRUD
   ```

2. Abre el archivo `index.html` en tu navegador:
   - **Windows/Mac**: Doble clic sobre `index.html`
   - **Linux**: `xdg-open index.html`

> ⚠️ **Nota:** Para que IndexedDB funcione correctamente en algunos navegadores, puede ser necesario servir el proyecto desde un servidor local (ver Opción 2).

### Opción 2 – Con servidor local (Live Server)

Si tienes **VS Code** con la extensión **Live Server**:

1. Abre la carpeta del proyecto en VS Code.
2. Haz clic derecho sobre `index.html` → **"Open with Live Server"**.
3. El navegador se abrirá automáticamente.

### Opción 3 – Con Python

```bash
# Python 3
python -m http.server 8080

# Luego abre: http://localhost:8080
```

### Opción 4 – Con Node.js

```bash
npx serve .
# Luego abre la URL que indique la terminal
```

---

## Estructura del proyecto

```
GameVault-CRUD/
├── index.html      # Estructura HTML de la aplicación
├── style.css       # Estilos y diseño responsivo
├── app.js          # Lógica CRUD con IndexedDB
└── README.md       # Este archivo
```

---

## Uso de Inteligencia Artificial

Este proyecto fue desarrollado **con asistencia de IA (Claude de Anthropic)**. La IA se utilizó para:

- Generar la estructura base del HTML, CSS y JavaScript.
- Diseñar la interfaz de usuario (paleta de colores, layout, tipografía).
- Implementar la lógica de IndexedDB (apertura, transacciones, CRUD).
- Redactar este archivo README.md.
- Sugerir datos de ejemplo y validaciones de formulario.

El código fue revisado y adaptado para cumplir con los requerimientos del proyecto.

---
