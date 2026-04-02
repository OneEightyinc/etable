import React, { useState, useEffect } from "react";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";
import CategoryFilter from "../components/home/CategoryFilter";
import RestaurantCard from "../components/home/RestaurantCard";
import { restaurants } from "../data/restaurants";
import { getFavorites, addFavorite, removeFavorite } from "../lib/storage";

const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const favorites = getFavorites();
    setFavoriteIds(new Set(favorites.map((f) => f.restaurantId)));
  }, []);

  const handleFavoriteToggle = (id: string) => {
    if (favoriteIds.has(id)) {
      removeFavorite(id);
      const newFavorites = new Set(favoriteIds);
      newFavorites.delete(id);
      setFavoriteIds(newFavorites);
    } else {
      const restaurant = restaurants.find((r) => r.id === id);
      if (restaurant) {
        addFavorite({
          id: `fav_${id}`,
          restaurantId: id,
          restaurantName: restaurant.name,
        });
        const newFavorites = new Set(favoriteIds);
        newFavorites.add(id);
        setFavoriteIds(newFavorites);
      }
    }
  };

  const filteredRestaurants =
    selectedCategory === "すべて"
      ? restaurants
      : restaurants.filter((r) => r.category === selectedCategory);

  return (
    <>
      <AppHeader />
      <main className="flex-grow pt-16 pb-24">
        <div className="mx-auto w-full max-w-[393px] bg-white">
          <CategoryFilter value={selectedCategory} onChange={setSelectedCategory} />

          <div className="px-4 py-2">
            <h2 className="text-[14px] font-bold text-[#222] mb-4">
              近くの店舗 {filteredRestaurants.length}件
            </h2>
            <div className="space-y-3">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={{
                    id: restaurant.id,
                    name: restaurant.name,
                    category: restaurant.category,
                    imageUrl: restaurant.imageUrl,
                    rating: restaurant.rating,
                    distance: restaurant.distance,
                    waitingGroups: restaurant.waitingGroups,
                    shortestWaitMinutes: restaurant.shortestWaitMinutes,
                    approxWaitText: restaurant.approxWaitText,
                  }}
                  isFavorited={isClient && favoriteIds.has(restaurant.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
};

export default Home;
