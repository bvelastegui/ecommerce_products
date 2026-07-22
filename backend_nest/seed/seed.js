/**
 * Script de datos dummy para poblar el dashboard con información histórica.
 *
 * Inserta directamente en MongoDB (sin pasar por la API) para poder controlar
 * fechas de creación, stock consistente y relaciones entre colecciones.
 *
 * Uso: node seed/seed.js
 */
const mongoose = require('mongoose');
const { randomBytes, scryptSync } = require('crypto');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// ---------- Utilidades ----------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function weightedChoice(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [key, w] of entries) {
    if (roll < w) return key;
    roll -= w;
  }
  return entries[entries.length - 1][0];
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

const TAX_RATE = 0.15;
const DAYS_BACK = 365; // un año completo de historial
const NOW = new Date();

function daysAgo(days, hourJitter = true) {
  const date = new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
  if (hourJitter) {
    date.setHours(randomInt(8, 21), randomInt(0, 59), randomInt(0, 59), 0);
  }
  return date;
}

// ---------- Datos base ----------
const CATEGORIES = [
  { name: 'Laptops', description: 'Equipos portátiles para trabajo y estudio' },
  { name: 'Smartphones', description: 'Teléfonos inteligentes de última generación' },
  { name: 'Accesorios', description: 'Periféricos y accesorios de cómputo' },
  { name: 'Audio', description: 'Audífonos, parlantes y equipos de sonido' },
  { name: 'Gaming', description: 'Consolas y accesorios para videojuegos' },
  { name: 'Monitores', description: 'Pantallas y monitores para oficina y gaming' },
];

const PRODUCTS_BY_CATEGORY = {
  Laptops: [
    { name: 'Laptop Dell XPS 13', price: 1450 },
    { name: 'Laptop HP Pavilion 15', price: 890 },
    { name: 'Laptop Lenovo ThinkPad E14', price: 1050 },
    { name: 'Laptop Asus VivoBook 15', price: 780 },
    { name: 'MacBook Air M2', price: 1699 },
  ],
  Smartphones: [
    { name: 'iPhone 14', price: 999 },
    { name: 'Samsung Galaxy S23', price: 899 },
    { name: 'Xiaomi Redmi Note 12', price: 299 },
    { name: 'Motorola Edge 40', price: 449 },
    { name: 'Google Pixel 7', price: 599 },
  ],
  Accesorios: [
    { name: 'Mouse Logitech MX Master 3', price: 99 },
    { name: 'Teclado Mecánico Redragon K552', price: 55 },
    { name: 'Mochila para Laptop Targus', price: 65 },
    { name: 'Hub USB-C 7 en 1', price: 45 },
    { name: 'Cargador Rápido 65W', price: 35 },
  ],
  Audio: [
    { name: 'Audífonos Sony WH-1000XM5', price: 399 },
    { name: 'Parlante JBL Flip 6', price: 129 },
    { name: 'Audífonos Inalámbricos JBL Tune', price: 59 },
    { name: 'Barra de Sonido Samsung', price: 249 },
    { name: 'Micrófono USB Blue Yeti', price: 149 },
  ],
  Gaming: [
    { name: 'Consola PlayStation 5', price: 599 },
    { name: 'Control Xbox Series X', price: 69 },
    { name: 'Silla Gamer DXRacer', price: 349 },
    { name: 'Volante Logitech G29', price: 299 },
    { name: 'Auriculares Gamer HyperX Cloud II', price: 89 },
  ],
  Monitores: [
    { name: 'Monitor LG UltraGear 27"', price: 329 },
    { name: 'Monitor Samsung Odyssey 24"', price: 229 },
    { name: 'Monitor Dell 24" FHD', price: 179 },
    { name: 'Monitor ASUS ProArt 27"', price: 449 },
    { name: 'Soporte de Monitor Ajustable', price: 39 },
  ],
};

const ECUADOR_CITIES = ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta', 'Loja', 'Riobamba'];

const CLIENT_NAMES = [
  'María José Salazar', 'Carlos Andrade', 'Ana Lucía Torres', 'Diego Ramírez',
  'Fernanda Castillo', 'Luis Fernando Vega', 'Gabriela Ponce', 'Andrés Morales',
  'Paola Jiménez', 'Roberto Chávez', 'Valentina Ortiz', 'Xavier Guerrero',
  'Camila Rosero', 'Esteban Vallejo',
];

function streetName() {
  const streets = ['Av. Amazonas', 'Av. 10 de Agosto', 'Av. de los Shyris', 'Calle Bolívar',
    'Av. República del Salvador', 'Calle Sucre', 'Av. Los Granados', 'Calle Larga'];
  return `${randomChoice(streets)} N${randomInt(10, 45)}-${randomInt(10, 99)}`;
}

// ---------- Script principal ----------
async function seed() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`Conectado a ${MONGO_URI}`);

  console.log('Limpiando colecciones...');
  await Promise.all(
    ['categories', 'products', 'users', 'orders', 'payments'].map((name) =>
      db.collection(name).deleteMany({}),
    ),
  );

  // ---------- Categorías ----------
  const categoryDocs = CATEGORIES.map((cat) => ({
    _id: new mongoose.Types.ObjectId(),
    name: cat.name,
    slug: slugify(cat.name),
    description: cat.description,
    isActive: true,
    createdAt: daysAgo(DAYS_BACK + 10, false),
    updatedAt: daysAgo(DAYS_BACK + 10, false),
    __v: 0,
  }));
  await db.collection('categories').insertMany(categoryDocs);
  console.log(`✔ ${categoryDocs.length} categorías`);

  // ---------- Productos (en memoria, se insertan al final con el stock ya calculado) ----------
  const products = [];
  for (const category of categoryDocs) {
    const items = PRODUCTS_BY_CATEGORY[category.name];
    for (const item of items) {
      products.push({
        _id: new mongoose.Types.ObjectId(),
        name: item.name,
        slug: slugify(item.name),
        description: `${item.name} - producto original, garantía de 1 año`,
        basePrice: item.price,
        categoryId: category._id,
        stock: randomInt(150, 450), // baseline; se descuenta según ventas simuladas
        reservedStock: 0,
        images: [],
        isActive: true,
        createdAt: daysAgo(DAYS_BACK + randomInt(0, 10), false),
        updatedAt: daysAgo(DAYS_BACK + randomInt(0, 10), false),
        __v: 0,
      });
    }
  }

  // ---------- Usuarios ----------
  const users = [];

  // Admin (mismas credenciales que ya usas para entrar al panel)
  users.push({
    _id: new mongoose.Types.ObjectId(),
    name: 'Administrador',
    email: 'admin@example.com',
    password: hashPassword('admin123'),
    role: 'admin',
    addresses: [],
    createdAt: daysAgo(DAYS_BACK + 20, false),
    updatedAt: daysAgo(DAYS_BACK + 20, false),
    __v: 0,
  });

  for (const name of CLIENT_NAMES) {
    const addressCount = randomInt(1, 2);
    const addresses = Array.from({ length: addressCount }, (_, index) => ({
      _id: new mongoose.Types.ObjectId(),
      street: streetName(),
      city: randomChoice(ECUADOR_CITIES),
      zipCode: `${randomInt(10, 99)}${randomInt(100, 999)}`,
      isDefault: index === 0,
    }));

    const emailSlug = slugify(name).replace(/-/g, '.');
    users.push({
      _id: new mongoose.Types.ObjectId(),
      name,
      email: `${emailSlug}@mail.com`,
      password: hashPassword('cliente123'),
      role: 'client',
      addresses,
      createdAt: daysAgo(DAYS_BACK + randomInt(0, 15), false),
      updatedAt: daysAgo(DAYS_BACK + randomInt(0, 15), false),
      __v: 0,
    });
  }

  const clientUsers = users.filter((u) => u.role === 'client');

  // ---------- Órdenes + pagos (se generan en memoria para calcular stock final) ----------
  const orders = [];
  const payments = [];
  const soldByProduct = new Map(); // productId -> unidades vendidas (paid/sent/delivered)
  const reservedByProduct = new Map(); // productId -> unidades reservadas (pending)

  function buildOrderItems() {
    const itemCount = randomInt(1, 4);
    const chosenProducts = new Set();
    const items = [];
    while (items.length < itemCount) {
      const product = randomChoice(products);
      if (chosenProducts.has(product._id.toString())) continue;
      chosenProducts.add(product._id.toString());
      const quantity = randomInt(1, 3);
      items.push({
        _id: new mongoose.Types.ObjectId(),
        product: product._id,
        productName: product.name,
        quantity,
        priceAtPurchase: product.basePrice,
        __productRef: product,
      });
    }
    return items;
  }

  function createOrder(orderDate, status) {
    const user = randomChoice(clientUsers);
    const items = buildOrderItems();

    let subTotal = 0;
    for (const item of items) {
      subTotal += item.priceAtPurchase * item.quantity;
    }
    subTotal = roundMoney(subTotal);
    const tax = roundMoney(subTotal * TAX_RATE);
    const total = roundMoney(subTotal + tax);

    const address = user.addresses.length ? randomChoice(user.addresses) : null;

    const order = {
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      items: items.map(({ __productRef, ...item }) => item),
      shippingAddress: address
        ? { street: address.street, city: address.city, zipCode: address.zipCode }
        : undefined,
      subTotal,
      tax,
      total,
      status,
      // Las pendientes deben seguir "vigentes" al momento de revisar el dashboard,
      // sin importar qué tan antigua sea su fecha de creación simulada
      expiresAt:
        status === 'pending'
          ? new Date(NOW.getTime() + 15 * 60 * 1000)
          : new Date(orderDate.getTime() + 15 * 60 * 1000),
      createdAt: orderDate,
      updatedAt: orderDate,
      __v: 0,
    };

    // Contabilizamos el efecto en el stock según el estado final
    for (const item of items) {
      const key = item.product.toString();
      if (['paid', 'sent', 'delivered'].includes(status)) {
        soldByProduct.set(key, (soldByProduct.get(key) || 0) + item.quantity);
      } else if (status === 'pending') {
        reservedByProduct.set(key, (reservedByProduct.get(key) || 0) + item.quantity);
      }
      // canceled: no afecta el stock (la reserva ya se liberó)
    }

    // Pago asociado si la orden llegó a pagarse
    if (['paid', 'sent', 'delivered'].includes(status)) {
      const paidAt = new Date(orderDate.getTime() + randomInt(10, 180) * 60 * 1000);

      // ~15% de probabilidad de un intento fallido previo (realismo)
      if (Math.random() < 0.15) {
        payments.push({
          _id: new mongoose.Types.ObjectId(),
          order: order._id,
          amount: total,
          method: randomChoice(['cash', 'card', 'transfer']),
          status: 'failed',
          createdAt: new Date(paidAt.getTime() - randomInt(5, 30) * 60 * 1000),
          updatedAt: new Date(paidAt.getTime() - randomInt(5, 30) * 60 * 1000),
          __v: 0,
        });
      }

      payments.push({
        _id: new mongoose.Types.ObjectId(),
        order: order._id,
        amount: total,
        method: randomChoice(['cash', 'card', 'transfer']),
        status: 'completed',
        transactionId: `SIM-${paidAt.getTime()}-${randomInt(100000, 999999)}`,
        paidAt,
        createdAt: paidAt,
        updatedAt: paidAt,
        __v: 0,
      });
    } else if (status === 'canceled' && Math.random() < 0.3) {
      // Algunas canceladas tienen un intento de pago fallido que explica el abandono
      const attemptAt = new Date(orderDate.getTime() + randomInt(10, 120) * 60 * 1000);
      payments.push({
        _id: new mongoose.Types.ObjectId(),
        order: order._id,
        amount: total,
        method: randomChoice(['cash', 'card', 'transfer']),
        status: 'failed',
        createdAt: attemptAt,
        updatedAt: attemptAt,
        __v: 0,
      });
    }

    orders.push(order);
  }

  // Distribución de órdenes por día a lo largo de DAYS_BACK días
  for (let day = DAYS_BACK; day >= 1; day--) {
    const ordersToday = randomInt(1, 5);
    for (let i = 0; i < ordersToday; i++) {
      const orderDate = daysAgo(day);
      const ageDays = day;

      let status;
      if (ageDays > 7) {
        // Órdenes con más de una semana: ya deberían estar resueltas
        status = weightedChoice({ delivered: 70, canceled: 15, sent: 10, paid: 5 });
      } else {
        // Última semana: mezcla más variada, incluyendo pendientes de pago
        status = weightedChoice({
          pending: 25,
          sent: 25,
          paid: 25,
          delivered: 15,
          canceled: 10,
        });
      }
      createOrder(orderDate, status);
    }
  }

  // Órdenes del día de hoy (mezcla, incluyendo varias pendientes "en curso")
  const todayOrdersCount = randomInt(5, 9);
  for (let i = 0; i < todayOrdersCount; i++) {
    const hoursAgo = randomInt(1, 20);
    const orderDate = new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000);
    const status = weightedChoice({ pending: 45, paid: 25, sent: 20, canceled: 10 });
    createOrder(orderDate, status);
  }

  // Órdenes "recién creadas" pendientes de pago (para ver el flujo en vivo)
  for (let i = 0; i < 8; i++) {
    const orderDate = new Date(NOW.getTime() - randomInt(1, 10) * 60 * 1000);
    createOrder(orderDate, 'pending');
  }

  // ---------- Calculamos el stock final de cada producto ----------
  for (const product of products) {
    const key = product._id.toString();
    const sold = soldByProduct.get(key) || 0;
    const reserved = reservedByProduct.get(key) || 0;

    // Nos aseguramos de que el stock no quede negativo (ajustamos el baseline si hace falta)
    const minStock = sold + reserved + randomInt(5, 20);
    if (product.stock < minStock) product.stock = minStock;

    product.stock = product.stock - sold;
    product.reservedStock = reserved;
  }

  // ---------- Inserción final ----------
  await db.collection('products').insertMany(products);
  console.log(`✔ ${products.length} productos`);

  await db.collection('users').insertMany(users);
  console.log(`✔ ${users.length} usuarios (1 admin + ${clientUsers.length} clientes)`);

  await db.collection('orders').insertMany(orders);
  console.log(`✔ ${orders.length} órdenes (${DAYS_BACK} días de historial)`);

  await db.collection('payments').insertMany(payments);
  console.log(`✔ ${payments.length} pagos`);

  // ---------- Resumen ----------
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  console.log('\nResumen de órdenes por estado:', statusCounts);

  const monthCounts = orders.reduce((acc, o) => {
    const key = o.createdAt.toISOString().slice(0, 7);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log('Órdenes por mes:', monthCounts);

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  console.log(`Ingresos simulados (pagos completados): $${roundMoney(totalRevenue)}`);

  await mongoose.disconnect();
  console.log('\nListo. Login admin: admin@example.com / admin123');
}

seed().catch((err) => {
  console.error('Error en el seed:', err);
  process.exit(1);
});
