cmake_minimum_required(VERSION 3.14)
project(seat_recommender)

set(CMAKE_CXX_STANDARD 17)

add_executable(seat_recommender src/seat_recommender.cpp)

# Emscripten flags
set_target_properties(seat_recommender PROPERTIES
    SUFFIX ".js"
    LINK_FLAGS "\
        -lembind \
        -s MODULARIZE=1 \
        -s EXPORT_NAME='createSeatModule' \
        -s ENVIRONMENT='web' \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s EXPORTED_RUNTIME_METHODS='[]' \
        -O2 \
        --bind \
    "
)
