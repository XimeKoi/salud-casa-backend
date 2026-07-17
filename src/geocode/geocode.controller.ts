// src/geocode/geocode.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { AwsGeocodeService } from '../services/aws-geocode.service';

@Controller('geocode')
export class GeocodeController {
    constructor(private awsGeocodeService: AwsGeocodeService) { }

    @Get()
    async geocode(@Query('direccion') direccion: string) {
        console.log('📍 Geocode request:', direccion);

        if (!direccion || direccion.trim().length === 0) {
            return {
                success: false,
                error: 'Dirección requerida'
            };
        }

        try {
            // ⭐ INTENTAR CON LA DIRECCIÓN ORIGINAL
            let result = await this.awsGeocodeService.geocodeAddress(direccion);
            console.log('📦 AWS Result:', result);

            if (result) {
                return {
                    success: true,
                    lat: result.lat,
                    lng: result.lng,
                    display_name: result.display_name || direccion,
                    road: direccion
                };
            }

            // ⭐ SI AWS FALLA, INTENTAR CON NOMINATIM (VARIAS COMBINACIONES)
            console.log('⚠️ AWS falló, intentando con Nominatim...');

            // ⭐ 1. INTENTAR CON LA DIRECCIÓN COMPLETA
            let nominatimResult = await this.geocodeNominatim(direccion);

            // ⭐ 2. SI FALLA, INTENTAR CON "CALLE" + DIRECCIÓN
            if (!nominatimResult && !direccion.toLowerCase().startsWith('calle')) {
                console.log('🔄 Intentando con "calle" + direccion...');
                nominatimResult = await this.geocodeNominatim(`calle ${direccion}`);
            }

            // ⭐ 3. SI FALLA, INTENTAR SOLO CON LA CALLE (SIN NÚMERO)
            if (!nominatimResult) {
                const palabras = direccion.split(' ');
                let calleSinNumero = '';
                let numero = '';

                for (const palabra of palabras) {
                    if (palabra.match(/^\d+$/)) {
                        numero = palabra;
                    } else {
                        calleSinNumero += palabra + ' ';
                    }
                }
                calleSinNumero = calleSinNumero.trim();

                if (calleSinNumero && calleSinNumero.length > 3 && calleSinNumero !== direccion) {
                    console.log(`🔄 Intentando con calle sin número: "${calleSinNumero}"`);
                    nominatimResult = await this.geocodeNominatim(calleSinNumero);

                    // ⭐ SI ENCONTRÓ LA CALLE PERO NO EL NÚMERO, AJUSTAR LA POSICIÓN
                    if (nominatimResult && numero) {
                        console.log(`📍 Ajustando posición para el número ${numero}...`);
                        // ⭐ Intentar con la calle + número nuevamente pero con formato diferente
                        const variantes = [
                            `${calleSinNumero} #${numero}`,
                            `${calleSinNumero} No. ${numero}`,
                            `${calleSinNumero} ${numero}`,
                            `${calleSinNumero}, ${numero}`,
                            `${calleSinNumero} ${numero}, León, Guanajuato`
                        ];

                        for (const variante of variantes) {
                            if (variante !== direccion) {
                                console.log(`🔄 Intentando variante: "${variante}"`);
                                const varianteResult = await this.geocodeNominatim(variante);
                                if (varianteResult) {
                                    nominatimResult = varianteResult;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // ⭐ 4. SI FALLA, INTENTAR SOLO CON EL NÚMERO Y COLONIA
            if (!nominatimResult) {
                const palabras = direccion.split(' ');
                let numero = '';
                let colonia = '';

                for (const palabra of palabras) {
                    if (palabra.match(/^\d+$/)) {
                        numero = palabra;
                    } else if (palabra.length > 3) {
                        colonia += palabra + ' ';
                    }
                }
                colonia = colonia.trim();

                if (numero && colonia) {
                    console.log(`🔄 Intentando con número "${numero}" y colonia "${colonia}"`);
                    nominatimResult = await this.geocodeNominatim(`${colonia} ${numero}`);
                }
            }

            // ⭐ 5. SI FALLA, INTENTAR CON LA COLONIA SOLA
            if (!nominatimResult) {
                const palabras = direccion.split(' ');
                let colonia = palabras.slice(-2).join(' ');
                if (colonia && colonia.length > 3 && colonia !== direccion) {
                    console.log(`🔄 Intentando solo con colonia: "${colonia}"`);
                    nominatimResult = await this.geocodeNominatim(colonia);
                }
            }

            if (nominatimResult) {
                return {
                    success: true,
                    lat: nominatimResult.lat,
                    lng: nominatimResult.lng,
                    display_name: nominatimResult.display_name || direccion,
                    road: direccion
                };
            }

            return {
                success: false,
                error: 'No se encontró la dirección',
                message: 'Intenta con una dirección más específica'
            };
        } catch (error: any) {
            console.error('❌ Error en geocode:', error.message);
            return {
                success: false,
                error: 'Error al procesar la dirección',
                message: error.message
            };
        }
    }

    private async geocodeNominatim(direccion: string): Promise<{ lat: number; lng: number; display_name?: string } | null> {
        try {
            // ⭐ LIMPIAR LA DIRECCIÓN
            let cleanDireccion = direccion
                .replace(/COL\./g, '')
                .replace(/COLONIA/g, '')
                .replace(/FRACC\./g, '')
                .replace(/FRACCIONAMIENTO/g, '')
                .replace(/AV\./g, 'AVENIDA')
                .replace(/BLVD\./g, 'BOULEVARD')
                .replace(/\s+/g, ' ')
                .trim();

            // ⭐ SI LA DIRECCIÓN ES MUY CORTA, NO BUSCAR
            if (cleanDireccion.length < 3) {
                return null;
            }

            const query = encodeURIComponent(`${cleanDireccion}, León, Guanajuato, México`);
            const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1&countrycodes=mx`;

            console.log(`🌍 Nominatim: ${cleanDireccion.substring(0, 40)}...`);

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'es',
                    'User-Agent': 'SaludCasaApp/1.0'
                }
            });

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                console.log(`✅ Nominatim: ${lat}, ${lon} - ${result.display_name}`);
                return {
                    lat,
                    lng: lon,
                    display_name: result.display_name || direccion
                };
            }

            console.log(`❌ Nominatim: No encontrado para "${cleanDireccion}"`);
            return null;
        } catch (error) {
            console.error('❌ Error en Nominatim:', error);
            return null;
        }
    }
}