@echo off
echo Building dango Tizen TV (.wgt)...
cd /d "%~dp0"
node package-wgt.js
