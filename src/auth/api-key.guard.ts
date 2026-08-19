// src/auth/api-key.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    // ⭐ LISTA DE API KEYS VÁLIDAS
    private validApiKeys = [
        'SALUD_CASA_API_KEY_123456789', // ⭐ Para el sistema de jefes
        // Puedes agregar más si es necesario
    ];

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        // Buscar API Key en los headers (puede ser x-api-key o api-key)
        const apiKey = request.headers['x-api-key'] || request.headers['api-key'];

        // Si no hay API Key
        if (!apiKey) {
            throw new UnauthorizedException('Se requiere API Key para acceder a este recurso');
        }

        // Validar API Key
        if (!this.validApiKeys.includes(apiKey)) {
            throw new UnauthorizedException('API Key inválida');
        }

        return true;
    }
}