import asyncHandler from "../utils/asyncHandler.js";
import * as brandService from "../services/brand.service.js";

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.createBrand(req.body);
  res.status(201).json(brand);
});

export const getBrands = asyncHandler(async (req, res) => {
  const brands = await brandService.getBrands(req.query);
  res.json({ data: brands });
});

export const getBrandDetail = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandDetail(req.params.idOrSlug);
  res.json(brand);
});

export const updateBrand = asyncHandler(async (req, res) => {
  const updatedBrand = await brandService.updateBrand(req.params.id, req.body);
  res.json(updatedBrand);
});

export const deleteBrand = asyncHandler(async (req, res) => {
  await brandService.deleteBrand(req.params.id);
  res.json({ message: "Brand deleted successfully (soft delete)" });
});
