// verificar.js
const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'saludcasa'
});

client.connect();

// ⭐ BUSCAR PACIENTE SAN JOSÉ
client.query(`
    SELECT id, nombre, apellido_paterno, apellido_materno, 
           direccion, colonia, estatus 
    FROM pacientes 
    WHERE direccion ILIKE '%SAN JOSÉ%' 
       OR direccion ILIKE '%SAN JOSE%' 
       OR colonia ILIKE '%SANTA ROSA%' 
    LIMIT 20
`, (err, res) => {
    if (err) {
        console.error('❌ Error:', err.message);
    } else {
        console.log('📊 Resultados encontrados:', res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));
    }

    // ⭐ VER TODAS LAS DIRECCIONES (primeras 10)
    client.query('SELECT id, direccion FROM pacientes LIMIT 10', (err2, res2) => {
        if (!err2) {
            console.log('\n📊 Primeras 10 direcciones en BD:');
            res2.rows.forEach((r, i) => {
                console.log(`  ${i + 1}. ID:${r.id} -> ${r.direccion || 'SIN DIRECCIÓN'}`);
            });
        }
        client.end();
    });
});