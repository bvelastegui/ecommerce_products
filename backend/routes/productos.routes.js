const express = require("express");
const Producto = require("../models/Producto");

const router = express.Router();

//Crear producto
router.post("/", async (req, res) => {
    try {
        const nuevoProducto = new Producto(req.body);
        const productoGuardado = await nuevoProducto.save();
        res.status(201).json(productoGuardado);
    } catch (error) {
        res.status(400).json({
            mensaje: "Error al crear el producto",
            error: error.message
        });
    }
});

//Listar productos
router.get("/", async (req, res) => {
    try {
        const productos = await Producto.find()
        res.json(productos);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al listar los productos",
            error: error.message
        });
    }
});

//Buscar producto
router.get("/:id", async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id)
        if (!producto) {
            return res.status(404).json({
                mensaje: "Producto no encontardo"
            });
        }
        res.json(producto);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al buscar el producto",
            error: error.message
        });
    }
});

//Actualizar producto
router.put("/:id", async (req, res) => {
    try {
        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        );
        if (!productoActualizado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }
        res.json(productoActualizado);
    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar el producto",
            error: error.message
        });
    }
});

//Eliminar producto
router.delete("/:id", async (req, res) => {
    try {
        const productoEliminado = await Producto.findByIdAndDelete(
            req.params.id,
        );
        if (!productoEliminado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }
        res.json({
            mensaje: "Producto eliminado correctamente."
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al eliminar el producto",
            error: error.message
        });
    }
})

module.exports = router;