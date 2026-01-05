import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Enable SQL via WebSockets for pooling
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Tagged template literal for SQL queries.
 * Uses pooling for efficiency in server environments.
 */
const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    const query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
    const res = await pool.query(query, values);
    return res.rows as any;
};

// Also export raw pool just in case, and a helper for table names
(sql as any).pool = pool;
(sql as any).raw = (text: string, params?: any[]) => pool.query(text, params);

export default sql;
