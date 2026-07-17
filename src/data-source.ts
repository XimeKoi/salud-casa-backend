import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();


const DEFAULT_VALUES = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'saludcasa',
};

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || DEFAULT_VALUES.host,
    port: parseInt(process.env.DB_PORT || String(DEFAULT_VALUES.port)),
    username: process.env.DB_USER || DEFAULT_VALUES.user,
    password: process.env.DB_PASSWORD || DEFAULT_VALUES.password,
    database: process.env.DB_NAME || DEFAULT_VALUES.database,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});