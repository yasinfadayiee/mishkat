@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem اگر فیلترشکن به‌صورت پراکسی کار می‌کند، Node از همان پراکسی استفاده می‌کند
set NODE_USE_ENV_PROXY=1
node scripts\gemini-runner.mjs
pause
