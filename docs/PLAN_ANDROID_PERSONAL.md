# Plan de Penny para uso personal en Android

Estado: implementación inicial creada; queda probar en un teléfono real y definir una clave de firma de largo plazo.

## Decisión propuesta

La aplicación Android ya está preparada con React y Capacitor. Guarda los gastos en SQLite privado del teléfono y ejecuta ahí las validaciones, categorías, cálculos y reportes. Debe funcionar sin internet y con la computadora apagada.

El usuario confirmó Android y prioriza sencillez y mantenimiento a largo plazo. Por ello, la primera versión no requiere servidor contratado ni base de datos en la nube. La versión de computadora y el teléfono no se sincronizarán automáticamente. La sincronización puede ser un proyecto posterior si llega a necesitarse.

## Situación actual comprobada

- React consulta `/api`; Express procesa los gastos y los reportes.
- Los datos se guardan en `server/data/expenses.json`, en la computadora.
- No hay proyecto Android ni almacenamiento móvil implementado.
- Los PDF se descargan con mecanismos del navegador que deben adaptarse a Android.
- Android Studio y el SDK existen en sus ubicaciones habituales. Queda comprobar versiones y herramientas al implementar.

## Etapas implementadas y pendientes

### 1. Preparación y protección de los datos — iniciada

Trabajo que puede realizar el agente:

- Revisar versiones de Node, Android Studio, SDK, JDK y compatibilidad con Capacitor y el componente SQLite elegido.
- Seleccionar dependencias mantenidas, fijar versiones y dejar instrucciones reproducibles de compilación.
- Preparar una copia de los gastos existentes antes de migrarlos, sin incorporar datos personales al repositorio.
- Definir el identificador estable de la aplicación y las versiones iniciales del esquema de datos.

Participación del usuario: indicar modelo y versión de Android si no pueden consultarse desde un teléfono conectado; aceptar instalaciones o permisos del sistema que lo requieran.

Entrega: entorno listo y decisión documentada sobre compatibilidad del teléfono.

### 2. Funcionamiento independiente y base de datos local — implementada; falta prueba en dispositivo

Trabajo que puede realizar el agente:

- Extraer las validaciones, clasificación, fechas y cálculos del servidor a módulos reutilizables.
- Incorporar SQLite y un acceso a datos separado de las pantallas.
- Guardar identificadores, importes en centavos, fechas, notas y categorías de forma persistente.
- Implementar alta, edición, eliminación, búsqueda, gráficas y reportes sin llamadas al servidor.
- Añadir transacciones y migraciones de esquema para actualizar la aplicación conservando registros.
- Importar el JSON existente mediante una operación validada, evitando duplicados y comprobando cantidades y totales.
- Conservar la semántica de la moneda existente; no convertir ni reinterpretar importes sin una decisión explícita.

Entrega: todas las funciones principales trabajan en modo avión y conservan datos al cerrar y reiniciar.

### 3. Experiencia Android — proyecto generado; falta prueba en dispositivo

Trabajo que puede realizar el agente:

- Crear el proyecto Capacitor y empaquetar los recursos de la interfaz dentro de la aplicación.
- Configurar icono, nombre, pantalla inicial y comportamiento del botón Atrás.
- Ajustar teclado, formularios, áreas de pantalla y tamaños táctiles.
- Preparar textos claros en español y mensajes de error recuperables.
- Generar y guardar/compartir los PDF con las funciones de archivos de Android.
- Evitar permisos innecesarios y usar el selector del sistema cuando se elijan archivos.

Entrega: aplicación autónoma con icono propio y uso cómodo en pantalla de teléfono.

### 4. Respaldo y recuperación — implementada; falta probar transferencia real

Trabajo que puede realizar el agente:

- Añadir botones para exportar y restaurar un respaldo completo en formato documentado y versionado.
- Mostrar fecha del último respaldo y un recordatorio dentro de la aplicación cuando convenga exportar otro.
- Permitir guardar o compartir el archivo usando el selector de Android, incluida una ubicación externa elegida por el usuario.
- Validar el archivo antes de restaurarlo; mostrar cuántos registros contiene y pedir confirmación antes de reemplazar datos.
- Ejecutar la restauración de forma atómica y conservar una copia previa recuperable.
- Mantener los PDF como reportes: no tratarlos como respaldos restaurables.

Participación del usuario: guardar periódicamente una copia fuera del teléfono, por ejemplo en su computadora o Drive. Una copia dentro del mismo teléfono no protege contra su pérdida. La exportación mediante el selector no equivale a sincronización automática con Drive.

Entrega: restauración comprobada en una instalación limpia de prueba. Android elimina los datos privados al desinstalar la app; el respaldo externo permite recuperarlos.

### 5. Pruebas para uso habitual — pendiente

Trabajo que puede realizar el agente:

- Verificar los cálculos y la persistencia con pruebas relevantes y datos de prueba.
- Probar guardar, editar, eliminar, buscar y generar reportes en modo avión.
- Comprobar cierre forzado, reapertura y reinicio del dispositivo.
- Probar respaldo, archivo inválido, importación repetida y restauración.
- Instalar una actualización sobre una versión anterior de prueba y comprobar que conserva datos.
- Revisar PDF, teclado, botón Atrás y pantallas en emulador y, si hay acceso, en el teléfono real.

Participación del usuario: conectar/desbloquear el teléfono y aceptar la depuración USB si se utiliza; completar la comprobación física que no pueda automatizarse.

Entrega: registro de resultados y limitaciones reales pendientes. No declarar verificación en teléfono real si solo se probó un emulador.

### 6. APK firmado, instalación y actualizaciones — APK de depuración compilado

Trabajo que puede realizar el agente:

- Configurar una compilación de release y la firma, manteniendo claves y contraseñas fuera del código y del repositorio.
- Generar el APK firmado, con versión visible, y entregar su ruta y guía de instalación.
- Preparar instrucciones para conservar la clave de firma y producir futuras versiones.
- Documentar que las actualizaciones deben conservar identificador y firma, incrementando la versión y migrando la base cuando sea necesario.

Participación del usuario: instalar el APK y aceptar los avisos que muestre Android; conservar una copia segura de la clave de firma y sus credenciales. Para instalar directamente un APK, Android exige autorizar la fuente correspondiente. Se comprobarán los requisitos vigentes aplicables al dispositivo y región cuando se distribuya.

Entrega actual: APK de depuración instalable. La compilación de release con una clave del usuario, instalación física y actualización sobre el teléfono todavía requieren comprobarse. Las nuevas versiones se instalarán manualmente sobre la anterior; una tienda o canal de actualización automática sería una ampliación.

## Servicios externos y mantenimiento

La solución propuesta no necesita contratar hosting, conectar una base remota ni crear cuentas de acceso para guardar gastos. La base local se configura desde el código; el agente puede implementarla.

Si después se desea sincronización entre computadora y celular, se añadirá autenticación, base de datos remota, reglas de acceso y sincronización con gestión de conflictos. El agente puede programar la integración y preparar el despliegue. El usuario tendría que aportar acceso a la cuenta del proveedor, completar verificaciones y aprobar cualquier contratación. No se presupone que el servicio sea gratuito indefinidamente.

El mantenimiento consistirá en conservar respaldos, código fuente, versiones de herramientas y clave de firma; actualizar dependencias ante problemas de seguridad o compatibilidad, y repetir las comprobaciones de datos y actualización cuando corresponda. No se promete mantenimiento autónomo o indefinido.

## Criterio de finalización

El trabajo estará completo cuando el usuario pueda instalar Penny en su Android, registrar y consultar gastos con la computadora apagada y sin internet, compartir un reporte, recuperar un respaldo y actualizar la aplicación sin perder los registros. La entrega debe incluir APK firmado, código, instrucciones y resultados de las verificaciones. Esta primera implementación cumple con la ruta técnica, pero aún requiere validación en el teléfono del usuario y un keystore de release respaldado para actualizaciones a largo plazo.

## Referencias oficiales consultadas

- Capacitor y requisitos de Android: https://capacitorjs.com/docs/getting-started/environment-setup
- Firma y actualizaciones Android: https://developer.android.com/studio/publish/app-signing
- Almacenamiento privado y desinstalación: https://developer.android.com/training/data-storage/app-specific
- Distribución directa de aplicaciones: https://developer.android.com/distribute/marketing-tools/alternative-distribution
