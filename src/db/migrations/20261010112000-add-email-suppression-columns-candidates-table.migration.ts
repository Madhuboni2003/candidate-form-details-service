import { QueryInterface } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            ALTER TABLE candidates
                ADD COLUMN email_unsubscribed_at DATETIME NULL DEFAULT NULL,
                ADD COLUMN opted_out_at DATETIME NULL DEFAULT NULL;
        `);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            ALTER TABLE candidates
                DROP COLUMN email_unsubscribed_at,
                DROP COLUMN opted_out_at;
        `);
    }
};