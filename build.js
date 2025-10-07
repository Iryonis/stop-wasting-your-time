// build.js
const esbuild = require("esbuild");
const fs = require("fs");
const { execSync } = require("child_process");

// 1. Clean dist directory
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist");

// 2. Copy static files
fs.copyFileSync("src/manifest.json", "dist/manifest.json");
fs.copyFileSync("src/popup/popup.html", "dist/popup.html");
fs.copyFileSync("src/redirect_page/redirect.html", "dist/redirect.html");

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
    "src/popup/popup.js",
    "src/content_scripts/redirect.js",
    "src/content_scripts/video_checker.js",
    "src/content_scripts/shorts_hider.js",
    "src/redirect_page/redirect_page.js",
    "src/i18n.js",
  ],
  outdir: "dist",
  entryNames: "[name]",
  bundle: true,
  minify: true,
  target: ["chrome120"],
});

// 6. Compile Tailwind CSS
execSync("npx tailwindcss -i ./src/style.css -o ./dist/output.css --minify", {
  stdio: "inherit",
});
