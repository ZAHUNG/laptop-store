import Product from "../models/Product.js";
import slugify from "slugify";

export const createProduct =
  async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        brand,
        price,
        originalPrice,
        stock,
        thumbnail,
        images,
        specifications,
      } = req.body;

      const categoryExists =
        await Category.findById(category);

        if (!categoryExists) {
        return res.status(400).json({
            message: "Category not found",
        });
        }

        const brandExists =
        await Brand.findById(brand);

        if (!brandExists) {
        return res.status(400).json({
            message: "Brand not found",
        });
        }

      const product =
        await Product.create({
          name,
          slug: slugify(name, {
            lower: true,
            strict: true,
          }),
          description,
          category,
          brand,
          price,
          originalPrice,
          stock,
          thumbnail,
          images,
          specifications,
        });

      res.status(201).json(
        product
      );
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

export const getProducts = async (req, res) => {
  try {
    const {
      keyword,
      brand,
      category,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    // 1. FILTER
    const filter = {
      isActive: true,
    };

    // search theo tên
    if (keyword) {
      filter.name = {
        $regex: keyword,
        $options: "i",
      };
    }

    // filter brand
    if (brand) {
      filter.brand = brand;
    }

    // filter category
    if (category) {
      filter.category = category;
    }

    // 2. SORT
    let sortOption = {};

    switch (sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
    }

    // 3. PAGINATION
    const skip = (page - 1) * limit; 

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    // 4. TOTAL COUNT (quan trọng cho frontend)
    const total = await Product.countDocuments(filter);

    res.json({
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getProductDetail =
  async (req, res) => {
    try {
      const product =
        await Product.findOne({
          slug: req.params.slug,
          isActive: true,
        })
          .populate(
            "category",
            "name slug"
          )
          .populate(
            "brand",
            "name slug"
          );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const updateData = req.body;

    // nếu đổi name thì update slug
    if (updateData.name) {
      updateData.slug = slugify(updateData.name, {
        lower: true,
        strict: true,
      });
    }

    const updatedProduct =
      await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
        .populate("category", "name slug")
        .populate("brand", "name slug");

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
  };

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    product.isActive = false;
    await product.save();

    res.json({
      message: "Product deleted (soft delete)",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
  };