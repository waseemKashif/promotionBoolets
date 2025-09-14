"use client";
import ProductCard from "@/components/shared/product/productCard";
import { Card, CardContent } from "@/components/ui/card";
import { getAllProducts } from "@/lib/actions/product";
import { fetchProductRecommendations } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import ProductCardLts from "@/components/shared/product/productCard-lts";
const CatalogPage = () => {
  const BASE_IMAGE_URL = "https://www.ansargallery.com/media/catalog/product/";

  // const allProducts = await getAllProducts();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["product-recommendations"],
    queryFn: fetchProductRecommendations,
    retry: 1,
  });
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading New Products...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading data</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 lg:p-10 ">
      {/* {allProducts.map((product) => (
        <ProductCard key={product.sku} product={product} />
      ))} */}

      {data.buywith.items.length > 0 ? (
        <div className="grid lg:grid-cols-4 xl:grid-cols-5 md:grid-cols-3 grid-cols-2  gap-4 ">
          {data.buywith.items.map((item) => (
            <ProductCardLts key={item.sku} product={item} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No buy with items found
        </p>
      )}
      {data.related.items.length > 0 ? (
        <div className="grid lg:grid-cols-4 xl:grid-cols-5 md:grid-cols-3 grid-cols-2  gap-4  mt-4">
          {data.related.items.map((item) => (
            <ProductCardLts key={item.sku} product={item} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No buy with items found
        </p>
      )}
    </div>
  );
};

export default CatalogPage;
