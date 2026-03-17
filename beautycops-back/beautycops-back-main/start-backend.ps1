# Start Django backend for local development (required for products page).
# Run this before opening http://localhost:3000/products
Set-Location $PSScriptRoot
& .\venv\Scripts\python.exe manage.py runserver 8000
