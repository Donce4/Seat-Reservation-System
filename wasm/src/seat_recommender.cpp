#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include <sstream>
#include <limits>

// Seat: row/col = LOCAL position in sector; gx/gy = GLOBAL arena position
struct Seat {
    std::string id;
    int         row;
    int         col;
    double      price;
    bool        isAvailable;
    int         sectionWeight;   // 149->4, 72->3, 39->2
    double      gx;
    double      gy;
    int         sectorId;

    double distanceTo(double x, double y) const {
        double dx = gx - x, dy = gy - y;
        return std::sqrt(dx * dx + dy * dy);
    }
};

// Venue: centerPoint = court centre (50,50) in arena % space
class Venue {
public:
    std::vector<Seat>        allSeats;
    std::pair<double,double> centerPoint{50.0, 50.0};

    void loadSeats(const std::vector<Seat>& seats) { allSeats = seats; }
    void updateSeatStatus(const std::string& id, bool status) {
        for (auto& s : allSeats) if (s.id == id) { s.isAvailable = status; return; }
    }
    std::vector<Seat> getAvailableSeats() const {
        std::vector<Seat> out;
        for (const auto& s : allSeats) if (s.isAvailable) out.push_back(s);
        return out;
    }
};

class RecommendationStrategy {
public:
    virtual ~RecommendationStrategy() = default;
    virtual std::vector<std::string> findSeats(const Venue& venue, int count) const = 0;
};

// CenteredStrategy: closest to court centre (global position)
class CenteredStrategy : public RecommendationStrategy {
public:
    std::vector<std::string> findSeats(const Venue& venue, int count) const override {
        auto available = venue.getAvailableSeats();
        if (available.empty()) return {};
        double cx = venue.centerPoint.first, cy = venue.centerPoint.second;
        std::sort(available.begin(), available.end(),
            [cx, cy](const Seat& a, const Seat& b){ return a.distanceTo(cx,cy) < b.distanceTo(cx,cy); });
        std::vector<std::string> result;
        int n = std::min(count, (int)available.size());
        for (int i = 0; i < n; ++i) result.push_back(available[i].id);
        return result;
    }
};

// GroupStrategy: same sector + same row, consecutive seat numbers
class GroupStrategy : public RecommendationStrategy {
public:
    std::vector<std::string> findSeats(const Venue& venue, int count) const override {
        auto available = venue.getAvailableSeats();
        if (available.empty()) return {};
        double cx = venue.centerPoint.first, cy = venue.centerPoint.second;

        struct Key { int sector; int row; };
        std::vector<std::pair<Key, std::vector<Seat>>> groups;
        auto findGroup = [&](int sector, int row) -> std::vector<Seat>* {
            for (auto& g : groups) if (g.first.sector == sector && g.first.row == row) return &g.second;
            return nullptr;
        };
        for (const auto& s : available) {
            auto* grp = findGroup(s.sectorId, s.row);
            if (grp) grp->push_back(s);
            else groups.push_back({ {s.sectorId, s.row}, {s} });
        }

        std::vector<std::string> bestRun;
        double bestDist = std::numeric_limits<double>::max();
        for (auto& g : groups) {
            auto& rowSeats = g.second;
            std::sort(rowSeats.begin(), rowSeats.end(),
                [](const Seat& a, const Seat& b){ return a.col < b.col; });
            for (size_t i = 0; i + count <= rowSeats.size(); ++i) {
                bool consecutive = true;
                for (int k = 1; k < count; ++k)
                    if (rowSeats[i+k].col != rowSeats[i+k-1].col + 1) { consecutive = false; break; }
                if (!consecutive) continue;
                double dist = 0;
                for (int k = 0; k < count; ++k) dist += rowSeats[i+k].distanceTo(cx, cy);
                dist /= count;
                if (dist < bestDist) {
                    bestDist = dist;
                    bestRun.clear();
                    for (int k = 0; k < count; ++k) bestRun.push_back(rowSeats[i+k].id);
                }
            }
        }
        if (!bestRun.empty()) return bestRun;

        std::sort(available.begin(), available.end(),
            [cx, cy](const Seat& a, const Seat& b){ return a.distanceTo(cx,cy) < b.distanceTo(cx,cy); });
        std::vector<std::string> result;
        int n = std::min(count, (int)available.size());
        for (int i = 0; i < n; ++i) result.push_back(available[i].id);
        return result;
    }
};

// ValueStrategy: sectionWeight/price, ties by centre proximity
class ValueStrategy : public RecommendationStrategy {
public:
    std::vector<std::string> findSeats(const Venue& venue, int count) const override {
        auto available = venue.getAvailableSeats();
        if (available.empty()) return {};
        double cx = venue.centerPoint.first, cy = venue.centerPoint.second;
        std::sort(available.begin(), available.end(),
            [cx, cy](const Seat& a, const Seat& b){
                double sa = (a.price>0)? (double)a.sectionWeight/a.price : 0;
                double sb = (b.price>0)? (double)b.sectionWeight/b.price : 0;
                if (std::abs(sa-sb) > 1e-9) return sa > sb;
                return a.distanceTo(cx,cy) < b.distanceTo(cx,cy);
            });
        std::vector<std::string> result;
        int n = std::min(count, (int)available.size());
        for (int i = 0; i < n; ++i) result.push_back(available[i].id);
        return result;
    }
};

class SeatRecommender {
    Venue venue;
    RecommendationStrategy* strategy = nullptr;
    void deleteStrategy() { delete strategy; strategy = nullptr; }
public:
    ~SeatRecommender() { deleteStrategy(); }
    void setStrategy(const std::string& type) {
        deleteStrategy();
        if      (type == "centered") strategy = new CenteredStrategy();
        else if (type == "group")    strategy = new GroupStrategy();
        else if (type == "value")    strategy = new ValueStrategy();
        else                         strategy = new CenteredStrategy();
    }
    std::vector<std::string> suggest(int count) {
        if (!strategy || venue.allSeats.empty()) return {};
        return strategy->findSeats(venue, count);
    }
    void loadVenueSeats(const std::vector<Seat>& seats) { venue.loadSeats(seats); }
    void updateSeatStatus(const std::string& id, bool status) { venue.updateSeatStatus(id, status); }
    void clearVenueSeats() { venue.allSeats.clear(); }
};

class WASMWrapper {
    SeatRecommender recommender;
public:
    void clearVenue() { recommender.clearVenueSeats(); pendingSeats.clear(); }

    void addSeat(const std::string& id, int localRow, int localCol,
                 double price, bool status, int weight,
                 double gx, double gy, int sectorId) {
        Seat s;
        s.id = id; s.row = localRow; s.col = localCol;
        s.price = price; s.isAvailable = status; s.sectionWeight = weight;
        s.gx = gx; s.gy = gy; s.sectorId = sectorId;
        pendingSeats.push_back(s);
    }

    std::string suggestSeats(const std::string& type, int count) {
        recommender.loadVenueSeats(pendingSeats);
        recommender.setStrategy(type);
        auto ids = recommender.suggest(count);
        std::ostringstream oss;
        oss << "[";
        for (size_t i = 0; i < ids.size(); ++i) { if (i) oss << ","; oss << "\"" << ids[i] << "\""; }
        oss << "]";
        return oss.str();
    }
private:
    std::vector<Seat> pendingSeats;
};

EMSCRIPTEN_BINDINGS(seat_recommender) {
    emscripten::class_<WASMWrapper>("WASMWrapper")
        .constructor<>()
        .function("clearVenue",   &WASMWrapper::clearVenue)
        .function("addSeat",      &WASMWrapper::addSeat)
        .function("suggestSeats", &WASMWrapper::suggestSeats);
}
