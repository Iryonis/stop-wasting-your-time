// build.js
const esbuild = require("esbuild");
const fs = require("fs");
const { execSync } = require("child_process");

// 1. Clean dist directory
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist");

// 2. Copy static files
fs.copyFileSync("src/manifest.json", "dist/manifest.json");
fs.copyFileSync("src/popup.html", "dist/popup.html");
fs.copyFileSync("src/redirect.html", "dist/redirect.html");

// 3. Copy assets
fs.mkdirSync("dist/assets", { recursive: true });
fs.mkdirSync("dist/assets/fonts", { recursive: true });
fs.cpSync("src/assets/fonts", "dist/assets/fonts", { recursive: true });
fs.mkdirSync("dist/assets/favicons", { recursive: true });
fs.cpSync("src/assets/favicons", "dist/assets/favicons", { recursive: true });

// 4. Copy locales
fs.mkdirSync("dist/_locales", { recursive: true });
fs.cpSync("src/_locales", "dist/_locales", { recursive: true });

// 5. Bundler JavaScript files
esbuild.buildSync({
  entryPoints: [
    "src/background.js",
    "src/popup.js",
    "src/redirect.js",
    "src/redirect_page.js",
    "src/i18n.js",
    "src/video_checker.js",
  ],
  outdir: "dist",
  bundle: true,
  minify: true,
  target: ["chrome114"],
});

// 6. Compile Tailwind CSS
execSync("npx tailwindcss -i ./src/style.css -o ./dist/output.css --minify", {
  stdio: "inherit",
});
