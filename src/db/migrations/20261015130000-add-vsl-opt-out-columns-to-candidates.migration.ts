import { QueryInterface } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface): Promise<void> {
        // Track when and why a candidate opted out of follow-up messages.
        await queryInterface.sequelize.query(`
            ALTER TABLE candidates
                ADD COLUMN opted_out_at DATETIME NULL,
                ADD COLUMN opt_out_reason VARCHAR(64) NULL;
        `);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            ALTER TABLE candidates
                DROP COLUMN opt_out_reason,
                DROP COLUMN opted_out_at;
        `);
    }
};