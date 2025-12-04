const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const db = new sqlite3.Database('./database/flower_ecommerce.db');

console.log('=== Adding test orders for better statistics ===');

// Get existing user IDs
db.all('SELECT id, userType FROM users', (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
    return;
  }
  
  console.log('Found users:', users.map(u => `${u.userType}:${u.id.substr(0,8)}`));
  
  const wholesaler = users.find(u => u.userType === 'wholesaler');
  const florist = users.find(u => u.userType === 'florist');
  
  if (!wholesaler || !florist) {
    console.log('Missing users - need wholesaler and florist');
    db.close();
    return;
  }
  
  // Add orders to reach closer to target stats 
  const testOrders = [
    {
      id: crypto.randomUUID(),
      userId: wholesaler.id,
      orderNumber: 'ORD-' + Date.now() + '1',
      status: 'completed',
      items: JSON.stringify([{name:"Mixed Carnations",quantity:100,pricePerStem:0.75,total:75}]),
      subtotal: 75,
      shippingCost: 10,
      tax: 17,
      total: 102,
      currency: 'EUR',
      shippingAddress: JSON.stringify({name:"Wholesale Buyer",city:"Warsaw"}),
      paymentStatus: 'paid'
    },
    {
      id: crypto.randomUUID(),
      userId: florist.id,
      orderNumber: 'ORD-' + Date.now() + '2', 
      status: 'delivered',
      items: JSON.stringify([{name:"Premium Roses",quantity:50,pricePerStem:3.5,total:175}]),
      subtotal: 175,
      shippingCost: 15,
      tax: 38,
      total: 228,
      currency: 'EUR',
      shippingAddress: JSON.stringify({name:"Florist Shop",city:"Krakow"}),
      paymentStatus: 'paid'
    },
    {
      id: crypto.randomUUID(),
      userId: wholesaler.id,
      orderNumber: 'ORD-' + Date.now() + '3',
      status: 'shipped',
      items: JSON.stringify([{name:"Bulk Flowers",quantity:500,pricePerStem:1.2,total:600}]),
      subtotal: 600,
      shippingCost: 50,  
      tax: 130,
      total: 780,
      currency: 'EUR',
      shippingAddress: JSON.stringify({name:"Large Retailer",city:"Gdansk"}),
      paymentStatus: 'paid'
    }
  ];
  
  let inserted = 0;
  testOrders.forEach((order, index) => {
    const sql = `INSERT INTO orders (id, userId, orderNumber, status, items, subtotal, shippingCost, tax, total, currency, shippingAddress, paymentStatus, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;
    
    db.run(sql, [
      order.id, order.userId, order.orderNumber, order.status, order.items,
      order.subtotal, order.shippingCost, order.tax, order.total, order.currency,
      order.shippingAddress, order.paymentStatus
    ], (err) => {
      if (err) {
        console.error(`Error inserting order ${index + 1}:`, err.message);
      } else {
        console.log(`✓ Added ${order.status} order: €${order.total}`);
      }
      
      inserted++;
      if (inserted === testOrders.length) {
        // Check totals
        db.get('SELECT COUNT(*) as total, SUM(total) as revenue FROM orders', (err, result) => {
          if (err) {
            console.error('Error getting totals:', err.message);
          } else {
            console.log(`📊 Total orders: ${result.total}, Revenue: €${result.revenue}`);
          }
          db.close();
        });
      }
    });
  });
});