import slugify from "slugify";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

export const createCategory = async (payload) => {
  const { name, image } = payload;
  if (!name || !name.trim()) {
    throw new AppError("Category name is required", 400);
  }

  const slug = slugify(name, { lower: true, strict: true });
  const existedCategory = await Category.findOne({
    $or: [{ name: { $regex: `^${name.trim()}$`, $options: "i" } }, { slug }],
  });

  if (existedCategory) {
    throw new AppError("Category already exists", 400);
  }

  return Category.create({
    name: name.trim(),
    slug,
    image: image || "",
  });
};

export const getCategories = async (query = {}) => {
  const { keyword, includeInactive } = query;
  const filter = {};

  if (!includeInactive || includeInactive === "false") {
    filter.isActive = true;
  }

  if (keyword) {
    filter.name = { $regex: keyword.trim(), $options: "i" };
  }

  return Category.find(filter).sort({ createdAt: -1 });
};

export const getCategoryDetail = async (idOrSlug) => {
  const filter = { isActive: true };
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    filter._id = idOrSlug;
  } else {
    filter.slug = idOrSlug;
  }

  const category = await Category.findOne(filter);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

export const updateCategory = async (id, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Category ID", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const data = { ...updateData };
  if (data.name && data.name.trim() !== category.name) {
    const newSlug = slugify(data.name, { lower: true, strict: true });
    const duplicate = await Category.findOne({
      _id: { $ne: id },
      $or: [{ name: { $regex: `^${data.name.trim()}$`, $options: "i" } }, { slug: newSlug }],
    });

    if (duplicate) {
      throw new AppError("Category name already exists", 400);
    }

    data.name = data.name.trim();
    data.slug = newSlug;
  }

  return Category.findByIdAndUpdate(id, data, { new: true });
};

export const deleteCategory = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Category ID", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const activeProductsCount = await Product.countDocuments({
    category: id,
    isActive: true,
  });

  if (activeProductsCount > 0) {
    throw new AppError(
      `Cannot delete category because it is linked to ${activeProductsCount} active product(s)`,
      400
    );
  }

  category.isActive = false;
  await category.save();
  return category;
};
