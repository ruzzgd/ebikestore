import { getPool } from '../db/connection.js';
import { encrypt } from '../utils/encryption.js';

const isUnencrypted = (value) => {
  return value && typeof value === 'string' && !value.includes(':');
};

const backfill = async () => {
  const pool = getPool();
  try {
    console.log('Starting PII encryption backfill...');
    const [rows] = await pool.query('SELECT id, customer_name, contact_number, address, id_number, guardian_id_number FROM customer_applications');
    
    let updatedCount = 0;
    for (const row of rows) {
      let needsUpdate = false;
      const updates = {};
      
      if (isUnencrypted(row.customer_name)) {
        updates.customer_name = encrypt(row.customer_name);
        needsUpdate = true;
      }
      if (isUnencrypted(row.contact_number)) {
        updates.contact_number = encrypt(row.contact_number);
        needsUpdate = true;
      }
      if (isUnencrypted(row.address)) {
        updates.address = encrypt(row.address);
        needsUpdate = true;
      }
      if (isUnencrypted(row.id_number)) {
        updates.id_number = encrypt(row.id_number);
        needsUpdate = true;
      }
      if (isUnencrypted(row.guardian_id_number)) {
        updates.guardian_id_number = encrypt(row.guardian_id_number);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const setClauses = [];
        const params = [];
        for (const [key, value] of Object.entries(updates)) {
          setClauses.push(`${key} = ?`);
          params.push(value);
        }
        params.push(row.id);
        
        await pool.execute(
          `UPDATE customer_applications SET ${setClauses.join(', ')} WHERE id = ?`,
          params
        );
        updatedCount++;
      }
    }
    console.log(`Backfill complete. Updated ${updatedCount} records.`);
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    pool.end();
  }
};

backfill();
