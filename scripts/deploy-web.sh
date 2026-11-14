#!/usr/bin/env bash
# نسخهٔ وب از 2026-11-14 خودکار منتشر می‌شود: هر push به شاخهٔ redesign در GitHub Actions (build-web)
# کتاب‌ها و برنامه را می‌سازد و روی شاخهٔ gh-pages می‌گذارد؛ GitHub Pages از gh-pages منتشر می‌کند.
# این اسکریپت فقط همان ساخت را دستی از نو اجرا می‌کند و منتظر پایانش می‌ماند.
set -e
gh workflow run build-web --repo yasinfadayiee/mishkat --ref redesign
sleep 5
id=$(gh run list --repo yasinfadayiee/mishkat --workflow build-web --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$id" --repo yasinfadayiee/mishkat --exit-status
echo "منتشر شد؛ تا یکی دو دقیقه دیگر روی https://yasinfadayiee.github.io/mishkat/ دیده می‌شود."
