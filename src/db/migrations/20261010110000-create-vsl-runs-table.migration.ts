import { QueryInterface } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS vsl_runs (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                candidate_id BIGINT UNSIGNED NOT NULL,
                submission_id BIGINT UNSIGNED NOT NULL,
                form_slug VARCHAR(100) NOT NULL,

                anchor_at DATETIME NOT NULL,

                status ENUM(
                    'active',
                    'completed',
                    'stopped'
                ) NOT NULL DEFAULT 'active',

                stop_reason ENUM(
                    'form_submitted',
                    'booked',
                    'converted',
                    'submission_cancelled',
                    'opted_out',
                    'unsubscribed',
                    'not_interested',
                    'won',
                    'enrolled',
                    'later_stage',
                    'other'
                ) NULL DEFAULT NULL,

                hold_until DATETIME NULL DEFAULT NULL,
                priority_flag TINYINT(1) NOT NULL DEFAULT 0,

                completed_at DATETIME NULL DEFAULT NULL,
                stopped_at DATETIME NULL DEFAULT NULL,

                -- Set to candidate_id while the run is active.
                -- Set to NULL when the run is completed or stopped.
                -- This is a normal column, not a generated column.
                active_candidate_id BIGINT UNSIGNED NULL DEFAULT NULL,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT fk_vsl_runs_candidate_id
                    FOREIGN KEY (candidate_id)
                    REFERENCES candidates(id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

                CONSTRAINT fk_vsl_runs_submission_id
                    FOREIGN KEY (submission_id)
                    REFERENCES candidate_submissions(id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

                -- One run per submission.
                UNIQUE KEY uq_vsl_runs_submission_id (submission_id),

                -- At most one active run per candidate.
                UNIQUE KEY uq_vsl_runs_active_candidate (
                    active_candidate_id
                ),

                INDEX idx_vsl_runs_status_hold_until (
                    status,
                    hold_until
                ),

                INDEX idx_vsl_runs_candidate_id_status (
                    candidate_id,
                    status
                )
            );
        `);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS vsl_runs;
        `);
    }
};