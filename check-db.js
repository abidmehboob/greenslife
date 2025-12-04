const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = './database/flower_ecommerce.db';
console.log('=== Checking SQLite database ===');
console.log('Database path:', path.resolve(dbPath));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    return;
  }
  console.log('✓ Connected to database');
});

db.serialize(() => {
  // List all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err.message);
      return;
    }
    
    console.log('📁 Available tables:', tables.map(t => t.name).join(', '));
    
    if (tables.length === 0) {
      console.log('❌ No tables found - database might be empty');
      db.close();
      return;
    }
    
    const hasUsers = tables.some(t => t.name === 'users');
    const hasOrders = tables.some(t => t.name === 'orders');
    
    let queriesLeft = 0;
    
    if (hasUsers) {
      queriesLeft++;
      db.all('SELECT COUNT(*) as count, userType FROM users GROUP BY userType', (err, rows) => {
        if (err) {
          console.error('Users query error:', err.message);
        } else {
          console.log('👥 Users by type:');
          rows.forEach(row => console.log(`  ${row.userType}: ${row.count}`));
        }
        queriesLeft--;
        if (queriesLeft === 0) db.close();
      });
    } else {
      console.log('❌ No Users table found');
    }
    
    if (hasOrders) {
      queriesLeft += 2;
      
      db.all('SELECT COUNT(*) as count, status FROM orders GROUP BY status', (err, rows) => {
        if (err) {
          console.error('Orders status query error:', err.message);
        } else {
          console.log('📋 Orders by status:');
          rows.forEach(row => console.log(`  ${row.status}: ${row.count}`));
        }
        queriesLeft--;
        if (queriesLeft === 0) db.close();
      });
      
      db.get('SELECT SUM(totalAmount) as revenue FROM orders WHERE status IN ("completed", "delivered")', (err, row) => {
        if (err) {
          console.error('Revenue query error:', err.message);
        } else {
          console.log('💰 Total revenue: €' + (row.revenue || 0));
        }
        queriesLeft--;
        if (queriesLeft === 0) db.close();
      });
    } else {
      console.log('❌ No Orders table found');
      if (queriesLeft === 0) db.close();
    }
  });
});