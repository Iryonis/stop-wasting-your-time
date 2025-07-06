#!/bin/bash

rm -rf dist
mkdir -p dist

# Generate minified CSS
npx tailwindcss -i ./src/style.css -o ./dist/output.css --minify

# Copy necessary files to dist
cp src/manifest.json dist/
cp src/*.html dist/
cp src/*.js dist/

# Copy assets
mkdir -p dist/assets/fonts
cp -r src/assets/fonts/* dist/assets/fonts/
mkdir -p dist/assets/favicons
cp -r src/assets/favicons/* dist/assets/favicons/

# Copy translations
mkdir -p dist/_locales
cp -r src/_locales/* dist/_locales/
