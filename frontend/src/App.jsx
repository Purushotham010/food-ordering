import React, { useState, useEffect } from 'react';

export default function App() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [toast, setToast] = useState('');

  // Checkout inputs
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    loadMenu();
    verifyHealth();
  }, []);

  const verifyHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      }
    } catch (err) {
      console.warn("MERN Backend initializing:", err);
    }
  };

  const loadMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      } else {
        throw new Error('Could not fetch menu');
      }
    } catch (err) {
      console.error(err);
      // Fallback items with INR pricing
      setMenu([
        {
          _id: '1',
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
          _id: '2',
          name: 'Wood-Fired Margherita D.O.P.',
          category: 'Pizza',
          price: 450.00,
          rating: 4.8,
          prepTime: '20-25 min',
          image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80',
          description: 'San Marzano tomato sauce, fresh buffalo mozzarella, hand-picked sweet basil, olive oil.',
          isVeg: true
        },
        {
          _id: '3',
          name: 'Tokyo Tonkotsu Ramen Bowl',
          category: 'Bowls',
          price: 420.00,
          rating: 4.9,
          prepTime: '15-20 min',
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
          description: 'Rich 12-hour pork broth, chashu pork belly, ajitsuke tamago egg, bamboo shoots.',
          isVeg: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openTracker = () => {
    loadOrders();
    setIsTrackerOpen(true);
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
    triggerToast(`Added ${item.name} to order!`);
  };

  const updateCartQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item._id === id) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const placeOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!name || !address || !phone) {
      alert("Please provide name, delivery address, and contact number.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerName: name,
        deliveryAddress: address,
        phone: phone,
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.qty })),
        totalAmount: parseFloat(cartSubtotal.toFixed(2))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedOrder = await res.json();
        triggerToast(`Order #${savedOrder._id.slice(-6)} placed in MongoDB!`);
        setCart([]);
        setName('');
        setAddress('');
        setPhone('');
        setIsCartOpen(false);
      } else {
        alert("Failed to submit food order.");
      }
    } catch (err) {
      alert("Order error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const advanceOrderStatus = async (orderId, currentStatus) => {
    const statuses = ['Order Placed', 'Kitchen Preparing', 'Out for Delivery', 'Delivered'];
    const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const newStatus = statuses[nextIdx];

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        triggerToast(`Order status updated to: ${newStatus}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['All', 'Burgers', 'Pizza', 'Bowls', 'Sides', 'Drinks'];
  const displayedItems = selectedCategory === 'All'
    ? menu
    : menu.filter(item => item.category === selectedCategory);

  return (
    <div className="app-wrapper">
      {/* Port Security & DevOps Bar */}
      <div className="devops-banner">
        <div className="port-badges">
          <div className="port-item">
            <span className="dot open"></span>
            <strong>Public Port:</strong> 80 (Nginx + React Frontend)
          </div>
          <div className="port-item">
            <span className="dot private"></span>
            <strong>Private Port:</strong> 5000 (Node/Express API Internal)
          </div>
          <div className="port-item">
            <span className="dot private"></span>
            <strong>Private Port:</strong> 27017 (MongoDB Data Internal)
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Status:</span>
          <span style={{ color: healthStatus ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
            {healthStatus ? '● MERN Containers Live' : '○ Waiting on Backend'}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="main-header">
        <div className="logo-group">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <div>
            <h1 className="logo-text">CRAVECLOUD</h1>
          </div>
        </div>

        <div className="header-tools">
          <button className="tool-button" onClick={() => setIsArchModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/>
              <line x1="6" y1="18" x2="6.01" y2="18"/>
            </svg>
            Public vs Private Ports
          </button>

          <button className="tool-button" onClick={openTracker}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Live Order Tracker
          </button>

          <button className="order-btn" onClick={() => setIsCartOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Your Order
            {cartTotalItems > 0 && <span className="counter-bubble">{cartTotalItems}</span>}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-food">
        <div className="hero-pill">Handcrafted Daily • Fresh to Your Door</div>
        <h2 className="hero-title-main">Gourmet Cravings Delivered Fresh.</h2>
        <p className="hero-subtext">
          Savor artisan brioche burgers, wood-fired Neapolitan pizzas, and slow-simmered noodle bowls crafted with fresh seasonal ingredients.
        </p>
      </section>

      {/* Categories */}
      <section className="category-nav">
        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c}
              className={`cat-tab ${selectedCategory === c ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {displayedItems.length} Signature Creations
        </div>
      </section>

      {/* Food Catalog Grid */}
      <main className="menu-grid">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            Retrieving gourmet menu from MongoDB container...
          </div>
        ) : (
          displayedItems.map((item) => (
            <article key={item._id} className="menu-card">
              <div className="card-media">
                <img src={item.image} alt={item.name} className="card-img" loading="lazy" />
                <span className="card-tag">{item.category}</span>
                <span className="card-rating-badge">★ {item.rating}</span>
                <span className={`diet-pill ${item.isVeg ? 'veg' : 'non-veg'}`}>
                  {item.isVeg ? '🌱 Vegetarian' : '🥩 Non-Veg'}
                </span>
              </div>
              <div className="card-content">
                <h3 className="item-name">{item.name}</h3>
                <p className="item-desc">{item.description}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '0.75rem' }}>
                  ⏱ Est. Prep: {item.prepTime || '15-20 min'}
                </div>
                <div className="item-bottom">
                  <span className="item-price">₹{Number(item.price).toLocaleString('en-IN')}</span>
                  <button className="btn-add-food" onClick={() => addToCart(item)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      {/* Cart & Delivery Modal */}
      {isCartOpen && (
        <div className="food-modal-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="food-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Your Food Delivery Bag</h3>
              <button className="btn-modal-close" onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)' }}>
                Your bag is empty! Add your favorite dish to order.
              </div>
            ) : (
              <>
                <div className="food-cart-items">
                  {cart.map((i) => (
                    <div key={i._id} className="food-cart-row">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{i.name}</div>
                        <div style={{ color: '#fb923c', fontSize: '0.85rem' }}>₹{Number(i.price).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="cart-qty-buttons">
                        <button className="qty-pill-btn" onClick={() => updateCartQuantity(i._id, -1)}>-</button>
                        <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{i.qty}</span>
                        <button className="qty-pill-btn" onClick={() => updateCartQuantity(i._id, 1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderTop: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Amount:</span>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fb923c' }}>
                    ₹{Number(cartSubtotal).toLocaleString('en-IN')}
                  </span>
                </div>

                <form className="delivery-form" onSubmit={placeOrder}>
                  <div>
                    <label className="field-label">Customer Name</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="e.g. Maya Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Delivery Address</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Contact Number</label>
                    <input
                      type="tel"
                      className="text-input"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-order-submit" disabled={submitting}>
                    {submitting ? 'Placing Order in MongoDB...' : `Confirm & Place Order (₹${Number(cartSubtotal).toLocaleString('en-IN')})`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Port Architecture & Security Modal */}
      {isArchModalOpen && (
        <div className="food-modal-backdrop" onClick={() => setIsArchModalOpen(false)}>
          <div className="food-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Port Analysis: Public vs Private Ports</h3>
              <button className="btn-modal-close" onClick={() => setIsArchModalOpen(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
              <strong>Network Security Architecture:</strong> Port 80 is the sole public ingress, while internal microservices and database ports are fully private.
            </p>

            <table className="security-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Container Port</th>
                  <th>Published Host Port</th>
                  <th>Classification</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>React Frontend + Nginx</strong></td>
                  <td>80</td>
                  <td><strong>80:80</strong></td>
                  <td><span className="tag-open">PUBLIC</span></td>
                </tr>
                <tr>
                  <td><strong>Express Backend</strong></td>
                  <td>5000</td>
                  <td><em>None (No mapping)</em></td>
                  <td><span className="tag-private">PRIVATE</span></td>
                </tr>
                <tr>
                  <td><strong>MongoDB Database</strong></td>
                  <td>27017</td>
                  <td><em>None (No mapping)</em></td>
                  <td><span className="tag-private">PRIVATE</span></td>
                </tr>
              </tbody>
            </table>

            <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '12px', padding: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
              <strong>Key Architectural Justifications:</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
                <li><strong>Public Port 80:</strong> External users and mobile browsers reach the app through standard HTTP. Nginx handles web routing and transparently delegates <code>/api</code> calls.</li>
                <li><strong>Private Port 5000:</strong> The Express application is only reachable by Nginx over the internal Docker network <code>food-net</code>. Direct public probing of the backend is prevented.</li>
                <li><strong>Private Port 27017:</strong> MongoDB has no host port bindings. This eliminates unauthorized database connection attempts.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Live Order Tracker Modal */}
      {isTrackerOpen && (
        <div className="food-modal-backdrop" onClick={() => setIsTrackerOpen(false)}>
          <div className="food-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>MongoDB Order Tracking System</h3>
              <button className="btn-modal-close" onClick={() => setIsTrackerOpen(false)}>✕</button>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                No active orders found in MongoDB. Place an order to see live tracking!
              </div>
            ) : (
              orders.map((ord) => {
                const getStatusClass = (st) => {
                  if (st === 'Order Placed') return 'status-placed';
                  if (st === 'Kitchen Preparing') return 'status-prep';
                  if (st === 'Out for Delivery') return 'status-delivery';
                  return 'status-delivered';
                };

                return (
                  <div key={ord._id} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong>Order #{ord._id.slice(-6)} — {ord.customerName}</strong>
                      <span className={`status-badge ${getStatusClass(ord.status)}`}>
                        {ord.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      📍 Address: {ord.deliveryAddress} • 📞 {ord.phone}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#fdba74', marginBottom: '0.6rem' }}>
                      Items: {ord.items.map(i => `${i.name} (x${i.quantity})`).join(', ')} • Total: ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                        Created: {new Date(ord.createdAt).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => advanceOrderStatus(ord._id, ord.status)}
                        style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Advance Status ➔
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="food-toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}

      {/* Footer */}
      <footer className="food-footer">
        CraveCloud Food Logistics Platform • Enterprise Containerized Food Delivery Architecture
      </footer>
    </div>
  );
}
