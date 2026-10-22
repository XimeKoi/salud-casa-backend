const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:UdwGEEdTzRRlJGqiWwktfEiXqdSKWOAC@tokaido.proxy.rlwy.net:34138/railway',
  ssl: false
});

// Deterministic jitter based on patient ID so pins don't stack on top of each other
function getJitter(id) {
  const seed1 = Math.sin(id * 997.0);
  const seed2 = Math.cos(id * 733.0);
  return {
    latJitter: (seed1 * 0.0018), // ~ +/- 200m
    lngJitter: (seed2 * 0.0018)
  };
}

// Street specific coordinates in Leon, GTO
const STREET_COORDS = {
  // San Juan de Dios / Centro (Nurse 2 & Nurse 3)
  '5 DE FEBRERO': { lat: 21.1190, lng: -101.6775 },
  'ALTAMIRANO': { lat: 21.1185, lng: -101.6765 },
  'IGNACIO ALTAMIRANO': { lat: 21.1185, lng: -101.6765 },
  'INDEPENDENCIA': { lat: 21.1180, lng: -101.6785 },
  'CANDIDO NAVARRO': { lat: 21.1170, lng: -101.6790 },
  'DIAZ MIRON': { lat: 21.1175, lng: -101.6770 },
  'JUAN VALLE': { lat: 21.1195, lng: -101.6760 },
  'TRES MARIAS': { lat: 21.1165, lng: -101.6780 },
  'VICENTE GUERRERO': { lat: 21.1172, lng: -101.6768 },
  'ROSAS MORENO': { lat: 21.1192, lng: -101.6755 },
  'HERNANDEZ ALVAREZ': { lat: 21.1182, lng: -101.6762 },
  'OTTAWA': { lat: 21.1205, lng: -101.6770 },

  // Barrio Arriba / Obregón (Nurse 3 & Nurse 10)
  'BOLIVAR': { lat: 21.1315, lng: -101.6875 },
  'AQUILES SERDAN': { lat: 21.1330, lng: -101.6845 },
  'MOCTEZUMA': { lat: 21.1305, lng: -101.6885 },
  'MALECÓN DEL RÍO': { lat: 21.1325, lng: -101.6815 },
  'MALECÃ“N DEL RÃ¿O': { lat: 21.1325, lng: -101.6815 },
  'MERIDA': { lat: 21.1310, lng: -101.6870 },
  'ALMENDRA': { lat: 21.1335, lng: -101.6890 },
  'LA MORA': { lat: 21.1340, lng: -101.6895 },
  'AVELLANA': { lat: 21.1338, lng: -101.6892 },
  'CONSTANCIA': { lat: 21.1344, lng: -101.6878 },
  '20 DE ENERO': { lat: 21.1328, lng: -101.6865 },
  'MERCEDES': { lat: 21.1320, lng: -101.6880 },
  'OLIVO': { lat: 21.1332, lng: -101.6890 },
  'JUAN ÁLVAREZ': { lat: 21.1318, lng: -101.6875 },
  'PURISIMA': { lat: 21.1300, lng: -101.6895 },
  'SUBIDA AL CALVARIO': { lat: 21.1345, lng: -101.6890 },
  'ALFARO': { lat: 21.1312, lng: -101.6870 },
  'ALEMANIA': { lat: 21.1215, lng: -101.6885 },
  'HIGUERA': { lat: 21.1338, lng: -101.6895 },
  'NORIEGA': { lat: 21.1325, lng: -101.6880 },
  'MISION EVANGELICA': { lat: 21.1570, lng: -101.6470 },

  // Coecillo (Nurse 2 & 3)
  'FRAY DANIEL MIRELES': { lat: 21.1260, lng: -101.6660 },
  'SAN JUAN DEL COECILLO': { lat: 21.1265, lng: -101.6655 },

  // Campestre / Villas del Campestre / Cumbres (Nurse 5)
  'PRIVADA REAL BUGAMBILIAS': { lat: 21.1600, lng: -101.6760 },
  'EUGENIO GARZA SADA': { lat: 21.1660, lng: -101.6980 },
  'VILLA DE LA CONCEPCION': { lat: 21.1670, lng: -101.6970 },
  'VILLAS DE LA CONCEPCION': { lat: 21.1670, lng: -101.6970 },
  'VALLE  OAXACA': { lat: 21.1610, lng: -101.6930 },
  'VALLE OAXACA': { lat: 21.1610, lng: -101.6930 },
  'PASEO DE LAS LOMAS': { lat: 21.1730, lng: -101.7050 },
  'JUAN BAUTISTA DE LA SALLE': { lat: 21.1520, lng: -101.6920 },
  'PUNTA ESMERALDA': { lat: 21.1630, lng: -101.6940 },
  'ALAMEDA DIAMANTE': { lat: 21.1620, lng: -101.6950 },
  'AV JACARANDA': { lat: 21.1680, lng: -101.6920 },
  'MONTE SINAI': { lat: 21.1714, lng: -101.7070 },

  // Valle del Moral / San Jerónimo / Campestre (Nurse 6)
  'BQUES DE CHAPULTEPEC': { lat: 21.1540, lng: -101.6820 },
  'QUINTA SAN RAFAEL': { lat: 21.1640, lng: -101.6750 },
  'CIRC VALLE DEL MORAL': { lat: 21.1590, lng: -101.6760 },
  'CIRCUITO VALLE DEL MORAL': { lat: 21.1590, lng: -101.6760 },
  'MAPLE': { lat: 21.1590, lng: -101.6760 },
  'NICOLAS CALVO': { lat: 21.1495, lng: -101.6690 },
  'BOSQUES DEL PALMAR': { lat: 21.1530, lng: -101.6830 },
  'CONDADO DE COMPOSTELA': { lat: 21.1620, lng: -101.6780 },
  'SIERRA DEL AHUEHUETE': { lat: 21.1520, lng: -101.6840 },
  'BOSQUES DEL NORTE': { lat: 21.1645, lng: -101.6750 },
  'BOSQUES DE VIENA': { lat: 21.1540, lng: -101.6830 },
  'HERMENEGILDO BUSTOS': { lat: 21.1690, lng: -101.6720 },

  // Rivera de la Presa / Echeveste / Bosques de la Presa (Nurse 7)
  'PRESA DEL PALOTE': { lat: 21.1740, lng: -101.6730 },
  'PRESA EL PALOTE': { lat: 21.1740, lng: -101.6730 },
  'ALBAÑILES DE ECHEVESTE': { lat: 21.1780, lng: -101.6660 },
  'TABACHIN DEL VALLE': { lat: 21.1750, lng: -101.6680 },
  'PRESA EL BARRIAL': { lat: 21.1745, lng: -101.6725 },
  'HACIENDA DEL CARMEN': { lat: 21.1760, lng: -101.6680 },
  'EMPREDADORES': { lat: 21.1790, lng: -101.6670 },
  'EMPEDRADORES': { lat: 21.1790, lng: -101.6670 },
  'EMPEDRADORES DE ECHEVESTE': { lat: 21.1790, lng: -101.6670 },
  'PRIV REAL DEL HUIZACHE': { lat: 21.1770, lng: -101.6675 },
  'ALBAÑILES': { lat: 21.1785, lng: -101.6665 },
  'PINTORES': { lat: 21.1795, lng: -101.6660 },
  'FORJADORES': { lat: 21.1800, lng: -101.6655 },
  'VILLAS DE LOS OLIVOS': { lat: 21.1765, lng: -101.6670 },
  'PRESA DE LA ESPERANZA': { lat: 21.1740, lng: -101.6735 },
  'BLVD MATERIALISTAS': { lat: 21.1780, lng: -101.6660 },
  'MATERIALISTAS DE ECHEVESTE': { lat: 21.1780, lng: -101.6660 },
  'PRESA DE SAN JOSE': { lat: 21.1735, lng: -101.6740 },
  'TULIPANES': { lat: 21.1755, lng: -101.6690 },
  'BOSQUE CAÑADA': { lat: 21.1730, lng: -101.6720 },
  'BOSQUE DE LA PRESA': { lat: 21.1735, lng: -101.6725 },

  // Granjas de Echeveste / Hacienda Echeveste / Pedregales (Nurse 8)
  'BRONCE DE ECHEVESTE': { lat: 21.1872, lng: -101.6651 },
  'CONTRATISTA': { lat: 21.1810, lng: -101.6660 },
  'PEDREGAL DE SAN MIGUEL': { lat: 21.1888, lng: -101.6702 },
  'URANIO DE ECHBEVESTE': { lat: 21.1840, lng: -101.6655 },
  'DIATOMITAS': { lat: 21.1890, lng: -101.6680 },
  'PASEO DE ECHEVESTE': { lat: 21.1810, lng: -101.6665 },
  'MERCURIO DE ECHEVESTE': { lat: 21.1838, lng: -101.6658 },
  'ACERO DE ECHEVESTE': { lat: 21.1825, lng: -101.6665 },
  'PLATINO': { lat: 21.1861, lng: -101.6651 },
  'METALES': { lat: 21.1840, lng: -101.6660 },

  // Unidad Deportiva / Insurgentes (Nurse 9)
  'PATRONA DE LA MUSICA': { lat: 21.1440, lng: -101.6660 },
  'PELOTA': { lat: 21.1485, lng: -101.6665 },
  'FUTBOL': { lat: 21.1480, lng: -101.6662 },
  'CARETA': { lat: 21.1490, lng: -101.6670 },
  'JUAN DE VILLERIAS': { lat: 21.1445, lng: -101.6675 },
  'CANASTA': { lat: 21.1475, lng: -101.6668 },
  'FRAY LUIS HERRERA': { lat: 21.1435, lng: -101.6670 },
  'FUERTE DE GUADALUPE': { lat: 21.1460, lng: -101.6850 },

  // La Selva / 8 de Marzo / Presitas (Nurse 4)
  'SELVA ALEGRÉ': { lat: 21.1610, lng: -101.6455 },
  'SELVA FLORIDA': { lat: 21.1623, lng: -101.6457 },
  'SELVA MORADA': { lat: 21.1610, lng: -101.6455 },
  'SELVA ROSA': { lat: 21.1615, lng: -101.6450 },
  'SELVA LIRON': { lat: 21.1608, lng: -101.6460 },
  'SELVA VIRGEN': { lat: 21.1617, lng: -101.6465 },
  'SELVA TROPICAL': { lat: 21.1605, lng: -101.6452 },
  '7 DE JULIO': { lat: 21.1560, lng: -101.6480 },
  '10 DE ABRIL': { lat: 21.1555, lng: -101.6485 },
  'MESA DEL OBISPO': { lat: 21.1540, lng: -101.6485 },
  'VALERIANO': { lat: 21.1505, lng: -101.6640 },
  'ANDADOR CRISMON': { lat: 21.1530, lng: -101.6490 },
  'PRESA DEL CONDE': { lat: 21.1535, lng: -101.6495 },
  '2 DE ENERO': { lat: 21.1545, lng: -101.6495 },
  '25 DE DICIEMBRE': { lat: 21.1550, lng: -101.6490 },
  '24 DE FEBRERO': { lat: 21.1545, lng: -101.6496 },
  '6 DE ENERO': { lat: 21.1550, lng: -101.6485 },
  '2 DE ABRIL': { lat: 21.1550, lng: -101.6500 },
  '11 DE JUNIO': { lat: 21.1550, lng: -101.6480 },

  // León Moderno (Nurse 5 & Nurse 10)
  'RICARDO PALMERIN': { lat: 21.1120, lng: -101.6705 },
  'SAN LUIS DE LA PAZ': { lat: 21.1125, lng: -101.6700 },
  'ESPAÑA': { lat: 21.1118, lng: -101.6710 },
  'WAGNER': { lat: 21.1130, lng: -101.6702 },

  // León 1 & Nuevo León (Nurses 1, 7, 8, 9)
  'CARLOS A OBREGON TORRES': { lat: 21.1436, lng: -101.6376 },
  'SANTIAGO GARZA': { lat: 21.1440, lng: -101.6370 },
  'IGNACIO VILLAVICENCIO': { lat: 21.1435, lng: -101.6380 },
  'ZUAZUA': { lat: 21.1480, lng: -101.6560 },

  // Other isolated misplacements
  'CADMIO': { lat: 21.1558, lng: -101.6493 },
  'ESTAMBUL': { lat: 21.1441, lng: -101.6730 },
  'ALONSO DE TORRES': { lat: 21.1441, lng: -101.6730 },
  'HIDLOG': { lat: 21.1630, lng: -101.6740 },
  'MISION CATEQUISTA': { lat: 21.1480, lng: -101.7400 } // if Joya
};

module.exports = { STREET_COORDS, getJitter };
