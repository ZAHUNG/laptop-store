// HTTP adapter cho sản phẩm: không chứa truy vấn MongoDB hay quy tắc nghiệp vụ.
import asyncHandler from "../utils/asyncHandler.js";
import * as productService from "../services/product.service.js";

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(product);
});

export const getProducts = asyncHandler(async (req, res) => {
  res.json(await productService.getProducts(req.query));
});

export const getProductDetail = asyncHandler(async (req, res) => {
  res.json(await productService.getProductDetail(req.params.slug));
});

export const updateProduct = asyncHandler(async (req, res) => {
  res.json(await productService.updateProduct(req.params.id, req.body));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.json({ message: "Product deleted (soft delete)" });
});
