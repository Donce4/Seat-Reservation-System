#!/usr/bin/env bash
# Run this from the wasm/ directory with Emscripten activated:
#   source /path/to/emsdk/emsdk_env.sh
#   ./build.sh

set -e

OUT_DIR="../public/wasm"
mkdir -p "$OUT_DIR"

emcc src/seat_recommender.cpp \
    --bind \
    -lembind \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='createSeatModule' \
    -s ENVIRONMENT='web' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -O2 \
    -o "$OUT_DIR/seat_recommender.js"

echo "✅ Built → $OUT_DIR/seat_recommender.js + seat_recommender.wasm"
