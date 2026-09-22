# Almacenamiento, Samsung y APK

## Dónde se guardan tus datos hoy

Los gastos se guardan en **`server/data/expenses.json`**, dentro de este proyecto, en la computadora que ejecuta Node/Express. La ruta no depende del directorio desde el que inicies el servidor. `EXPENSE_DATA_FILE` permite configurar otra ruta.

- El archivo conserva los gastos al cerrar el navegador o reiniciar el servidor.
- El navegador no es la base de datos: borrar su caché no elimina ese archivo.
- El archivo incluye identificador, concepto, importe en centavos, fecha, nota, categoría, color y fecha de creación.
- Los PDF se generan en el navegador con los datos del reporte. Descargar uno no modifica los gastos.
- Para un respaldo completo, detén el backend y copia `server/data/expenses.json` a una ubicación segura. Un PDF es un reporte, no un archivo de restauración.

## Compartir entre computadora y celular

Los dos dispositivos deben consultar **la misma API y el mismo almacenamiento**. Instalar un APK no copia ni sincroniza automáticamente el archivo JSON de tu computadora. `localhost` en el Samsung significa el propio teléfono.

### Probar ahora dentro de la misma red Wi-Fi

Esta alternativa ya está soportada mediante la variable opcional `HOST`:

1. Conecta ambos dispositivos a tu red Wi-Fi privada y deja la computadora encendida.
2. Detén cualquier backend anterior en el puerto 3001 con Ctrl+C.
3. En PowerShell, desde la raíz del proyecto:

   ```powershell
   npm run build
   $env:HOST = '0.0.0.0'
   npm start
   ```

4. En otra terminal ejecuta `ipconfig` y localiza la **dirección IPv4** del adaptador Wi-Fi activo. Por ejemplo, si es `192.168.1.25`, abre `http://192.168.1.25:3001` en el navegador de ambos dispositivos. Sustituye esa IP por la real.
5. Si Windows pregunta, permite Node únicamente en tu red privada. La red debe permitir comunicación entre dispositivos; algunas redes de invitados la bloquean.
6. Agrega o edita un gasto y recarga el otro dispositivo para verlo. No existe sincronización automática en tiempo real; ambos consultan el mismo backend.

El servidor entrega frontend y API en el mismo origen. Esta prueba usa HTTP en una red de confianza y no publica nada en Internet. El prototipo todavía no tiene usuarios ni contraseña: cualquier dispositivo con acceso a ese puerto puede modificar los mismos gastos. No abras ese puerto del router hacia Internet.

Al terminar, Ctrl+C y `Remove-Item Env:HOST` en esa terminal restablecen la configuración habitual. El valor predeterminado es `127.0.0.1`, accesible sólo desde tu computadora.

### Usarlo fuera de casa y con la computadora apagada

La arquitectura sería:

```text
Web en computadora ──┐
                    ├── API Express HTTPS ── almacenamiento persistente compartido
APK en Samsung ─────┘
```

Antes de publicar hacen falta estos cambios:

1. Alojar Express y el frontend bajo HTTPS.
2. Agregar inicio de sesión y autorización para que sólo tú puedas leer/modificar tus gastos.
3. Usar almacenamiento persistente con respaldos. Para conservar el JSON debe existir un volumen persistente y una sola instancia de Node; no sirve el disco temporal de muchos alojamientos. Para una aplicación de uso habitual conviene una base de datos.
4. Configurar el frontend del APK con la URL HTTPS de la API y los orígenes permitidos. Actualmente usa `/api`, que funciona con el servidor web del proyecto, pero no apunta a tu computadora dentro de un APK.
5. Comprobar los cambios desde ambos dispositivos. Sin conexión al servidor, la versión actual no permite consultar o modificar gastos.

Se puede conservar el esquema de la rúbrica: MVC para separar responsabilidades, Singleton para administrar una conexión de datos y Factory para validar/crear gastos.

## Cómo generar el APK cuando la API compartida esté preparada

**Esta entrega no incluye un APK ni un proyecto Android compilado.** Los pasos siguientes explican la siguiente fase. Capacitor empaqueta el frontend web; no ejecuta automáticamente Express dentro del teléfono.

1. Instala Android Studio y el SDK/JDK requeridos por la versión de Capacitor elegida. Revisa los requisitos vigentes en la [guía de entorno](https://capacitorjs.com/docs/getting-started/environment-setup).
2. Después de adaptar y probar la URL de la API, ejecuta desde `client/`:

   ```sh
   npm install @capacitor/core @capacitor/android
   npm install -D @capacitor/cli
   npx cap init
   ```

   En el asistente, usa nombre `Penny`, un identificador propio como `com.tunombre.penny`, y `dist` como directorio de archivos web (`webDir`). Mantén los paquetes de Capacitor en la misma versión mayor.

3. Compila y crea el proyecto nativo:

   ```sh
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
   ```

4. Android Studio abrirá la carpeta `client/android`. Prueba en el Samsung conectado por USB o en un emulador.
5. Para un APK de prueba, genera el APK de depuración desde las opciones de compilación. Una alternativa en PowerShell dentro de `client/android` es `./gradlew.bat assembleDebug`; la salida habitual es `app/build/outputs/apk/debug/app-debug.apk`.
6. Transfiere el APK al Samsung y autoriza su instalación desde la aplicación que abre ese archivo. Para distribuir una versión final, genera y firma un APK de release y conserva la clave de firma.
7. Valida también guardar/compartir el PDF en Android. La descarga web actual funciona en el navegador; el contenedor nativo puede requerir las APIs Filesystem/Share de Capacitor para guardar y compartir el archivo.

Después de modificar React: `npm run build`, `npx cap sync android` y una nueva compilación Android.

Referencias oficiales: [instalar Capacitor](https://capacitorjs.com/docs/getting-started), [Android con Capacitor](https://capacitorjs.com/docs/android), [compilar y ejecutar en Android Studio](https://developer.android.com/studio/run).
