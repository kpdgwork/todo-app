#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./build-tar.sh [VERSION] [OUTPUT_DIR]
# Examples:
#   ./build-tar.sh                     # VERSION=1.0.0, OUTPUT_DIR=..
#   ./build-tar.sh 1.2.3               # OUTPUT_DIR=..
#   ./build-tar.sh 1.2.3 /tmp/out
#
# Environment overrides:
#   IMAGE_PREFIX=<name>   # เช่น nsme หรือ nsme-api (ถ้าไม่ตั้ง จะเดาจากชื่อโฟลเดอร์/git)
#   APP_NAME=<name>       # ใช้เป็น fallback ถ้าไม่ตั้ง IMAGE_PREFIX
#   ENVS="prod uat"       # ค่าเริ่มต้น "prod uat stg"
#   COMPRESS=true         # บีบอัดเป็น .tar.gz
#
# Notes:
# - สคริปต์นี้รัน build/save แบบ "ทีละอัน" (ไม่ขนาน) ตามที่ขอ

VERSION="${1:-latest}"
OUTPUT_DIR="${2:-..}"

# เดา IMAGE_PREFIX: ใช้ ENV ก่อน ถ้าไม่มี ใช้ APP_NAME, ถ้าไม่มีอีก ใช้ชื่อ repo หรือชื่อโฟลเดอร์ปัจจุบัน
# IMAGE_PREFIX="${IMAGE_PREFIX:-${APP_NAME:-$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")}}"
IMAGE_PREFIX=focusflow
# ENVS="${ENVS:-production uat qa}"
ENVS="${ENVS:-production}"
COMPRESS="${COMPRESS:-false}"

mkdir -p "$OUTPUT_DIR"

# mapping env -> dockerfile (สะกดให้ตรงกับไฟล์ที่มีอยู่)
declare -A DOCKERFILES=(
  [production]="Dockerfile.production"
  [uat]="Dockerfile.uat"
  [qa]="Dockerfile.qa"
)

build_and_save() {
  local env="$1"
  local dockerfile="${DOCKERFILES[$env]}"
  local tag="${IMAGE_PREFIX}-${env}:${VERSION}"
  local tar="${OUTPUT_DIR}/${IMAGE_PREFIX}-${env}.tar"

  if [[ -z "${dockerfile:-}" || ! -f "$dockerfile" ]]; then
    echo "!! ไม่พบ $dockerfile ข้าม ${env}"
    return 0
  fi

  echo ">> Building ${tag} using ${dockerfile}"
  docker build -f "$dockerfile" -t "$tag" .

  if [[ "$COMPRESS" == "true" ]]; then
    echo ">> Saving (gzip) ${tag} -> ${tar}.gz"
    docker save "$tag" | gzip -9 > "${tar}.gz"
  else
    echo ">> Saving ${tag} -> ${tar}"
    docker save -o "$tar" "$tag"
  fi

  echo "✓ Done ${tag}"
}

# รันทีละอัน (sequential)
for env in $ENVS; do
  build_and_save "$env"
done

echo
echo "All artifacts in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR" | grep "${IMAGE_PREFIX}-" || true