const express = require("express");
const cors = require("cors")
require("dotenv").config();

const connectDB = require("./config/db");

//const usuariosRoutes = require("./routes/usuarios.routes");
//const categoriasRoutes = require("./routes/categorias.routes");
//const ventasRoutes = require("./routes/ventas.routes");
//const pagosRoutes = require("./routes/pagos.routes");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
    res.json({
        message: "API Ecommerce funcionando correctamente"
    })
});

app.use("/api/products", require("./routes/products"));

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} `);
    });
});

 

