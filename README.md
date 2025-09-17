# FacturaPro - Sistema de Inventario y Facturación Electrónica

Un sistema modular y profesional desarrollado en Angular 20 (Zoneless) con Bootstrap para la gestión de inventario y facturación electrónica.

## 🚀 Características Principales

- **Sistema de Autenticación**: Login y registro de usuarios con diferentes roles
- **Gestión de Productos**: CRUD completo con categorías, kardex y alertas de stock
- **Gestión de Clientes**: Administración de clientes con diferentes tipos de documento
- **Facturación Electrónica**: Generación de facturas, boletas y notas de crédito
- **Dashboard Interactivo**: Resumen general con estadísticas y acciones rápidas
- **Arquitectura Modular**: Estructura profesional escalable y mantenible

## 🛠️ Tecnologías Utilizadas

- **Angular 20** (Zoneless Change Detection)
- **Bootstrap 5** (Responsive Design)
- **Font Awesome** (Iconografía)
- **TypeScript** (Tipado fuerte)
- **RxJS** (Programación reactiva)
- **Angular Signals** (Estado reactivo)

## 📁 Estructura del Proyecto

```
src/app/
├── core/                          # Funcionalidades centrales
│   ├── models/                    # Interfaces y tipos
│   ├── services/                  # Servicios principales
│   ├── guards/                    # Guards de navegación
│   └── index.ts
├── shared/                        # Componentes compartidos
├── features/                      # Módulos de funcionalidad
│   ├── auth/                      # Autenticación
│   ├── dashboard/                 # Panel principal
│   ├── products/                  # Gestión de productos
│   ├── customers/                 # Gestión de clientes
│   └── invoicing/                 # Facturación
└── layout/                        # Componentes de layout
```

## 🔐 Credenciales de Demostración

**Administrador:**
- Email: `admin@empresa.com`
- Contraseña: `password123`

**Usuario Regular:**
- Email: `usuario@empresa.com`
- Contraseña: `password123`

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
"# testing-inventory" 
