# Guía de contribución — GitFlow

Este proyecto usa **GitFlow**. A partir de ahora, todo el trabajo se integra a través de `develop`, no directo a `main`.

## Ramas

- **`main`** — rama protegida, siempre desplegable. Solo recibe merges desde `develop` vía Pull Request aprobado.
- **`develop`** — rama de integración. Aquí se juntan todas las `feature/*` antes de pasar a `main`.
- **`feature/<nombre-de-la-tarea>`** — rama de trabajo individual, creada desde `develop`.

## Flujo de trabajo

```bash
# 1. Partir siempre desde develop actualizado
git checkout develop
git pull origin develop

# 2. Crear tu rama de trabajo
git checkout -b feature/tu-tarea

# 3. Trabajar y hacer commits pequeños y descriptivos
git add <archivos>
git commit -m "feat(area): descripción del cambio"

# 4. Subir tu rama
git push -u origin feature/tu-tarea

# 5. Abrir Pull Request → base: develop
#    - Incluir "Closes #<número-de-issue>" en la descripción
#    - Asignar a un compañero como reviewer
```

## Convención de commits

```
feat(area):     nueva funcionalidad
fix(area):      corrección de bug
style(area):    cambios visuales / CSS
refactor(area): mejora de código sin cambiar funcionalidad
docs:           cambios en documentación
ci:             cambios en pipelines / GitHub Actions
test:           pruebas
```

## Reglas de revisión

- Nadie aprueba su propio Pull Request.
- Cada PR debe pasar el workflow de CI (`.github/workflows/ci.yml`) antes de poder mergearse.
- Tras el merge a `develop`, se elimina la rama `feature/*` correspondiente.
