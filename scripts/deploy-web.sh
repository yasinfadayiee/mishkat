#!/usr/bin/env bash
# نسخهٔ وب را می‌سازد و روی https://yasinfadayiee.github.io/mishkat/ منتشر می‌کند
set -e
root="$(cd "$(dirname "$0")/.." && pwd)"
npm --prefix "$root/app" run build
site="$(mktemp -d)"
git clone -q --depth 1 https://github.com/yasinfadayiee/mishkat.git "$site"
find "$site" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r "$root/app/dist/." "$site/" && touch "$site/.nojekyll"
cd "$site"
git add -A
git -c user.name=yasinfadayiee -c user.email=yasinfadayie1383@gmail.com commit -qm "Update web build" || { echo "تغییری نبود"; exit 0; }
git push -q origin main
echo "منتشر شد؛ تا یکی دو دقیقه دیگر روی سایت دیده می‌شود."
