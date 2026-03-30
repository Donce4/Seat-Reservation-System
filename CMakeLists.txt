cmake_minimum_required(VERSION 3.10)
project(seat-reservation-system)

# Use C++ 20 for Crow
set(CMAKE_CXX_STANDARD 20)

# Find our libraries
find_package(Crow CONFIG REQUIRED)
find_package(libpqxx CONFIG REQUIRED)

# Create the program
add_executable(seat_server src/main.cpp)

# Link the libraries to our program
target_link_libraries(seat_server PRIVATE Crow::Crow libpqxx::pqxx)