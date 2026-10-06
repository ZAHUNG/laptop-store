import asyncHandler from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(category);
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories(req.query);
  res.json({ data: categories });
});

export const getCategoryDetail = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryDetail(req.params.idOrSlug);
  res.json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updatedCategory = await categoryService.updateCategory(req.params.id, req.body);
  res.json(updatedCategory);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.json({ message: "Category deleted successfully (soft delete)" });
});
