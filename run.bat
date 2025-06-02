@echo off
echo [ INFORMACION ] Vermeil-Bot para Windows

REM Ejecutar el archivo setup.bat
echo [Console @ Vermeil-Bot] Verificando si los programas de ejecucion estan instalados...
call setup.bat

REM Verificar si setup.bat terminó correctamente
if %errorlevel% neq 0 (
    echo [Console @ Vermeil-Bot] setup.bat termino con errores, pero se continuara con la ejecución.
)

REM Ejecutar node index.js
echo [Console @ Vermeil-Bot] Iniciando Vermeil-Bot...
node index.js
if %errorlevel% neq 0 (
    echo [ERROR] Ocurrio un error. Verifica la instalacion.
)

REM Pausa final para mantener la ventana abierta
echo Presiona una tecla para cerrar esta ventana...
pause