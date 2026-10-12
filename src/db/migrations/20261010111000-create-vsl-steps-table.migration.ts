import { QueryInterface } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS vsl_steps (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                run_id BIGINT UNSIGNED NOT NULL,

                step_key ENUM(
                    'VSL_D1_EMAIL',
                    'VSL_D3_EMAIL',
                    'VSL_D4_TASK',
                    'VSL_D7_EMAIL'
                ) NOT NULL,

                day_number TINYINT UNSIGNED NOT NULL,

                channel ENUM(
                    'email',
                    'internal'
                ) NOT NULL,

                due_at DATETIME NOT NULL,

                status ENUM(
                    'pending',
                    'processing',
                    'sent',
                    'skipped',
                    'cancelled',
                    'failed'
                ) NOT NULL DEFAULT 'pending',

                attempt_count INT UNSIGNED NOT NULL DEFAULT 0,

                claimed_at DATETIME NULL DEFAULT NULL,
                processed_at DATETIME NULL DEFAULT NULL,

                last_error TEXT NULL DEFAULT NULL,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT fk_vsl_steps_run_id
                    FOREIGN KEY (run_id)
                    REFERENCES vsl_runs(id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

                -- One run can contain each planned step only once.
                UNIQUE KEY uq_vsl_steps_run_step (
                    run_id,
                    step_key
                ),

                -- Helps the sweeper locate due steps efficiently.
                INDEX idx_vsl_steps_status_due_at (
                    status,
                    due_at
                ),

                INDEX idx_vsl_steps_run_status (
                    run_id,
                    status
                )
            );
        `);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS vsl_steps;
        `);
    }
};