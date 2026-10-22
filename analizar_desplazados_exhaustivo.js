const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:UdwGEEdTzRRlJGqiWwktfEiXqdSKWOAC@tokaido.proxy.rlwy.net:34138/railway',
  ssl: false
});

// Accurate coordinates for Leon colonias
const KNOWN_COLONIAS = {
  '10 DE MAYO': { lat: 21.0850, lng: -101.6150 },
  'SAN CARLOS': { lat: 21.0890, lng: -101.5790 },
  'VILLAS DE SAN JUAN': { lat: 21.0965, lng: -101.5850 },
  'CAMPESTRE DE JEREZ': { lat: 21.0950, lng: -101.6340 },
  'VALLE DE JEREZ': { lat: 21.0920, lng: -101.6350 },
  'JARDINES DE JEREZ': { lat: 21.0980, lng: -101.6380 },
  'SAN ISIDRO': { lat: 21.0980, lng: -101.6490 },
  'PARQUES DEL SUR': { lat: 21.0950, lng: -101.6450 },
  'PUNTA DEL ESTE': { lat: 21.1150, lng: -101.6140 },
  'PIAMONTE': { lat: 21.1100, lng: -101.6020 },
  'SAN PEDRO DE LOS HERNANDEZ': { lat: 21.1250, lng: -101.6350 },
  'LEON MODERNO': { lat: 21.1120, lng: -101.6705 },
  'SAN JUAN DE DIOS': { lat: 21.1180, lng: -101.6780 },
  'ZONA CENTRO': { lat: 21.1225, lng: -101.6820 },
  'SAN MIGUEL': { lat: 21.1090, lng: -101.6780 },
  'BELLAVISTA': { lat: 21.1180, lng: -101.6910 },
  'NUEVO SAN NICOLAS': { lat: 21.1050, lng: -101.6820 },
  'COECILLO': { lat: 21.1260, lng: -101.6660 },
  'COLONIA OBREGON': { lat: 21.1320, lng: -101.6880 },
  'BARRIO ARRIBA': { lat: 21.1320, lng: -101.6880 },
  'COLONIA MODERNA': { lat: 21.1300, lng: -101.6900 },
  'PEÑITAS': { lat: 21.1350, lng: -101.6920 },
  'LEON 1': { lat: 21.1436, lng: -101.6376 },
  'LEON 2': { lat: 21.1441, lng: -101.6730 },
  'VIBAR': { lat: 21.1380, lng: -101.7100 },
  'LAS MANDARINAS': { lat: 21.1000, lng: -101.6950 },
  'FLORES MAGON': { lat: 21.1120, lng: -101.7050 },
  'LA JOYA': { lat: 21.1480, lng: -101.7400 },
  'COLINAS DE LA FRAGUA': { lat: 21.1450, lng: -101.7500 },
  'JARDINES DEL MORAL': { lat: 21.1480, lng: -101.6850 },
  'VALLE DEL MORAL': { lat: 21.1590, lng: -101.6760 },
  'PANORAMA': { lat: 21.1560, lng: -101.6940 },
  'VALLE DEL CAMPESTRE': { lat: 21.1610, lng: -101.6930 },
  'CLUB CAMPESTRE': { lat: 21.1645, lng: -101.6900 },
  'VILLAS DEL CAMPESTRE': { lat: 21.1650, lng: -101.6950 },
  'CUMBRES DEL CAMPESTRE': { lat: 21.1730, lng: -101.7050 },
  'VALLE DE LEON': { lat: 21.1630, lng: -101.6740 },
  'REAL DE BUGAMBILIAS': { lat: 21.1600, lng: -101.6760 },
  'REAL DEL BOSQUE': { lat: 21.1680, lng: -101.6750 },
  'SAN JERONIMO': { lat: 21.1460, lng: -101.6850 },
  'VILLA INSURGENTES': { lat: 21.1420, lng: -101.6800 },
  'UNIDAD DEPORTIVA': { lat: 21.1480, lng: -101.6660 },
  'SAN JOSE DEL CONSUELO': { lat: 21.1558, lng: -101.6493 },
  'LOS NARANJOS': { lat: 21.1585, lng: -101.6385 },
  'LA SELVA': { lat: 21.1610, lng: -101.6455 },
  'SANTA CRUZ': { lat: 21.1630, lng: -101.6480 },
  '8 DE MARZO': { lat: 21.1560, lng: -101.6480 },
  'HACIENDA ECHEVESTE': { lat: 21.1785, lng: -101.6658 },
  'GRANJAS DE ECHEVESTE': { lat: 21.1865, lng: -101.6655 },
  'PEDREGALES DE ECHEVESTE': { lat: 21.1895, lng: -101.6688 },
  'VILLAS DE ECHEVESTE': { lat: 21.1830, lng: -101.6655 },
  'SAN FELIPE DE JESUS': { lat: 21.1430, lng: -101.6540 },
  'NUEVO LEON': { lat: 21.1480, lng: -101.6560 },
  'EL VALLADITO': { lat: 21.1550, lng: -101.6490 },
  'LAS PRESITAS': { lat: 21.1540, lng: -101.6480 },
  'REAL DE SAN ANTONIO': { lat: 21.1550, lng: -101.6500 },
  '11 DE JUNIO': { lat: 21.1550, lng: -101.6480 }
};

function distKm(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * 111.0;
  const dLng = (lng2 - lng1) * 103.0;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// Extract true intended colonia
function determineIntendedColonia(dir) {
  if (!dir) return null;
  const upper = dir.toUpperCase();

  // Special street overrides where street strongly identifies colonia
  if (upper.includes('5 DE FEBRERO') && (upper.includes('CENTRO') || upper.includes('SAN JUAN DE DIOS'))) {
    return upper.includes('SAN JUAN DE DIOS') ? 'SAN JUAN DE DIOS' : 'ZONA CENTRO';
  }
  if (upper.includes('MAPLE') && upper.includes('MORAL')) {
    return 'VALLE DEL MORAL';
  }
  if (upper.includes('FRAY DANIEL MIRELES')) {
    return 'COECILLO';
  }
  if (upper.includes('RICARDO PALMERIN') || upper.includes('WAGNER') || upper.includes('ESPAÑA') || upper.includes('SAN LUIS DE LA PAZ')) {
    if (upper.includes('LEON MODERNO')) return 'LEON MODERNO';
  }
  if (upper.includes('SELVA MORADA') || upper.includes('SELVA TROPICAL') || upper.includes('SELVA ROSA') || upper.includes('SELVA VERDE') || upper.includes('SELVA VIRGEN') || upper.includes('SELVA BRASILEÑA') || upper.includes('SELVA AFRICANA') || upper.includes('SELVA FLORIDA')) {
    return 'LA SELVA';
  }
  if (upper.includes('REAL DE SAN ANTONIO')) {
    return 'REAL DE SAN ANTONIO';
  }
  if (upper.includes('11 DE JUNIO')) {
    return '11 DE JUNIO';
  }
  if (upper.includes('8 DE MARZO')) {
    return '8 DE MARZO';
  }

  // Parse address parts
  const parts = dir.split('|')[0].split(',').map(s => s.trim().toUpperCase());
  // Find part that mentions colonia
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    for (const key of Object.keys(KNOWN_COLONIAS)) {
      if (p.includes(key)) {
        return key;
      }
    }
  }

  // Check full address string for any known colonia
  for (const key of Object.keys(KNOWN_COLONIAS)) {
    if (upper.includes(key)) {
      return key;
    }
  }

  return null;
}

async function run() {
  await client.connect();

  const res = await client.query(`
    SELECT p.id, p.id_enfermera, pe.nombre_completo, p.direccion, p.lat, p.lng
    FROM pacientes p
    LEFT JOIN personal_enfermeria pe ON pe.id = p.id_enfermera
    ORDER BY p.id_enfermera, p.id
  `);

  console.log(`Analizando ${res.rows.length} pacientes...`);

  const resultsByNurse = {};
  for (let i = 1; i <= 10; i++) resultsByNurse[i] = [];

  res.rows.forEach(p => {
    const intendedCol = determineIntendedColonia(p.direccion);
    if (!intendedCol) return;

    const targetCoords = KNOWN_COLONIAS[intendedCol];
    if (!targetCoords) return;

    const lat = parseFloat(p.lat);
    const lng = parseFloat(p.lng);
    const d = distKm(lat, lng, targetCoords.lat, targetCoords.lng);

    // If displaced more than 2.0 km from intended colonia center
    if (d > 2.0) {
      resultsByNurse[p.id_enfermera].push({
        id: p.id,
        nombre: p.nombre_completo,
        intendedCol,
        targetLat: targetCoords.lat,
        targetLng: targetCoords.lng,
        dist: d.toFixed(2),
        curLat: lat,
        curLng: lng,
        dir: p.direccion
      });
    }
  });

  let totalDisplaced = 0;
  for (let i = 1; i <= 10; i++) {
    const list = resultsByNurse[i];
    totalDisplaced += list.length;
    console.log(`\n======================================================`);
    console.log(`ENFERMERO ${i} (${list.length > 0 ? list[0].nombre : 'Sin desplazados'}): ${list.length} pacientes desplazados`);
    console.log(`======================================================`);
    list.forEach(item => {
      console.log(`ID ${item.id} -> Colonia: ${item.intendedCol} (Dist: ${item.dist} km) | Coords: (${item.curLat}, ${item.curLng})`);
      console.log(`   Direccion: ${item.dir}`);
    });
  }

  console.log(`\n\n>>>>>>>> TOTAL GENERAL REAL DE PACIENTES DESPLAZADOS: ${totalDisplaced} <<<<<<<<`);

  await client.end();
}

run().catch(console.error);
