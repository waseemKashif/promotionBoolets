"use client";
import AddToCart from "@/components/shared/product/add-to-cart";
import ProductImageLTS from "@/components/shared/product/product-image-lts";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";
import { CircleCheckBig } from "lucide-react";
import { useProductStore } from "@/store/useProductStore";
import { notFound } from "next/navigation";
import RelatedBroughtTogether from "@/components/related-brought-together";
import { fetchProductRecommendations } from "@/lib/api";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { Product } from "@/types";
import Link from "next/link";
import axios from "axios";

// Function to fetch product by slug
const fetchProductBySlug = async (slug: string): Promise<Product> => {
  const response = await axios.get(
    `https://www.ansargallery.com/en/rest/V1/products/${slug}`
  );
  return response.data;
};

export default function ProductDetailsPage() {
  const params = useParams();
  const { selectedProduct, setSelectedProduct } = useProductStore();

  // Extract SKU from slug
  const slugParam = params?.slug;
  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam) && slugParam.length > 0
      ? slugParam[0]
      : undefined;

  const sku = slug ? slug.split("-").pop() : undefined;

  console.log("Slug:", slug, "SKU:", sku);

  // Query for product recommendations
  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = useQuery({
    queryKey: ["product-recommendations"],
    queryFn: fetchProductRecommendations,
    retry: 1,
  });

  // Query for product details - only fetch if not in store
  const {
    data: fetchedProduct,
    isLoading: isLoadingProduct,
    error: productError,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug && !selectedProduct, // Only fetch if we have a slug and no product in store
    retry: 1,
  });

  // Determine which product to use
  const product = selectedProduct || fetchedProduct;

  // Update store when product is fetched from API
  useEffect(() => {
    if (fetchedProduct && !selectedProduct) {
      setSelectedProduct(fetchedProduct);
    }
  }, [fetchedProduct, selectedProduct, setSelectedProduct]);

  // Loading state
  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-blue-600 mb-4">Loading product...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (productError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading product</p>
              <p className="text-sm text-gray-600 mb-4">
                {productError.message || "Failed to fetch product"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return notFound();
  }

  console.log("Product being displayed:", product);

  const dropdownTotalStock = product?.extension_attributes.ah_is_in_stock == 1;
  const totalStock = product?.extension_attributes.ah_max_qty;

  return (
    <section className="p-4 lg:p-10 mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-y-4">
        {/* images column 2 of 5 columns */}
        <div className="lg:col-span-2">
          <ProductImageLTS
            images={product.media_gallery_entries
              .filter((attr) => typeof attr.file === "string")
              .map((attr) => attr.file as string)}
          />
        </div>
        <div className="lg:col-span-2 p-5">
          {/* details of product */}
          <div className="flex flex-col gap-4">
            <h1 className="h3-bold text-3xl line-clamp-2 overflow-ellipsis">
              {product.name}
            </h1>
            <div>
              Brand:{" "}
              <Badge
                asChild
                variant="outline"
                className=" px-2 py-1 text-base capitalize"
              >
                <Link href={`/brands/linked-brand`}>Not Found</Link>
              </Badge>{" "}
              <span aria-readonly hidden>
                {product.extension_attributes.category_links[0]?.category_id ||
                  "Not Found"}
              </span>
            </div>
            <p>⭐⭐⭐⭐ No Reviews</p>
            <span className=" text-gray-500">SKU {product.sku}</span>
            <div>
              <span>QAR</span>
              <span className="text-2xl font-semibold">
                {typeof product.price === "number"
                  ? product.price.toFixed(2)
                  : Number(product.price).toFixed(2) || "0.00"}
              </span>
            </div>
            <div className=" flex gap-2">
              <span>shipping charges</span>
              <span className=" text-green-700 text-base font-semibold">
                free Delivery
              </span>
            </div>
            <h3>Description: Not Found</h3>
          </div>
        </div>
        <div className=" md:col-span-2 lg:col-span-1">
          <Card className="bg-[#fafafa] w-full max-w-[600px] p-4">
            <CardContent className="flex flex-col gap-y-4 p-0">
              <div className=" flex justify-between items-baseline">
                <div className=" text-gray-500">Price</div>
                <div>
                  <span className=" text-gray-500 pr-2">QAR</span>
                  <span className=" font-semibold text-2xl">
                    {typeof product.price === "number"
                      ? product.price.toFixed(2)
                      : Number(product.price).toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
              {dropdownTotalStock ? (
                <div className=" flex justify-between items-baseline">
                  <div className=" text-gray-500">Availablity</div>
                  <span className=" text-green-700 font-semibold">
                    In Stock
                  </span>
                </div>
              ) : (
                <div className=" flex justify-between items-baseline">
                  <div className=" text-gray-500">Stock</div>
                  <span className=" text-red-600">Out Of Stock</span>
                </div>
              )}
              <div className=" flex justify-between items-baseline">
                <span className=" text-gray-500">Quantity</span>
                <Select>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="1" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalStock ?? 0 }, (_, index) => (
                      <SelectItem value={(index + 1).toString()} key={index}>
                        {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {dropdownTotalStock && (
                <div className=" flex-center">
                  <AddToCart
                    productId={product.sku}
                    productName={product.name}
                  />
                </div>
              )}
              <div className=" flex justify-between items-baseline capitalize">
                <span className=" text-gray-500">delivery</span>
                <div className=" flex items-end flex-col  text-green-700">
                  <span className="  font-semibold">Tomorrow 5 September</span>{" "}
                  <span>Free delivery</span>
                </div>
              </div>
              <div className="text-gray-500 flex justify-between items-baseline">
                <span>Payment</span>
                <span className=" text-blue-600">Secure transaction</span>
              </div>
              <div className=" text-gray-500 flex justify-between items-baseline">
                <span>Returns</span>
                <span className=" text-blue-600 flex items-center">
                  <CircleCheckBig className="w-5 h-5" /> Free Returns
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related products */}
      {isLoadingRecommendations ? (
        <div className="flex items-center justify-center min-h-32">
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      ) : recommendationsError ? (
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading recommendations</p>
            <button
              onClick={() => refetchRecommendations()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      ) : !recommendationsData ? (
        <div className="flex items-center justify-center min-h-32">
          <p className="text-gray-600">No recommendations available</p>
        </div>
      ) : (
        <div className="lg:mx-4 ">
          <div>
            <h2 className=" font-semibold text-base md:text-2xl my-4 ">
              Brought Together By {product.name}
            </h2>
            {recommendationsData.buywith.items.length > 0 ? (
              <RelatedBroughtTogether
                productList={recommendationsData.buywith.items}
              />
            ) : (
              <p>No related items found</p>
            )}
          </div>
          <div>
            <h2 className=" font-semibold text-base md:text-2xl my-4 ">
              Related Products
            </h2>
            {recommendationsData.related.items.length > 0 ? (
              <RelatedBroughtTogether
                productList={recommendationsData.related.items}
              />
            ) : (
              <p>No related items found</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
