const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/food_delivery_db';

app.use(cors());
app.use(express.json());

// ==========================================
// Mongoose Models & Schemas
// ==========================================
const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 4.8 },
  prepTime: { type: String, default: '20-25 min' },
  image: { type: String, required: true },
  description: { type: String, required: true },
  isVeg: { type: Boolean, default: false }
});

const OrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const OrderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  phone: { type: String, required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Order Placed', 'Kitchen Preparing', 'Out for Delivery', 'Delivered'],
    default: 'Order Placed'
  },
  createdAt: { type: Date, default: Date.now }
});

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
const Order = mongoose.model('Order', OrderSchema);

// ==========================================
// Database Seeder (INR Pricing)
// ==========================================
async function seedMenu() {
  try {
    const sampleItems = [
      {
        name: 'Truffle Angus Gourmet Burger',
        category: 'Burgers',
        price: 399.00,
        rating: 4.9,
        prepTime: '15-20 min',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        description: 'Aged prime black angus patty, black truffle aioli, melted aged gouda, brioche bun.',
        isVeg: false
      },
      {
        name: 'Wood-Fired Margherita D.O.P.',
        category: 'Pizza',
        price: 450.00,
        rating: 4.8,
        prepTime: '20-25 min',
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80',
        description: 'San Marzano tomato sauce, fresh buffalo mozzarella, hand-picked sweet basil, extra virgin olive oil.',
        isVeg: true
      },
      {
        name: 'Tokyo Tonkotsu Ramen Bowl',
        category: 'Bowls',
        price: 420.00,
        rating: 4.9,
        prepTime: '15-20 min',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
        description: 'Rich 12-hour pork broth, chashu pork belly, marinated ajitsuke tamago egg, menma bamboo shoots.',
        isVeg: false
      },
      {
        name: 'Crispy Korean Gochujang Wings',
        category: 'Sides',
        price: 320.00,
        rating: 4.7,
        prepTime: '12-18 min',
        image: 'https://images.unsplash.com/photo-1527477378378-080c55047805?w=600&auto=format&fit=crop&q=80',
        description: 'Double-fried crispy wings glazed with sweet & spicy fermented chili sauce, toasted sesame seeds.',
        isVeg: false
      },
      {
        name: 'Avocado Green Goddess Crunch Bowl',
        category: 'Bowls',
        price: 299.00,
        rating: 4.8,
        prepTime: '10-15 min',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
        description: 'Organic rainbow quinoa, ripe avocado, edamame, cucumber ribbons, herb tahini green dressing.',
        isVeg: true
      },
      {
        name: 'Smoked Jalapeno Cheese Fries',
        category: 'Sides',
        price: 199.00,
        rating: 4.6,
        prepTime: '10-12 min',
        image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80',
        description: 'Hand-cut russet fries smothered in house sharp cheddar cheese sauce and pickled jalapenos.',
        isVeg: true
      },
      {
        name: 'Salted Caramel Bourbon Shake',
        category: 'Drinks',
        price: 180.00,
        rating: 4.9,
        prepTime: '5-8 min',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
        description: 'Rich Madagascar vanilla bean custard blended with salted dark caramel and whipped cream.',
        isVeg: true
      },
      {
        name: 'Matcha Iced Coconut Latte',
        category: 'Drinks',
        price: 150.00,
        rating: 4.7,
        prepTime: '5 min',
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
        description: 'Ceremonial grade Uji matcha whisked over chilled coconut cream and agave nectar.',
        isVeg: true
      }
    ];

    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log('Seeding initial food menu into MongoDB with INR pricing...');
      await MenuItem.insertMany(sampleItems);
      console.log('Successfully seeded 8 signature food items.');
    } else {
      // Update existing items to INR pricing
      for (const item of sampleItems) {
        await MenuItem.updateOne({ name: item.name }, { $set: { price: item.price } });
      }
      console.log('Updated existing MongoDB menu items to INR pricing.');
    }
  } catch (err) {
    console.error('Error during menu seeding:', err.message);
  }
}

// ==========================================
// Connect to MongoDB with retry logic
// ==========================================
function connectWithRetry(retries = 15, delay = 2500) {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully!');
      seedMenu();
    })
    .catch((err) => {
      console.error(`MongoDB connection error (${err.message}). Retrying in ${delay}ms...`);
      if (retries > 0) {
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error('Exhausted all retries for MongoDB.');
      }
    });
}

connectWithRetry();

// ==========================================
// API Routes
// ==========================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'food-delivery-backend',
    currency: 'INR (₹)',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    mongoUri: MONGO_URI.replace(/\/\/[^@]*@/, '//***:***@'),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Port Architecture info endpoint
app.get('/api/architecture', (req, res) => {
  res.json({
    project: 'Food Ordering Cloud Architecture',
    stack: 'MERN Stack (MongoDB, Express, React, Node.js)',
    port_analysis: {
      public_ports: [
        {
          port: 80,
          service: 'Frontend (Nginx + React)',
          description: 'The sole public port open to the internet. Serves the web app and reverse-proxies /api requests.'
        }
      ],
      private_ports: [
        {
          port: 5000,
          service: 'Backend (Node.js / Express)',
          description: 'Accessible strictly within the Docker bridge network. NOT published to host port.'
        },
        {
          port: 27017,
          service: 'Database (MongoDB)',
          description: 'Accessible strictly by backend container via service name mongo:27017. NOT exposed publicly.'
        }
      ]
    }
  });
});

// Get Menu Items
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve menu items: ' + err.message });
  }
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, deliveryAddress, phone, items, totalAmount } = req.body;
    if (!customerName || !deliveryAddress || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required order details' });
    }

    const newOrder = new Order({
      customerName,
      deliveryAddress,
      phone,
      items,
      totalAmount,
      status: 'Order Placed',
      createdAt: new Date()
    });

    const savedOrder = await newOrder.save();
    console.log(`New order created in MongoDB: #${savedOrder._id} for ${customerName}`);
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order: ' + err.message });
  }
});

// Get Order History
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders: ' + err.message });
  }
});

// Update Order Status (for tracking simulator)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status: ' + err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Food Ordering Backend running on port ${PORT}`);
});
