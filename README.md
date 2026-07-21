# Atletismo — Gestor de Planillas de Competición

**Transformá las planillas de inscripción de cada institución en planillas de competición listas para usar.**

[![Node](https://img.shields.io/badge/Node-20-green?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4-lightgrey?style=flat-square)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=flat-square)](https://www.docker.com/)

---

## ¿Qué es?

Sistema web para la **Asociación Atlética del Valle** que automatiza la organización de planillas de atletismo. Cada institución entrega su planilla de inscripción en Excel con sus atletas y las disciplinas en las que competirán. El sistema procesa todas las planillas y genera un único archivo Excel con las planillas de competición organizadas por disciplina, categoría y sexo, usando el formato oficial de la asociación.

---

## Stack tecnológico

### Backend
| Tecnología | Uso |
|---|---|
| Node.js 20 | Entorno de ejecución |
| TypeScript | Lenguaje principal |
| Express | Framework web |
| ExcelJS | Lectura de planillas de inscripción |
| JSZip | Manipulación de planillas de competición |
| Multer | Recepción de archivos via HTTP |

### Frontend
| Tecnología | Uso |
|---|---|
| HTML / CSS / JavaScript | Vanilla, sin frameworks |
| Barlow Condensed + Inter | Tipografía |
| Drag & Drop API | Carga de archivos |

### Infraestructura
| Tecnología | Uso |
|---|---|
| Docker + Docker Compose | Contenedorización |

---

## Funcionalidades

### 📥 Procesamiento de planillas
- Carga múltiple de planillas de inscripción `.xlsx` de distintas instituciones
- Soporte para drag & drop o selección manual de archivos
- Lectura dinámica de disciplinas, categorías y sexo desde el Excel
- Detección automática de institución y profesor por hoja

### 📤 Generación de planillas de competición
- Una hoja por cada combinación de disciplina + categoría + sexo
- Usa el formato oficial de la Asociación Atlética del Valle
- Completa automáticamente: nombre, institución, fecha de nacimiento, categoría y sexo
- Lógica de series para carreras cortas (60M–400M): 6 atletas por serie
- Formato simple para carreras largas (600M–3000M) y lanzamientos/saltos

### 🏃 Disciplinas soportadas
| Tipo | Disciplinas |
|---|---|
| Carreras cortas (series) | 60M, 80M, 100M, 150M, 200M, 300M, 400M |
| Carreras largas | 600M, 800M, 1000M, 1200M, 1500M, 2400M, 3000M |
| Lanzamientos | BALA, DISCO, JABA, MART |
| Saltos | S.L., S.T., S.A., S.G. |

### 🖥️ Interfaz web
- Diseño oscuro inspirado en la pista de atletismo
- Estados visuales claros: carga → procesando → descarga
- Animación de loader tipo corredor en pista
- Totalmente responsive

---

## Arquitectura

```
┌─────────────────────────────────────────┐
│           Navegador (puerto 3000)       │
│         HTML + CSS + Vanilla JS         │
└──────────────┬──────────────────────────┘
               │ POST /procesar (multipart)
    ┌──────────▼──────────┐
    │   Express + Multer  │
    │   (memoryStorage)   │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐      ┌─────────────────────┐
    │  Parser (ExcelJS)   │      │  Plantilla oficial  │
    │  Planillas entrada  │      │  PLANILLAS.xlsx      │
    └──────────┬──────────┘      └────────┬────────────┘
               │                          │
    ┌──────────▼──────────┐               │
    │  Grouper            │               │
    │  disciplina_cat_sexo│               │
    └──────────┬──────────┘               │
               │                          │
    ┌──────────▼──────────────────────────▼──┐
    │           Writer (JSZip)               │
    │  Copia hojas de la plantilla,          │
    │  inserta atletas y encabezados         │
    └──────────┬─────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │  Buffer .xlsx       │
    │  (descarga directa) │
    └─────────────────────┘
```

---

## Instalación local

### Requisitos
- Docker Desktop

### 1. Clonar el repositorio

```bash
git clone https://github.com/TomasMoya/planillas-atletismo.git
cd planillas-atletismo
```

### 2. Levantar con Docker

```bash
docker compose up --build
```

La app estará disponible en `http://localhost:3000`.

---

## Uso para el cliente

### Requisitos
- Docker Desktop instalado

### Iniciar el sistema

Doble click en `iniciar.bat`. El navegador se abre automáticamente.

### Detener el sistema

Doble click en `detener.bat`.

---

## Estructura del proyecto

```
planillas-atletismo/
├── src/
│   ├── frontend/              # HTML + CSS + JS vanilla
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   ├── Predetermined_Sheet/   # Plantilla oficial de competición
│   │   └── PLANILLAS.xlsx
│   ├── Models/
│   │   └── models.ts          # Interfaces TypeScript
│   ├── parser.ts              # Lectura de planillas de inscripción
│   ├── grouper.ts             # Agrupación por disciplina/categoría/sexo
│   ├── writter.ts             # Generación del Excel de competición
│   ├── router.ts              # Endpoint POST /procesar
│   └── index.ts               # Entry point Express
├── dist/                      # Build compilado (generado por tsc)
├── Dockerfile
├── docker-compose.yml
├── iniciar.bat
├── detener.bat
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

---

## Módulos

| Módulo | Descripción |
|---|---|
| `parser.ts` | Lee cada Excel de inscripción, extrae institución, profesor, categoría y atletas con sus disciplinas |
| `grouper.ts` | Agrupa los participantes en un `Map` con clave `disciplina_categoria_sexo` |
| `writter.ts` | Carga la plantilla oficial, copia y completa una hoja por cada clave del mapa |
| `router.ts` | Recibe los archivos via Multer, orquesta el flujo y devuelve el Excel |

---

## Autor

**Tomás Moya**
Desarrollado para la Asociación Atlética del Valle.

🌐 [linkedin.com/in/tomas--moya/](https://www.linkedin.com/in/tomas--moya/)
🐙 [github.com/TomasMoya](https://github.com/TomasMoya)
