@echo off

where /Q php && php -S localhost:8000 -t src

where /Q py && py -m http.server -d src 8000
