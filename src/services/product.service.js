// Nghiệp vụ catalog sản phẩm: kiểm tra quan hệ, slug, tìm kiếm và CRUD.
import slugify from "slugify";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import AppError from "../utils/AppError.js";

const populatedProduct = (query) =>
  query.populate("category", "name slug").populate("brand", "name slug");

export const createProduct = async (payload) => {
  const { name, category, brand } = payload;
  const [categoryExists, brandExists] = await Promise.all([
    Category.findById(category),
    Brand.findById(brand),
  ]);
  if (!categoryExists) throw new AppError("Category not found", 400);
  if (!brandExists) throw new AppError("Brand not found", 400);
  return Product.create({ ...payload, slug: slugify(name, { lower: true, strict: true }) });
};

export const getProducts = async ({ keyword, brand, category, sort = "newest", page = 1, limit = 12 }) => {
  const filter = { isActive: true };
  if (keyword) filter.name = { $regex: keyword, $options: "i" };
  if (brand) filter.brand = brand;
  if (category) filter.category = category;

  const sortOption = sort === "price_asc" ? { price: 1 } : sort === "price_desc" ? { price: -1 } : { createdAt: -1 };
  const numericPage = Number(page);
  const numericLimit = Number(limit);
  const skip = (numericPage - 1) * numericLimit;
  const [products, total] = await Promise.all([
    populatedProduct(Product.find(filter).sort(sortOption).skip(skip).limit(numericLimit)),
    Product.countDocuments(filter),
  ]);

  return { data: products, pagination: { total, page: numericPage, limit: numericLimit, totalPages: Math.ceil(total / numericLimit) } };
};

export const getProductDetail = async (slug) => {
  const product = await populatedProduct(Product.findOne({ slug, isActive: true }));
  if (!product) throw new AppError("Product not found", 404);
  return product;
};

export const updateProduct = async (id, updateData) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  const data = { ...updateData };
  if (data.name) data.slug = slugify(data.name, { lower: true, strict: true });
  return populatedProduct(Product.findByIdAndUpdate(id, data, { new: true }));
};

export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);
  product.isActive = false;
  await product.save();
};
