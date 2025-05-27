#!/bin/bash

rm -rf dist
mkdir -p dist

# Generate minified CSS
npx tailwindcss -i ./src/style.css -o ./dist/output.css --minify

# Copy necessary files to dist
cp /src/manifest.json dist/
cp src/*.html dist/
cp src/*.js dist/
