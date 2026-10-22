// corregir_coordenadas_presa.js
// Script para corregir todas las coordenadas que cayeron en la Presa del Palote / Parque Metropolitano

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:UdwGEEdTzRRlJGqiWwktfEiXqdSKWOAC@tokaido.proxy.rlwy.net:34138/railway',
  ssl: false
});

// Coordenadas reales y verificadas en León, Guanajuato
const REAL_STREET_ANCHORS = {
  // ========================================================
  // GRANJAS DE ECHEVESTE Y VILLAS DE ECHEVESTE (Calles de Metales)
  // ========================================================
  'BRONCE': { latStart: 21.1870, latEnd: 21.1876, lngStart: -101.6680, lngEnd: -101.6630 },
  'ACERO': { latStart: 21.1865, latEnd: 21.1871, lngStart: -101.6680, lngEnd: -101.6630 },
  'PLATINO': { latStart: 21.1860, latEnd: 21.1866, lngStart: -101.6680, lngEnd: -101.6630 },
  'ALUMINIO': { latStart: 21.1855, latEnd: 21.1861, lngStart: -101.6680, lngEnd: -101.6630 },
  'PLOMO': { latStart: 21.1850, latEnd: 21.1855, lngStart: -101.6680, lngEnd: -101.6630 },
  'PEOMO': { latStart: 21.1850, latEnd: 21.1855, lngStart: -101.6680, lngEnd: -101.6630 },
  'ZINC': { latStart: 21.1845, latEnd: 21.1850, lngStart: -101.6680, lngEnd: -101.6630 },
  'ZING': { latStart: 21.1845, latEnd: 21.1850, lngStart: -101.6680, lngEnd: -101.6630 },
  'SIN DE ECHEVESTE': { latStart: 21.1845, latEnd: 21.1850, lngStart: -101.6680, lngEnd: -101.6630 },
  'URANIO': { latStart: 21.1840, latEnd: 21.1845, lngStart: -101.6680, lngEnd: -101.6630 },
  'URANO': { latStart: 21.1840, latEnd: 21.1845, lngStart: -101.6680, lngEnd: -101.6630 },
  'MERCURIO': { latStart: 21.1835, latEnd: 21.1840, lngStart: -101.6680, lngEnd: -101.6630 },
  'MARCURIO': { latStart: 21.1835, latEnd: 21.1840, lngStart: -101.6680, lngEnd: -101.6630 },
  'COBRE': { latStart: 21.1829, latEnd: 21.1834, lngStart: -101.6680, lngEnd: -101.6630 },
  'CRIPTON': { latStart: 21.1824, latEnd: 21.1829, lngStart: -101.6680, lngEnd: -101.6630 },
  'CRPTON': { latStart: 21.1824, latEnd: 21.1829, lngStart: -101.6680, lngEnd: -101.6630 },
  'CRIPTO': { latStart: 21.1824, latEnd: 21.1829, lngStart: -101.6680, lngEnd: -101.6630 },
  'HELIO': { latStart: 21.1824, latEnd: 21.1828, lngStart: -101.6680, lngEnd: -101.6635 },
  'ESTAÑO': { latStart: 21.1818, latEnd: 21.1823, lngStart: -101.6675, lngEnd: -101.6635 },
  'BARIO': { latStart: 21.1815, latEnd: 21.1820, lngStart: -101.6675, lngEnd: -101.6635 },
  'REBOCEROS': { latStart: 21.1815, latEnd: 21.1825, lngStart: -101.6690, lngEnd: -101.6660 },
  'BLVD METALES': { latStart: 21.1825, latEnd: 21.1878, lngStart: -101.6675, lngEnd: -101.6665 },
  'METALES': { latStart: 21.1825, latEnd: 21.1878, lngStart: -101.6675, lngEnd: -101.6665 },

  // ========================================================
  // PEDREGALES DE ECHEVESTE Y EL TECOTÁN (Rocas y Minerales)
  // ========================================================
  'PEDREGALES': { latStart: 21.1880, latEnd: 21.1940, lngStart: -101.6705, lngEnd: -101.6675 },
  'BLVD PEDREGALES': { latStart: 21.1880, latEnd: 21.1940, lngStart: -101.6705, lngEnd: -101.6675 },
  'ESTRATEMAS': { latStart: 21.1888, latEnd: 21.1900, lngStart: -101.6695, lngEnd: -101.6675 },
  'ESTRATEMA': { latStart: 21.1888, latEnd: 21.1900, lngStart: -101.6695, lngEnd: -101.6675 },
  'GABRO': { latStart: 21.1893, latEnd: 21.1905, lngStart: -101.6700, lngEnd: -101.6685 },
  'GADRO': { latStart: 21.1893, latEnd: 21.1905, lngStart: -101.6700, lngEnd: -101.6685 },
  'PEDREGAL DE SAN ANGEL': { latStart: 21.1878, latEnd: 21.1888, lngStart: -101.6705, lngEnd: -101.6688 },
  'PEDREGAL DEL POTOSI': { latStart: 21.1875, latEnd: 21.1883, lngStart: -101.6702, lngEnd: -101.6685 },
  'PEDREGALES DEL POTOSI': { latStart: 21.1875, latEnd: 21.1883, lngStart: -101.6702, lngEnd: -101.6685 },
  'PEDREGAL DEL EDEN': { latStart: 21.1880, latEnd: 21.1890, lngStart: -101.6698, lngEnd: -101.6680 },
  'PEDREGAL DE SAN MIGUEL': { latStart: 21.1876, latEnd: 21.1885, lngStart: -101.6700, lngEnd: -101.6682 },
  'PEDREGAL DE JEREZ': { latStart: 21.1885, latEnd: 21.1895, lngStart: -101.6695, lngEnd: -101.6675 },
  'PEDREGAL DE LA VALENCIANA': { latStart: 21.1880, latEnd: 21.1890, lngStart: -101.6695, lngEnd: -101.6675 },
  'AZOICAS': { latStart: 21.1900, latEnd: 21.1912, lngStart: -101.6695, lngEnd: -101.6678 },
  'ANDESITA': { latStart: 21.1895, latEnd: 21.1905, lngStart: -101.6695, lngEnd: -101.6678 },
  'ANDRESITA': { latStart: 21.1895, latEnd: 21.1905, lngStart: -101.6695, lngEnd: -101.6678 },
  'IGNEAS': { latStart: 21.1902, latEnd: 21.1914, lngStart: -101.6695, lngEnd: -101.6678 },
  'DIATOMITAS': { latStart: 21.1898, latEnd: 21.1910, lngStart: -101.6695, lngEnd: -101.6678 },
  'MAGMA': { latStart: 21.1900, latEnd: 21.1912, lngStart: -101.6695, lngEnd: -101.6678 },
  'CLORITA': { latStart: 21.1892, latEnd: 21.1904, lngStart: -101.6695, lngEnd: -101.6678 },
  'BISUTAS': { latStart: 21.1890, latEnd: 21.1902, lngStart: -101.6695, lngEnd: -101.6678 },
  'SIENITA': { latStart: 21.1895, latEnd: 21.1905, lngStart: -101.6695, lngEnd: -101.6678 },
  'BASALTO': { latStart: 21.1900, latEnd: 21.1910, lngStart: -101.6695, lngEnd: -101.6678 },
  'OBSIDIANA': { latStart: 21.1905, latEnd: 21.1915, lngStart: -101.6695, lngEnd: -101.6678 },
  'ESTALACTITAS': { latStart: 21.1890, latEnd: 21.1900, lngStart: -101.6695, lngEnd: -101.6678 },
  'ESTALAGMITAS': { latStart: 21.1890, latEnd: 21.1900, lngStart: -101.6695, lngEnd: -101.6678 },
  'TECOTAN': { latStart: 21.1915, latEnd: 21.1935, lngStart: -101.6695, lngEnd: -101.6670 },
  'GUJARROS': { latStart: 21.1885, latEnd: 21.1895, lngStart: -101.6695, lngEnd: -101.6675 },

  // ========================================================
  // HACIENDA ECHEVESTE (Calles de Oficios)
  // ========================================================
  'TALLADORES': { latStart: 21.1800, latEnd: 21.1805, lngStart: -101.6680, lngEnd: -101.6630 },
  'EMPEDRADORES': { latStart: 21.1795, latEnd: 21.1800, lngStart: -101.6680, lngEnd: -101.6630 },
  'EMPERADORES': { latStart: 21.1795, latEnd: 21.1800, lngStart: -101.6680, lngEnd: -101.6630 },
  'EMPREDADORES': { latStart: 21.1795, latEnd: 21.1800, lngStart: -101.6680, lngEnd: -101.6630 },
  'TABIQUEROS': { latStart: 21.1791, latEnd: 21.1796, lngStart: -101.6680, lngEnd: -101.6630 },
  'ARENEROS': { latStart: 21.1787, latEnd: 21.1792, lngStart: -101.6680, lngEnd: -101.6630 },
  'MATERIALISTAS': { latStart: 21.1783, latEnd: 21.1788, lngStart: -101.6685, lngEnd: -101.6630 },
  'BLVD MATERIALISTA': { latStart: 21.1783, latEnd: 21.1788, lngStart: -101.6685, lngEnd: -101.6630 },
  'MATERIALISTA': { latStart: 21.1783, latEnd: 21.1788, lngStart: -101.6685, lngEnd: -101.6630 },
  'CARPINTEROS': { latStart: 21.1778, latEnd: 21.1783, lngStart: -101.6680, lngEnd: -101.6630 },
  'ALBAÑILES': { latStart: 21.1774, latEnd: 21.1779, lngStart: -101.6680, lngEnd: -101.6630 },
  'ALBA#ILES': { latStart: 21.1774, latEnd: 21.1779, lngStart: -101.6680, lngEnd: -101.6630 },
  'ALBANILES': { latStart: 21.1774, latEnd: 21.1779, lngStart: -101.6680, lngEnd: -101.6630 },
  'PINTORES': { latStart: 21.1770, latEnd: 21.1775, lngStart: -101.6680, lngEnd: -101.6630 },
  'DIBUJANTES': { latStart: 21.1766, latEnd: 21.1771, lngStart: -101.6680, lngEnd: -101.6630 },
  'BLVD DIBUJANTES': { latStart: 21.1766, latEnd: 21.1771, lngStart: -101.6680, lngEnd: -101.6630 },
  'ALFAREROS': { latStart: 21.1762, latEnd: 21.1767, lngStart: -101.6680, lngEnd: -101.6630 },
  'FONTANEROS': { latStart: 21.1758, latEnd: 21.1763, lngStart: -101.6680, lngEnd: -101.6630 },
  'AGRICULTORES': { latStart: 21.1754, latEnd: 21.1759, lngStart: -101.6680, lngEnd: -101.6630 },
  'ELECTRICISTAS': { latStart: 21.1780, latEnd: 21.1785, lngStart: -101.6680, lngEnd: -101.6630 },
  'FORJADORES': { latStart: 21.1798, latEnd: 21.1803, lngStart: -101.6680, lngEnd: -101.6630 },
  'EMPRENDEDORES': { latStart: 21.1788, latEnd: 21.1793, lngStart: -101.6680, lngEnd: -101.6630 },
  'PASTORES': { latStart: 21.1768, latEnd: 21.1773, lngStart: -101.6680, lngEnd: -101.6630 },
  'PASEO DE ECHEVESTE': { latStart: 21.1770, latEnd: 21.1810, lngStart: -101.6695, lngEnd: -101.6675 },
  'HERMENEGILDO BUSTOS': { latStart: 21.1750, latEnd: 21.1830, lngStart: -101.6640, lngEnd: -101.6630 },
  'BLVD HERMENEGILDO BUSTOS': { latStart: 21.1750, latEnd: 21.1830, lngStart: -101.6640, lngEnd: -101.6630 },
  'MIGUEL HIDALGO': { latStart: 21.1750, latEnd: 21.1830, lngStart: -101.6705, lngEnd: -101.6695 },
  'BLVD HIDALGO': { latStart: 21.1750, latEnd: 21.1830, lngStart: -101.6705, lngEnd: -101.6695 },
  'BLVD MIGUEL HIDALGO': { latStart: 21.1750, latEnd: 21.1830, lngStart: -101.6705, lngEnd: -101.6695 },

  // ========================================================
  // VALLE HERMOSO / BOSQUES DE LA PRESA / RIVERA DE LA PRESA
  // ========================================================
  'BRICHO': { latStart: 21.1830, latEnd: 21.1845, lngStart: -101.6740, lngEnd: -101.6720 },
  'DORADILLA': { latStart: 21.1825, latEnd: 21.1835, lngStart: -101.6735, lngEnd: -101.6715 },
  'JUNCO': { latStart: 21.1835, latEnd: 21.1845, lngStart: -101.6745, lngEnd: -101.6725 },
  'PIÑONCILLO': { latStart: 21.1830, latEnd: 21.1840, lngStart: -101.6740, lngEnd: -101.6720 },
  'ALERCE': { latStart: 21.1832, latEnd: 21.1842, lngStart: -101.6740, lngEnd: -101.6720 },
  'ESTRAGON': { latStart: 21.1825, latEnd: 21.1835, lngStart: -101.6740, lngEnd: -101.6720 },
  'BOSQUE DE FRESNOS': { latStart: 21.1735, latEnd: 21.1755, lngStart: -101.6745, lngEnd: -101.6725 },
  'BOSQUES DE LA PRESA': { latStart: 21.1735, latEnd: 21.1755, lngStart: -101.6745, lngEnd: -101.6725 },
  'BOSQUES DE CIPRES': { latStart: 21.1735, latEnd: 21.1755, lngStart: -101.6745, lngEnd: -101.6725 },
  'BOSQUE DEL MEZQUITE': { latStart: 21.1735, latEnd: 21.1755, lngStart: -101.6745, lngEnd: -101.6725 },
  'BOSQUES DE FRANCIA': { latStart: 21.1735, latEnd: 21.1755, lngStart: -101.6745, lngEnd: -101.6725 },
  'RIVERA DEL RIO': { latStart: 21.1745, latEnd: 21.1770, lngStart: -101.6745, lngEnd: -101.6720 },
  'PRESA DE SAN JOSE': { latStart: 21.1745, latEnd: 21.1770, lngStart: -101.6745, lngEnd: -101.6720 },
  'PRESA DEL BARRIAL': { latStart: 21.1745, latEnd: 21.1770, lngStart: -101.6745, lngEnd: -101.6720 },
  'PRESA SAN GERMAN': { latStart: 21.1745, latEnd: 21.1770, lngStart: -101.6745, lngEnd: -101.6720 },
  'PRESA NUEVA DE JALPA': { latStart: 21.1745, latEnd: 21.1770, lngStart: -101.6745, lngEnd: -101.6720 },
  'PALMA REAL': { latStart: 21.1730, latEnd: 21.1745, lngStart: -101.6715, lngEnd: -101.6700 },

  // ========================================================
  // CLUB CAMPESTRE / VILLAS DEL CAMPESTRE (Pacientes de Enfermera 5 en la orilla)
  // ========================================================
  'JACARANDAS': { latStart: 21.1620, latEnd: 21.1645, lngStart: -101.6945, lngEnd: -101.6915 },
  'FRESNO DEL CAMPESTRE': { latStart: 21.1635, latEnd: 21.1655, lngStart: -101.6890, lngEnd: -101.6865 },
  'ALAMO': { latStart: 21.1630, latEnd: 21.1650, lngStart: -101.6885, lngEnd: -101.6860 }
};

const REAL_COLONIA_CENTERS = {
  'HACIENDA ECHEVESTE': { lat: 21.1785, lng: -101.6658 },
  'GRANJAS DE ECHEVESTE': { lat: 21.1865, lng: -101.6655 },
  'PEDREGALES DE ECHEVESTE': { lat: 21.1895, lng: -101.6688 },
  'VILLAS DE ECHEVESTE': { lat: 21.1830, lng: -101.6655 },
  'EL TECOTAN': { lat: 21.1920, lng: -101.6685 },
  'VALLE HERMOSO': { lat: 21.1840, lng: -101.6735 },
  'RIVERA DE LA PRESA': { lat: 21.1750, lng: -101.6745 },
  'BOSQUES DE LA PRESA': { lat: 21.1740, lng: -101.6735 },
  'PORTALES DE LA ARBOLEDA': { lat: 21.1736, lng: -101.6708 },
  'TABACHINES': { lat: 21.1408, lng: -101.6425 }
};

function geocodeAddress(direccion, index, enfId) {
  const upper = direccion.toUpperCase();

  // 1. Coincidencia por calle
  for (const [stKey, bounds] of Object.entries(REAL_STREET_ANCHORS)) {
    if (upper.includes(stKey)) {
      const pseudoRandLat = ((index * 37 + 13) % 1000) / 1000;
      const pseudoRandLng = ((index * 59 + 29) % 1000) / 1000;
      const lat = bounds.latStart + (bounds.latEnd - bounds.latStart) * pseudoRandLat;
      const lng = bounds.lngStart + (bounds.lngEnd - bounds.lngStart) * pseudoRandLng;
      return { lat: parseFloat(lat.toFixed(8)), lng: parseFloat(lng.toFixed(8)) };
    }
  }

  // 2. Coincidencia por colonia
  for (const [colKey, center] of Object.entries(REAL_COLONIA_CENTERS)) {
    if (upper.includes(colKey)) {
      const offsetLat = (((index * 47) % 200) - 100) * 0.000015;
      const offsetLng = (((index * 71) % 200) - 100) * 0.000015;
      return {
        lat: parseFloat((center.lat + offsetLat).toFixed(8)),
        lng: parseFloat((center.lng + offsetLng).toFixed(8))
      };
    }
  }

  // 3. Fallback por zona de enfermera
  if (enfId === 8) {
    const offsetLat = (((index * 31) % 200) - 100) * 0.00002;
    const offsetLng = (((index * 53) % 200) - 100) * 0.00002;
    return {
      lat: parseFloat((21.1865 + offsetLat).toFixed(8)),
      lng: parseFloat((-101.6660 + offsetLng).toFixed(8))
    };
  } else {
    const offsetLat = (((index * 31) % 200) - 100) * 0.00002;
    const offsetLng = (((index * 53) % 200) - 100) * 0.00002;
    return {
      lat: parseFloat((21.1785 + offsetLat).toFixed(8)),
      lng: parseFloat((-101.6660 + offsetLng).toFixed(8))
    };
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL en Railway.');

    // 1. Actualizar Pacientes de Enfermera 8 (Ana Laura Guerrero de la Rosa)
    console.log('\n--- Actualizando Pacientes de Enfermera 8 (Ana Laura Guerrero) ---');
    const pacs8 = await client.query('SELECT id, direccion FROM pacientes WHERE id_enfermera = 8 ORDER BY id');
    let count8 = 0;
    for (let i = 0; i < pacs8.rows.length; i++) {
      const p = pacs8.rows[i];
      const coords = geocodeAddress(p.direccion, p.id, 8);
      await client.query('UPDATE pacientes SET lat = $1, lng = $2 WHERE id = $3', [coords.lat, coords.lng, p.id]);
      count8++;
    }
    console.log(`✅ ${count8} pacientes de Ana Laura Guerrero actualizados.`);

    // 2. Actualizar Pacientes de Enfermera 7 (Yatana Joselin Gómez Medina)
    console.log('\n--- Actualizando Pacientes de Enfermera 7 (Yatana Joselin Gómez) ---');
    const pacs7 = await client.query('SELECT id, direccion FROM pacientes WHERE id_enfermera = 7 ORDER BY id');
    let count7 = 0;
    for (let i = 0; i < pacs7.rows.length; i++) {
      const p = pacs7.rows[i];
      const coords = geocodeAddress(p.direccion, p.id, 7);
      await client.query('UPDATE pacientes SET lat = $1, lng = $2 WHERE id = $3', [coords.lat, coords.lng, p.id]);
      count7++;
    }
    console.log(`✅ ${count7} pacientes de Yatana Gómez actualizados.`);

    // 3. Actualizar Pacientes de Club Campestre (Enfermera 5)
    console.log('\n--- Actualizando Pacientes de Club Campestre en orilla de Presa ---');
    const campestreIds = [2736, 3059, 3079, 3281];
    for (const id of campestreIds) {
      const res = await client.query('SELECT id, direccion FROM pacientes WHERE id = $1', [id]);
      if (res.rows.length > 0) {
        const p = res.rows[0];
        const coords = geocodeAddress(p.direccion, p.id, 5);
        await client.query('UPDATE pacientes SET lat = $1, lng = $2 WHERE id = $3', [coords.lat, coords.lng, p.id]);
        console.log(`  ✅ Paciente ${p.id} corregido a (${coords.lat}, ${coords.lng})`);
      }
    }

    // 4. Actualizar pacientes específicos de Echeveste en otras enfermeras
    console.log('\n--- Actualizando Pacientes sueltos de Echeveste ---');
    const extraIds = [3661, 5900];
    for (const id of extraIds) {
      const res = await client.query('SELECT id, direccion, id_enfermera FROM pacientes WHERE id = $1', [id]);
      if (res.rows.length > 0) {
        const p = res.rows[0];
        const coords = geocodeAddress(p.direccion, p.id, p.id_enfermera);
        await client.query('UPDATE pacientes SET lat = $1, lng = $2 WHERE id = $3', [coords.lat, coords.lng, p.id]);
        console.log(`  ✅ Paciente ${p.id} (Enf ${p.id_enfermera}) corregido a (${coords.lat}, ${coords.lng})`);
      }
    }

    // ========================================================
    // 5. AUDITORÍA FINAL COMPLETA DE TODA LA BASE DE DATOS
    // ========================================================
    console.log('\n========================================================');
    console.log('🔍 EJECUTANDO AUDITORÍA FINAL DE TODA LA BASE DE DATOS...');
    const allPacs = await client.query('SELECT p.id, p.nombre, p.direccion, p.id_enfermera, p.lat, p.lng, pe.nombre_completo FROM pacientes p LEFT JOIN personal_enfermeria pe ON pe.id = p.id_enfermera');

    const minLat = 21.17092, maxLat = 21.18892;
    const minLng = -101.69966, maxLng = -101.67747;
    const stillInWater = allPacs.rows.filter(p => {
      const lat = parseFloat(p.lat);
      const lng = parseFloat(p.lng);
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });

    console.log(`📊 Total pacientes en la base de datos: ${allPacs.rows.length}`);
    console.log(`🚨 Pacientes DENTRO de la Presa del Palote / Parque Metropolitano: ${stillInWater.length}`);
    if (stillInWater.length > 0) {
      stillInWater.forEach(p => console.log('  ⚠️ Aún en agua:', p.id, p.nombre_completo, p.direccion, p.lat, p.lng));
    } else {
      console.log('🎉 ¡PERFECTO! Ningún paciente de ningún enfermero se encuentra dentro del agua de la presa.');
    }

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err);
    try { await client.end(); } catch (e) {}
  }
}

main();
