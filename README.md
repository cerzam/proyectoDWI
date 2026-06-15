# CataLog — Landing Page
**Proyecto:** ACT-3 · Desarrollo Web Integral  
**Equipo:** 2  
**Stack:** React 18 + Vite + Tailwind CSS + React Hook Form  
**Flujo de trabajo:** GitHub Flow

---

## 🚀 Setup inicial (solo una vez)

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/cataklog-landing.git
cd cataklog-landing
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Levantar en modo desarrollo
```bash
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 🌿 GitHub Flow — Reglas del equipo

> **`main` siempre debe estar desplegable.**  
> Nadie hace commits directo a `main`. Todo entra por Pull Request.

### Flujo por cada tarea

```
main
 └── feature/integrante-2-problem   ← trabajas aquí
      ├── commit: "feat: estructura inicial"
      ├── commit: "feat: agrega tarjetas de problema"
      └── commit: "fix: corrige espaciado mobile"
           └── Pull Request → revisión → merge a main
```

### Paso a paso

```bash
# 1. Siempre parte desde main actualizado
git checkout main
git pull origin main

# 2. Crea tu rama descriptiva
git checkout -b feature/integrante-2-problem

# 3. Haz tus cambios en tu componente asignado
# (edita Problem.jsx, guarda, prueba en el navegador)

# 4. Agrega solo tus archivos
git add src/components/Problem.jsx

# 5. Commit con mensaje descriptivo
git commit -m "feat(problem): agrega 3 tarjetas con íconos y descripciones"

# 6. Sube tu rama a GitHub
git push origin feature/integrante-2-problem

# 7. Abre un Pull Request en GitHub
#    - Base: main  ←  Compare: feature/integrante-2-problem
#    - Título claro: "Sección Problem con tarjetas"
#    - Asigna a un compañero como reviewer

# 8. Otro integrante revisa y aprueba → merge a main
# 9. Borra la rama después del merge (GitHub lo hace automático)
```

---

## 📋 Convención de commits

```
feat(componente):   nueva funcionalidad
fix(componente):    corrección de bug
style(componente):  cambios visuales / CSS
refactor:           mejora de código sin cambiar funcionalidad
docs:               cambios en README u otros documentos
```

**Ejemplos reales:**
```
feat(hero): agrega sección hero con headline y mockup
feat(cta): integra react-hook-form con validación de email
fix(navbar): corrige scroll al hacer clic en links
style(problem): ajusta padding en mobile
docs: actualiza README con instrucciones de deploy
```

---

## 👥 Ramas asignadas por integrante

| Integrante | Componente | Nombre de rama |
|---|---|---|
| Integrante 1 | `Navbar.jsx` + `Hero.jsx` | `feature/integrante-1-hero` |
| Integrante 2 | `Problem.jsx` | `feature/integrante-2-problem` |
| Integrante 3 | `Solution.jsx` + `Benefits.jsx` | `feature/integrante-3-solution` |
| Integrante 4 | `CTAForm.jsx` + `Footer.jsx` | `feature/integrante-4-cta` |

---

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── Navbar.jsx       → Integrante 1
│   ├── Hero.jsx         → Integrante 1
│   ├── Problem.jsx      → Integrante 2
│   ├── Solution.jsx     → Integrante 3
│   ├── Benefits.jsx     → Integrante 3
│   ├── CTAForm.jsx      → Integrante 4
│   └── Footer.jsx       → Integrante 4
├── App.jsx
├── main.jsx
└── index.css
```

---

## ☁️ Deploy en Vercel

1. Sube el repo a GitHub
2. Entra a [vercel.com](https://vercel.com) → **New Project**
3. Importa tu repositorio
4. Vercel detecta Vite automáticamente → **Deploy**
5. Cada merge a `main` redeploya automáticamente ✅

---

## 📋 Checklist de entrega

- [ ] Repo en GitHub con commits de los 4 integrantes
- [ ] Historial de ramas y PRs visible en GitHub
- [ ] Landing publicada en Vercel con URL funcional
- [ ] CTA con validación de correo funcionando
- [ ] Mínimo 3 interacciones reales documentadas
- [ ] PDF ACT-3-Equipo2.pdf con link, capturas y propuesta de valor

## 🧪 Pruebas de QA

Este proyecto utiliza **Vitest** y **Testing Library** para las pruebas de los componentes.

Para correr la suite de pruebas localmente, ejecuta:
`npm install` (para asegurar que tienes las dependencias)
`npm run test`