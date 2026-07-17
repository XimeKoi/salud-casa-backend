// src/config/aws.config.ts

export const AWS_CONFIG = {
    region: process.env.AWS_REGION || 'us-east-1',
    apiKey: process.env.AWS_API_KEY || '',
};