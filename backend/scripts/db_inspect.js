const pool = require('../config/database');
async function inspect() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log(JSON.stringify(res.rows, null, 2));

    const ordersCol = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders';");
    console.log('Orders Columns:', JSON.stringify(ordersCol.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
inspect();
