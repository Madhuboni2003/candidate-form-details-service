import { QueryInterface } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query(`
            CREATE TABLE vsl_runs (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                candidate_id BIGINT UNSIGNED NOT NULL,
                submission_id BIGINT UNSIGNED NOT NULL,
                form_slug VARCHAR(255) NOT NULL,
                anchor_at DATETIME NOT NULL,
                steps_sent INT UNSIGNED NOT NULL DEFAULT 0,
                status ENUM('active', 'completed', 'stopped') NOT NULL DEFAULT 'active',
                stop_reason VARCHAR(64) NULL,
                active_candidate_id BIGINT UNSIGNED NULL,
                priority_flag TINYINT(1) NOT NULL DEFAULT 0,
                last_step_at DATETIME NULL,
                completed_at DATETIME NULL,
                stopped_at DATETIME NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_vsl_runs_submission_id (submission_id),
                UNIQUE KEY uq_vsl_runs_active_candidate_id (active_candidate_id),
                KEY idx_vsl_runs_status_anchor_at (status, anchor_at),
                CONSTRAINT fk_vsl_runs_candidate
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
                CONSTRAINT fk_vsl_runs_submission
                    FOREIGN KEY (submission_id) REFERENCES candidate_submissions(id)
            );
        `);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS vsl_runs;');
    }
};