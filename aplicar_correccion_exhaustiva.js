const { Client } = require('pg');
const { STREET_COORDS, getJitter } = require('./config_calles_coordenadas');

const client = new Client({
  connectionString: 'postgresql://postgres:UdwGEEdTzRRlJGqiWwktfEiXqdSKWOAC@tokaido.proxy.rlwy.net:34138/railway',
  ssl: false
});

async function run() {
  await client.connect();
  console.log('--- INICIANDO CORRECCIÓN EXHAUSTIVA DE PACIENTES ---');

  // Load all patients
  const res = await client.query(`
    SELECT p.id, p.id_enfermera, pe.nombre_completo, p.direccion, p.lat, p.lng
    FROM pacientes p
    LEFT JOIN personal_enfermeria pe ON pe.id = p.id_enfermera
    ORDER BY p.id
  `);

  let updatedCount = 0;

  for (const p of res.rows) {
    const dir = p.direccion || '';
    const upper = dir.toUpperCase();
    const curLat = parseFloat(p.lat);
    const curLng = parseFloat(p.lng);
    const parts = dir.split('|')[0].split(',').map(s => s.trim().toUpperCase());
    const streetName = parts[0] ? parts[0].replace(/^(CALLE|AVENIDA|AV\.|BLVD|BOULEVARD|PRIVADA|PRIV\.|PROLONGACION|PROL\.)\s+/i, '').trim() : '';

    let newBaseCoords = null;
    let reason = '';

    // 1. 5 de Febrero in Centro / San Juan de Dios (Enf 2)
    if (upper.includes('5 DE FEBRERO') && (upper.includes('CENTRO') || upper.includes('SAN JUAN DE DIOS') || curLng > -101.60)) {
      newBaseCoords = STREET_COORDS['5 DE FEBRERO'];
      reason = '5 de Febrero en San Juan de Dios / Centro (estaba en Nuevo Valle de Moreno)';
    }

    // 2. Maple in Valle del Moral (Enf 6)
    else if (upper.includes('MAPLE') && upper.includes('VALLE DEL MORAL')) {
      newBaseCoords = STREET_COORDS['MAPLE'];
      reason = 'Calle Maple en Valle del Moral (estaba en Valle de Jerez)';
    }

    // 3. Tabachines dump check: Nurse != 1 having Tabachines address or coordinates
    else if (upper.includes('TABACHINES') && p.id_enfermera !== 1) {
      // Find matching street
      for (const [st, coords] of Object.entries(STREET_COORDS)) {
        if (upper.includes(st) || streetName === st) {
          newBaseCoords = coords;
          reason = `Calle ${st} reubicada desde Tabachines a su zona real (Enf ${p.id_enfermera})`;
          break;
        }
      }
      // If no exact street match, use nurse default real zone
      if (!newBaseCoords) {
        if (p.id_enfermera === 2) {
          newBaseCoords = { lat: 21.1180, lng: -101.6780 }; // San Juan de Dios
          reason = 'Paciente Enf 2 en Tabachines reubicado a San Juan de Dios';
        } else if (p.id_enfermera === 3) {
          newBaseCoords = { lat: 21.1320, lng: -101.6880 }; // Obregon
          reason = 'Paciente Enf 3 en Tabachines reubicado a Obregon';
        } else if (p.id_enfermera === 5) {
          newBaseCoords = { lat: 21.1650, lng: -101.6950 }; // Campestre
          reason = 'Paciente Enf 5 en Tabachines reubicado a Campestre';
        } else if (p.id_enfermera === 6) {
          newBaseCoords = { lat: 21.1550, lng: -101.6800 }; // Valle del Moral
          reason = 'Paciente Enf 6 en Tabachines reubicado a Valle del Moral';
        } else if (p.id_enfermera === 7) {
          newBaseCoords = { lat: 21.1750, lng: -101.6700 }; // Rivera de la Presa
          reason = 'Paciente Enf 7 en Tabachines reubicado a Rivera de la Presa';
        } else if (p.id_enfermera === 8) {
          newBaseCoords = { lat: 21.1850, lng: -101.6660 }; // Echeveste
          reason = 'Paciente Enf 8 en Tabachines reubicado a Echeveste';
        } else if (p.id_enfermera === 9) {
          newBaseCoords = { lat: 21.1480, lng: -101.6660 }; // Deportiva
          reason = 'Paciente Enf 9 en Tabachines reubicado a Deportiva';
        } else if (p.id_enfermera === 10) {
          newBaseCoords = { lat: 21.1320, lng: -101.6880 }; // Obregon
          reason = 'Paciente Enf 10 en Tabachines reubicado a Obregon';
        }
      }
    }

    // 4. Karla Calvillo (Enf 4) misplacements:
    // Selva Tropical in El Molino -> La Selva
    else if (p.id_enfermera === 4 && upper.includes('SELVA TROPICAL')) {
      newBaseCoords = STREET_COORDS['SELVA TROPICAL'];
      reason = 'Selva Tropical en Fracc La Selva (estaba en El Molino)';
    }
    // Selva Morada in Centro -> La Selva
    else if (p.id_enfermera === 4 && upper.includes('SELVA MORADA')) {
      newBaseCoords = STREET_COORDS['SELVA MORADA'];
      reason = 'Selva Morada en Fracc La Selva (estaba en Centro)';
    }
    // 2 de Abril / Real de San Antonio -> Real de San Antonio
    else if (p.id_enfermera === 4 && upper.includes('2 DE ABRIL') && upper.includes('REAL DE SAN ANTONIO')) {
      newBaseCoords = STREET_COORDS['2 DE ABRIL'];
      reason = '2 de Abril en Real de San Antonio (estaba en Centro)';
    }
    // 6 de Enero / 8 de Marzo -> 8 de Marzo
    else if (p.id_enfermera === 4 && upper.includes('6  DE ENERO') && upper.includes('8 DE MARZO')) {
      newBaseCoords = STREET_COORDS['6 DE ENERO'];
      reason = '6 de Enero en 8 de Marzo (estaba en Centro)';
    }
    // 11 de Junio in Centro -> 11 de Junio
    else if (p.id_enfermera === 4 && upper.includes('11 DE JUNIO') && upper.includes('ZONA CENTRO')) {
      newBaseCoords = STREET_COORDS['11 DE JUNIO'];
      reason = '11 de Junio en Fracc 11 de Junio (estaba en Centro)';
    }

    // 5. Coecillo misplacements (Fray Daniel Mireles in Coecillo)
    else if (upper.includes('FRAY DANIEL MIRELES') && upper.includes('COECILLO') && curLng > -101.65) {
      newBaseCoords = STREET_COORDS['FRAY DANIEL MIRELES'];
      reason = 'Fray Daniel Mireles en Barrio del Coecillo (estaba desplazado al oriente)';
    }

    // 6. León Moderno misplacements (Enf 5 ID 3202, Enf 10 IDs 5484, 5683, 5743, 5821)
    else if (upper.includes('LEON MODERNO') && (curLat > 21.13 || curLat < 21.10 || curLng < -101.685)) {
      if (upper.includes('RICARDO PALMERIN')) newBaseCoords = STREET_COORDS['RICARDO PALMERIN'];
      else if (upper.includes('SAN LUIS DE LA PAZ')) newBaseCoords = STREET_COORDS['SAN LUIS DE LA PAZ'];
      else if (upper.includes('ESPAÑA')) newBaseCoords = STREET_COORDS['ESPAÑA'];
      else if (upper.includes('WAGNER')) newBaseCoords = STREET_COORDS['WAGNER'];
      else newBaseCoords = { lat: 21.1120, lng: -101.6705 };
      reason = 'Paciente de Fracc León Moderno reubicado a sus coordenadas reales';
    }

    // 7. León 1 & Nuevo León misplacements (Enf 1, 7, 8, 9)
    else if ((upper.includes('LEON 1') || upper.includes('LEON I')) && (curLat > 21.16 || curLng < -101.65)) {
      if (upper.includes('CARLOS A OBREGON TORRES')) newBaseCoords = STREET_COORDS['CARLOS A OBREGON TORRES'];
      else if (upper.includes('SANTIAGO GARZA')) newBaseCoords = STREET_COORDS['SANTIAGO GARZA'];
      else if (upper.includes('IGNACIO VILLAVICENCIO')) newBaseCoords = STREET_COORDS['IGNACIO VILLAVICENCIO'];
      else newBaseCoords = { lat: 21.1436, lng: -101.6376 };
      reason = 'Paciente de Fracc León 1 reubicado a León 1';
    }
    else if (upper.includes('NUEVO LEON') && (curLat > 21.17 || curLng < -101.66)) {
      newBaseCoords = STREET_COORDS['ZUAZUA'];
      reason = 'Paciente de Fracc Nuevo León reubicado a Nuevo León';
    }

    // 8. Individual cases:
    // Cadmio in San Jose del Consuelo (ID 181)
    else if (p.id === 181) {
      newBaseCoords = STREET_COORDS['CADMIO'];
      reason = 'Cadmio en San José del Consuelo';
    }
    // Mision de la Joya (ID 185)
    else if (p.id === 185) {
      newBaseCoords = { lat: 21.1480, lng: -101.7400 };
      reason = 'Misión Catequista en Misión de la Joya';
    }
    // León II (ID 212, ID 672)
    else if ((p.id === 212 || p.id === 672) && upper.includes('LEON II')) {
      newBaseCoords = { lat: 21.1441, lng: -101.6730 };
      reason = 'Paciente de Fracc León II';
    }
    // Bosques del Campestre (ID 657)
    else if (p.id === 657) {
      newBaseCoords = { lat: 21.1600, lng: -101.6880 };
      reason = 'Club Campestre en Bosques del Campestre';
    }
    // Hidlog in Valle de León (ID 1548)
    else if (p.id === 1548) {
      newBaseCoords = STREET_COORDS['HIDLOG'];
      reason = 'Valle de León';
    }
    // Mercedes in Colonia Obregón (ID 1734)
    else if (p.id === 1734) {
      newBaseCoords = STREET_COORDS['MERCEDES'];
      reason = 'Mercedes en Colonia Obregón';
    }
    // San Jeronimo (ID 5073)
    else if (p.id === 5073) {
      newBaseCoords = STREET_COORDS['FUERTE DE GUADALUPE'];
      reason = 'Fuerte de Guadalupe en San Jerónimo';
    }

    // If correction applies, apply jitter and execute update
    if (newBaseCoords) {
      const jitter = getJitter(p.id);
      const targetLat = (newBaseCoords.lat + jitter.latJitter).toFixed(8);
      const targetLng = (newBaseCoords.lng + jitter.lngJitter).toFixed(8);

      await client.query(
        'UPDATE pacientes SET lat = $1, lng = $2 WHERE id = $3',
        [targetLat, targetLng, p.id]
      );

      console.log(`[OK] ID ${p.id} (Enf ${p.id_enfermera}): (${curLat}, ${curLng}) -> (${targetLat}, ${targetLng}) | ${reason}`);
      updatedCount++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL DE PACIENTES REUBICADOS CON ÉXITO: ${updatedCount}`);
  console.log(`======================================================`);

  await client.end();
}

run().catch(console.error);
