// src/services/aws-geocode.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { LocationClient, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';
import { AWS_CONFIG } from '../config/aws.config';

@Injectable()
export class AwsGeocodeService {
    private readonly logger = new Logger(AwsGeocodeService.name);
    private client: LocationClient;

    constructor() {
        this.client = new LocationClient({
            region: AWS_CONFIG.region,
        });
        this.logger.log('✅ AWS Location Service inicializado');
    }

    async geocodeAddress(direccion: string): Promise<{ lat: number; lng: number; display_name?: string } | null> {
        if (!direccion || direccion.trim().length === 0) {
            this.logger.warn('⚠️ Dirección vacía');
            return null;
        }

        try {
            const query = `${direccion}, León, Guanajuato, México`;
            this.logger.log(`🔍 Geocodificando: ${query}`);

            const params = {
                IndexName: 'default',
                Text: query,
                MaxResults: 1,
                FilterCountries: ['MEX'],
                Language: 'es',
            };

            const command = new SearchPlaceIndexForTextCommand(params);
            const response = await this.client.send(command);

            if (response.Results && response.Results.length > 0) {
                const result = response.Results[0];

                if (result.Place && result.Place.Geometry && result.Place.Geometry.Point) {
                    const point = result.Place.Geometry.Point;
                    const coords = {
                        lat: point[1],
                        lng: point[0],
                        display_name: result.Place.Label || direccion,
                    };
                    this.logger.log(`✅ Encontrado: ${coords.lat}, ${coords.lng}`);
                    return coords;
                }
            }

            this.logger.warn(`❌ No se encontró: ${direccion}`);
            return null;
        } catch (error: any) {
            this.logger.error(`❌ Error en AWS Geocode: ${error.message}`);
            return null;
        }
    }
}