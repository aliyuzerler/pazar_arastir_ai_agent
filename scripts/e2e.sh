#!/usr/bin/env bash
# E2E ön temizlik: 3000 portunu kapat, eski next süreçlerini bitir.
# Soluk sunucular yanlış build'i servis edip testleri sarkıttığı için
# her koşudan önce çalıştırılır.
set -u

lsof -ti:3000 2>/dev/null | xargs -r kill -9 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next start" 2>/dev/null
sleep 1

if lsof -ti:3000 >/dev/null 2>&1; then
  echo "HATA: 3000 portu hâlâ dolu" >&2
  exit 1
fi
echo "port 3000 temiz"
exec npx playwright test "$@"
