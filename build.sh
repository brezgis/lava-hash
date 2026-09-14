#!/usr/bin/env bash
# Wrap index.html (artifact source: no doctype or head of its own) into a standalone page in docs/,
# which is where GitHub Pages can serve it from.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p docs
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
  printf '<meta name="description" content="Twelve simulated lava lamps whose wax is a simplicial complex. Persistent homology draws a barcode under each lamp, and a camera photographs the wall into a SHA-256 pool.">\n'
  printf '<link rel="icon" href="data:image/svg+xml,%%3Csvg xmlns=%%22http://www.w3.org/2000/svg%%22 viewBox=%%220 0 100 100%%22%%3E%%3Ctext y=%%22.9em%%22 font-size=%%2290%%22%%3E%%F0%%9F%%AB%%A7%%3C/text%%3E%%3C/svg%%3E">\n'
  # everything up to and including </style> belongs in <head>
  sed -n '1,/^<\/style>$/p' index.html
  printf '</head>\n<body>\n'
  sed -n '/^<\/style>$/,$p' index.html | sed '1d'
  printf '</body>\n</html>\n'
} > docs/index.html
echo "built docs/index.html ($(wc -c < docs/index.html) bytes)"
