@echo off
rem Membuka viewer di Chrome layar penuh (kiosk), tanpa server dan tanpa internet.
rem Tutup kiosk dengan Alt+F4.
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
start "" %CHROME% --kiosk --user-data-dir="%TEMP%\matappa-kiosk" --no-first-run --disable-pinch --overscroll-history-navigation=0 --disable-features=TranslateUI "file:///%~dp0index.html"
