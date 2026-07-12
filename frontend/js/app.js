const API_URL = "http://localhost:3000/api/productos";

const formProducto = document.getElementById("formProducto");
const tablaProductos = document.getElementById("tablaProductos");
const btnCancelar = document.getElementById("btnCancelar");

const productoId = document.getElementById("productoId");
const titulo = document.getElementById("titulo");
const descripcion = document.getElementById("descripcion");
const precio = document.getElementById("precio");
const stock = document.getElementById("stock");
const categoria = document.getElementById("categoria");

// Listar productos
async function listarProductos() {
  const respuesta = await fetch(API_URL);
  const productos = await respuesta.json();

  tablaProductos.innerHTML = "";

  productos.forEach(producto => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${producto.titulo}</td>
      <td>${producto.descripcion}</td>
      <td>${producto.precio}</td>
      <td>${producto.stock}</td>
      <td>${producto.categoria}</td>
      <td>
        <button class="btn-editar" onclick="editarProducto('${producto._id}')">Editar</button>
        <button class="btn-eliminar" onclick="eliminarProducto('${producto._id}')">Eliminar</button>
      </td>
    `;

    tablaProductos.appendChild(fila);
  });
}

// Guardar o actualizar producto
formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const producto = {
    titulo: titulo.value,
    descripcion: descripcion.value,
    precio: Number(precio.value),
    stock: Number(stock.value),
    categoria: categoria.value
  };

  if (productoId.value === "") {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(producto)
    });
  } else {
    await fetch(`${API_URL}/${productoId.value}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(producto)
    });
  }

  limpiarFormulario();
  listarProductos();
});

// Cargar datos para editar
async function editarProducto(id) {
  const respuesta = await fetch(`${API_URL}/${id}`);
  const producto = await respuesta.json();

  productoId.value = producto._id;
  titulo.value = producto.titulo;
  descripcion.value = producto.descripcion;
  precio.value = producto.precio;
  stock.value = producto.stock;
  categoria.value = producto.categoria;
}

// Eliminar producto
async function eliminarProducto(id) {
  const confirmar = confirm("¿Está seguro de eliminar este producto?");

  if (confirmar) {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    listarProductos();
  }
}

// Limpiar formulario
function limpiarFormulario() {
  productoId.value = "";
  titulo.value = "";
  descripcion.value = "";
  precio.value = "";
  stock.value = "";
  categoria.value = "";
}

btnCancelar.addEventListener("click", limpiarFormulario);

listarProductos();
