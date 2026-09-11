# CajaFácil Cuba

Punto de venta, inventario y contador de efectivo para pequeños y medianos 
negocios cubanos. Funciona 100% offline, sin registro, sin licencias y sin 
suscripciones.

---

## Descripción

CajaFácil Cuba es una aplicación web progresiva (PWA) diseñada para bodegas, 
cafeterías, kioscos, dulcerías, agromercados y cualquier negocio que necesite 
controlar sus ventas, su inventario y su caja sin depender de internet.

Todos los datos se guardan localmente en el dispositivo del usuario. Una vez 
abierta la aplicación con conexión, los estilos y los íconos quedan guardados 
en caché y el sistema funciona completamente offline.

---

## Características

### Punto de Venta
- Búsqueda rápida de productos por nombre o código.
- Ticket editable con control de cantidades.
- Descuento automático de existencias al cobrar.
- Historial de ventas con fecha, hora y detalle de artículos.

### Inventario
- Alta, edición y eliminación de productos.
- Campos: nombre, código, precio y stock.
- Indicador visual de stock bajo, agotado o disponible.
- Filtro de búsqueda en tiempo real.

### Contador de Efectivo
- Conteo por denominación de billetes y monedas.
- Denominaciones CUP: 5000, 2000, 1000, 500, 200, 100, 50, 20, 10 y 5.
- Denominaciones USD: 100, 50, 20, 10, 5 y 1.
- Botones de incremento y decremento por denominación.
- Subtotal automático por línea y total general en vivo.
- Comparación con el monto esperado en caja (sobrante o faltante).
- Historial de conteos guardados con fecha y total.

### Caja y Turnos
- Apertura de turno con monto inicial.
- Registro de retiros de caja (sangría) con motivo.
- Cálculo automático del efectivo esperado.
- Cierre de turno con resumen guardado en el historial.

### Reportes
- Total de ventas del día.
- Total histórico de ventas.
- Cantidad de transacciones registradas.
- Listado cronológico de las últimas ventas.
- Exportación a CSV.

### Ajustes
- Nombre del negocio.
- Tasa de cambio USD a CUP.
- Exportación e importación de datos en formato JSON.
- Borrado completo de la base de datos local.

### Interfaz
- Tema claro y oscuro.
- Navegación inferior fija con seis secciones.
- Diseño adaptado a teléfonos y tabletas.
- Sin emojis: uso exclusivo de íconos Tabler.

---

## Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Estructura | HTML5 |
| Estilos | CSS3 y TailwindCSS (CDN) |
| Lógica | JavaScript vanilla |
| Íconos | Tabler Icons Webfont |
| Almacenamiento | localStorage |
| Modo offline | Service Worker + Cache API |
| Instalación | Web App Manifest (PWA) |

No requiere frameworks, bundlers, ni proceso de compilación.

---

## Estructura del proyecto

```

caja-facil-cuba/
├── index.html              Punto de Venta
├── inventario.html         Inventario
├── contador.html           Contador de Efectivo
├── caja.html               Caja y Turnos
├── reportes.html           Reportes
├── ajustes.html            Ajustes
├── css/
│   └── styles.css          Estilos personalizados
├── js/
│   ├── app.js              Núcleo compartido
│   ├── pos.js              Lógica del punto de venta
│   ├── inventario.js       Lógica del inventario
│   ├── contador.js         Lógica del contador
│   ├── caja.js             Lógica de caja y turnos
│   ├── reportes.js         Lógica de reportes
│   └── ajustes.js          Lógica de ajustes
├── icons/
│   ├── icon-192.png        Ícono PWA 192×192
│   └── icon-512.png        Ícono PWA 512×512
├── manifest.json           Configuración PWA
├── sw.js                   Service Worker
└── README.md               Este archivo

```

---

## Instalación y uso

### Requisitos
- Un navegador moderno (Chrome, Edge, Firefox, Safari).
- Un servidor HTTP local o remoto (el Service Worker no funciona con `file://`).

### Ejecución local

Opción 1: con Python
```

cd caja-facil-cuba
python -m http.server 8080

```

Opción 2: con Node.js
```

npx serve caja-facil-cuba

```

Opción 3: con PHP
```

cd caja-facil-cuba
php -S localhost:8080

```

Luego abre en el navegador:
```

http://localhost:8080

```

### Instalación como aplicación

1. Abrir la URL con conexión a internet la primera vez.
2. Esperar a que el Service Worker descargue y almacene los recursos.
3. En el menú del navegador, seleccionar "Añadir a pantalla de inicio".
4. A partir de ese momento la aplicación se abre como app y funciona offline.

---

## Publicación en hosting gratuito

### GitHub Pages
1. Crear un repositorio público en GitHub.
2. Subir todos los archivos del proyecto.
3. Ir a Settings > Pages.
4. Seleccionar la rama `main` y la carpeta `/root`.
5. Guardar y esperar unos minutos.
6. La aplicación estará disponible en:
```

https://usuario.github.io/caja-facil-cuba/

```

### Netlify
1. Crear cuenta gratuita en netlify.com.
2. Arrastrar la carpeta del proyecto a la zona de despliegue.
3. Netlify entrega una URL pública automáticamente.

### Vercel
1. Crear cuenta gratuita en vercel.com.
2. Importar el repositorio de GitHub.
3. Desplegar sin configuración adicional.

---

## Almacenamiento de datos

Toda la información se guarda en el navegador del usuario mediante 
`localStorage`, con las siguientes claves:

| Clave | Contenido |
|---|---|
| `cfc_productos` | Listado de productos |
| `cfc_ventas` | Historial de ventas |
| `cfc_turno` | Turno actualmente abierto |
| `cfc_conteos` | Historial de conteos de efectivo |
| `cfc_ajustes` | Configuración del negocio |
| `cfc_turnosCerrados` | Historial de turnos finalizados |

### Consideraciones
- Los datos se almacenan por navegador y por dispositivo.
- Si el usuario borra los datos del navegador, se pierde la información.
- Se recomienda exportar un respaldo JSON periódicamente desde Ajustes.

---

## Copia de seguridad

### Exportar
Desde Ajustes, pulsar "Exportar datos (JSON)". Se descarga un archivo con 
toda la información del negocio.

### Importar
Desde Ajustes, seleccionar el archivo JSON previamente exportado. La 
aplicación reemplaza los datos actuales por los del archivo.

---

## Modo offline

El archivo `sw.js` implementa una estrategia de caché en dos fases:

1. Durante la instalación del Service Worker, se descargan y almacenan:
   - Todos los archivos locales del proyecto.
   - Los recursos externos: TailwindCSS y Tabler Icons, incluyendo las 
     fuentes `.woff2`, `.woff` y `.ttf`.

2. Durante el uso normal, todas las peticiones se sirven primero desde 
   la caché. Si un recurso no está guardado, se busca en la red y se 
   almacena para futuras visitas.

Esto garantiza que la aplicación funcione sin conexión después de la 
primera carga.

---

## Compatibilidad

| Navegador | Soporte |
|---|---|
| Chrome para Android | Completo |
| Chrome para escritorio | Completo |
| Edge | Completo |
| Firefox | Completo |
| Safari iOS 11.3 o superior | Completo |
| Navegadores antiguos | Sin soporte PWA |

---

## Personalización

### Cambiar colores
Editar las variables CSS en `css/styles.css`:
```

:root {
--primary: #2563eb;
--success: #16a34a;
--danger: #dc2626;
}

```

### Cambiar nombre de la aplicación
Editar los siguientes archivos:
- `manifest.json` → campos `name` y `short_name`.
- Encabezados `<title>` de cada archivo HTML.
- Texto "CajaFácil Cuba" en `ajustes.html`.

### Cambiar denominaciones del contador
Editar el objeto `DENOMS` en `js/contador.js`:
```

const DENOMS = {
CUP: [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5],
USD: [100, 50, 20, 10, 5, 1]
};

```

---

## Privacidad

- No se envían datos a ningún servidor.
- No se usan cookies de rastreo.
- No se solicita registro ni correo electrónico.
- No hay analítica ni publicidad.
- Toda la información permanece en el dispositivo del usuario.

---

## Limitaciones conocidas

- Los datos no se sincronizan entre dispositivos.
- Si el usuario borra la caché o los datos del navegador, pierde la 
  información no respaldada.
- El Service Worker requiere HTTPS o `localhost` para funcionar.
- El historial de ventas y conteos crece indefinidamente en localStorage, 
  que tiene un límite aproximado de 5 a 10 MB según el navegador.

---

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Puede usarse, modificarse 
y redistribuirse libremente, siempre citando el origen.

---

## Autor

Desarrollado para pequeños y medianos negocios cubanos.

Versión: 1.0.0
Última actualización: septiembre 2026

---

## Contacto y contribuciones

Las mejoras, reportes de errores y sugerencias son bienvenidos. Se puede 
colaborar mediante issues o pull requests en el repositorio del proyecto.
```
