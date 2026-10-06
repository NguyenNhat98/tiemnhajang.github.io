@echo off
npx --yes esbuild js/main.js --bundle --format=iife --outfile=js/bundle.js
