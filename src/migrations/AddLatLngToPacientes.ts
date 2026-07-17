import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLatLngToPacientesXXXXXXXXXX implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('pacientes', [
            new TableColumn({
                name: 'lat',
                type: 'decimal',
                precision: 10,
                scale: 8,
                isNullable: true,
            }),
            new TableColumn({
                name: 'lng',
                type: 'decimal',
                precision: 11,
                scale: 8,
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('pacientes', 'lat');
        await queryRunner.dropColumn('pacientes', 'lng');
    }
}