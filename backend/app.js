const express = require("express");
const cors = require("cors")
require("dotenv").config();

const conectarDB = require("./config/db");

//const usuariosRoutes = require("./routes/usuarios.routes");
//const categoriasRoutes = require("./routes/categorias.routes");
const productosRoutes = require("./routes/productos.routes");
//const ventasRoutes = require("./routes/ventas.routes");
//const pagosRoutes = require("./routes/pagos.routes");

const app = express();

conectarDB();
app.use(cors());
app.use(express.json());

app.get("/", (req,res) =>{
    res.send("API Ecommerce funcionando correctamente")
});
app.use("/api/productos",productosRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT} `);
});

 

