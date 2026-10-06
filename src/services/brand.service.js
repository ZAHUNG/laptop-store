import slugify from "slugify";
import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

export const createBrand = async (payload) => {
  const { name, logo } = payload;
  if (!name || !name.trim()) {
    throw new AppError("Brand name is required", 400);
  }

  const slug = slugify(name, { lower: true, strict: true });
  const existedBrand = await Brand.findOne({
    $or: [{ name: { $regex: `^${name.trim()}$`, $options: "i" } }, { slug }],
  });

  if (existedBrand) {
    throw new AppError("Brand already exists", 400);
  }

  return Brand.create({
    name: name.trim(),
    slug,
    logo: logo || "",
  });
};

export const getBrands = async (query = {}) => {
  const { keyword, includeInactive } = query;
  const filter = {};

  if (!includeInactive || includeInactive === "false") {
    filter.isActive = true;
  }

  if (keyword) {
    filter.name = { $regex: keyword.trim(), $options: "i" };
  }

  return Brand.find(filter).sort({ createdAt: -1 });
};

export const getBrandDetail = async (idOrSlug) => {
  const filter = { isActive: true };
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    filter._id = idOrSlug;
  } else {
    filter.slug = idOrSlug;
  }

  const brand = await Brand.findOne(filter);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }
  return brand;
};

export const updateBrand = async (id, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Brand ID", 400);
  }

  const brand = await Brand.findById(id);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  const data = { ...updateData };
  if (data.name && data.name.trim() !== brand.name) {
    const newSlug = slugify(data.name, { lower: true, strict: true });
    const duplicate = await Brand.findOne({
      _id: { $ne: id },
      $or: [{ name: { $regex: `^${data.name.trim()}$`, $options: "i" } }, { slug: newSlug }],
    });

    if (duplicate) {
      throw new AppError("Brand name already exists", 400);
    }

    data.name = data.name.trim();
    data.slug = newSlug;
  }

  return Brand.findByIdAndUpdate(id, data, { new: true });
};

export const deleteBrand = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Brand ID", 400);
  }

  const brand = await Brand.findById(id);
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  const activeProductsCount = await Product.countDocuments({
    brand: id,
    isActive: true,
  });

  if (activeProductsCount > 0) {
    throw new AppError(
      `Cannot delete brand because it is linked to ${activeProductsCount} active product(s)`,
      400
    );
  }

  brand.isActive = false;
  await brand.save();
  return brand;
};
