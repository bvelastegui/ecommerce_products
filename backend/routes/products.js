const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

//Crear product
router.post("/", async (req, res) => {
    try {
        const product = new Product(req.body);
        const productGuardado = await product.save();
        res.status(201).json(productGuardado);
    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear el product",
            error: error.message
        });
    }
});

//Listar products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find()
        res.json(products);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al listar los products",
            error: error.message
        });
    }
});

//Buscar product
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return res.status(404).json({
                mensaje: "Producto no encontardo"
            });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al buscar el product",
            error: error.message
        });
    }
});

//Actualizar product
router.put("/:id", async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        );
        if (!updatedProduct) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar el product",
            error: error.message
        });
    }
});

//Eliminar product
router.delete("/:id", async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }
        res.json({
            mensaje: "Producto eliminado correctamente."
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al eliminar el product",
            error: error.message
        });
    }
})

module.exports = router;