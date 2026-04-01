@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM ============================================================
REM  Kullanim (habitracker klasorunde):
REM    git-push.bat
REM        -> Commit mesajini sorar, sonra add + commit + push
REM    git-push.bat tek kelime
REM    git-push.bat birden fazla kelime tirnak icinde
REM        ornek: git-push.bat "Panel ve protokol duzeni"
REM  Aktif branch otomatik (main, master, vb.)
REM ============================================================

if "%~1"=="" goto askmsg
set "COMMIT_MSG=%*"
goto run

:askmsg
set /p "COMMIT_MSG=Commit mesaji: "

:run
if "%COMMIT_MSG%"=="" (
  echo [Hata] Commit mesaji bos.
  pause
  exit /b 1
)

echo.
echo --- git add .
git add .
if errorlevel 1 goto err

echo.
echo --- git status -s
git status -s

echo.
echo --- git commit
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
  echo Commit olmadi ^(degisiklik yok veya hata^).
  pause
  exit /b 1
)

for /f "tokens=*" %%B in ('git branch --show-current 2^>nul') do set "BR=%%B"
if "%BR%"=="" set "BR=main"

echo.
echo --- git push origin %BR%
git push origin "%BR%"
if errorlevel 1 goto err

echo.
echo Tamam: origin/%BR%
pause
exit /b 0

:err
echo.
echo Bir hata oldu. Yukaridaki ciktiyi kontrol et.
pause
exit /b 1
