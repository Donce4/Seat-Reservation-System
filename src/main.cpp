#include "crow.h"
#include <pqxx/pqxx>
#include <iostream>
#include <cstdlib>

int main()
{
    crow::SimpleApp app;

    // get route to check the seat
    CROW_ROUTE(app, "/status")([]()
                               {
        try {
            // Connect to Railwat
            const char* db_url_env = std::getenv("DATABASE_URL");
            if (!db_url_env) 
            {
            throw std::runtime_error("DATABASE_URL environment variable is missing!");
            }
            pqxx::connection c(db_url_env);
            pqxx::work txn(c);
            
            // Query the table we created
            pqxx::result r = txn.exec("SELECT status FROM poc_seat WHERE id = 1");
            
            if (r.empty()) return crow::response(404, "Seat not found");
            
            return crow::response(r[0][0].as<std::string>());
        } catch (const std::exception& e) {
            return crow::response(500, e.what());
        } });

    std::cout << "Server running on port 18080..." << std::endl;
    app.port(18080).multithreaded().run();
}