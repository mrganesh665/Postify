import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import ProductModel from "../models/productSchema.js";

const removeUploadedFile = (filename) => {
  const filePath = path.join(
    `${process.env.UPLOAD_DIRECTORY}/productimage`,
    filename
  );
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      throw new Error("Internal Server Error");
    }
  });
};

const addProduct = async (req, res) => {
  try {
    const { title, price, description } = req.body;
    const image = req.file.filename;
    const authorId = req.user._id.toString();

    if (!title || !price || !description || !image) {
      if (image) removeUploadedFile(image);
      return res
        .status(400)
        .json({ status: false, message: "All fields are required." });
    }

    if (isNaN(price) || Number(price) <= 0) {
      if (image) removeUploadedFile(image);
      return res
        .status(400)
        .json({
          status: false,
          message: "Price must be a valid number greater than 0.",
        });
    }

    const newProduct = await ProductModel({
      title,
      price,
      description,
      image,
      authorId,
      createdAt: new Date(),
    });

    const savedProduct = await newProduct.save();
    if (savedProduct) {
      return res
        .status(201)
        .json({ status: true, message: "Product created successfully" });
    } else {
      return res
        .status(500)
        .json({ status: false, message: "Something Went Wrong" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const removeProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const authorId = req.user._id.toString();
    const product = await ProductModel.findOne({ _id: productId, authorId });
    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    if (product.image) {
      removeUploadedFile(product.image);
    }
    const deletedProduct = await ProductModel.findByIdAndDelete(productId);
    if (deletedProduct) {
      return res
        .status(200)
        .json({ status: true, message: "Product Deleted Successfully" });
    } else {
      return res
        .status(500)
        .json({ status: false, message: "Something Went Wrong" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const editProduct = async (req, res) => {
  try {
    console.log("USER:", req.user);
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const { productId } = req.params;
    const authorId = req.user._id.toString();
    const { title, price, description } = req.body;

    let updatedData = {};
    if (title) updatedData.title = title;
    if (price !== undefined) updatedData.price = Number(price);
    if (description) updatedData.description = description;

    const product = await ProductModel.findOne({
      _id: productId,
      authorId,
    });

    if (!product) {
      if (req.file?.filename) {
        removeUploadedFile(req.file.filename);
      }
      return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }

    if (req.file?.filename) {
      updatedData.image = req.file.filename;
    }

    const updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: productId, authorId },
      updatedData,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(500).json({
        status: false,
        message: "Update failed",
      });
    }

    if (req.file?.filename && product.image) {
      removeUploadedFile(product.image);
    }

    return res.status(200).json({
      status: true,
      message: "Product Updated Successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("EDIT PRODUCT ERROR:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

const getAllProduct = async (req, res) => {
  try {
    const { limit, sort } = req.query;
    const authorId = req.user._id.toString();

    let productsQuery = ProductModel.find({ authorId });

    if (sort === "createdAt") {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }

    const products = await productsQuery;
    return res.status(200).json({ status: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await ProductModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(productId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $project: {
          _id: 1,
          title: 1,
          image: 1,
          price: 1,
          description: 1,
          authorName: "$author.fullName",
          authorEmail: "$author.email",
          createdAt: 1,
          __v: 1,
        },
      },
    ]);

    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }
    return res
      .status(200)
      .json({
        status: true,
        message: "Data Fetched Successfully",
        product: product[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

export {
  addProduct,
  removeProduct,
  editProduct,
  getAllProduct,
  getSingleProduct,
};
