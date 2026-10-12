import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from 'sequelize';

import { VslRunStatus } from '../../utils/enums/VslRunStatus';
import { VslStopReason } from '../../utils/enums/VslStopReason';

import Candidate from './Candidate.model';
import CandidateSubmission from './CandidateSubmission.model';
import sequelize from './sequelize';

class VslRun extends Model<
    InferAttributes<VslRun>,
    InferCreationAttributes<VslRun>
> {
    declare id: CreationOptional<number>;

    declare candidateId: ForeignKey<Candidate['id']>;
    declare submissionId: ForeignKey<CandidateSubmission['id']>;

    declare formSlug: string;
    declare anchorAt: Date;

    declare status: CreationOptional<VslRunStatus>;
    declare stopReason: CreationOptional<VslStopReason | null>;

    declare holdUntil: CreationOptional<Date | null>;
    declare priorityFlag: CreationOptional<boolean>;

    declare completedAt: CreationOptional<Date | null>;
    declare stoppedAt: CreationOptional<Date | null>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare candidate?: NonAttribute<Candidate>;
    declare submission?: NonAttribute<CandidateSubmission>;

    declare activeCandidateId: CreationOptional<number | null>;
}

VslRun.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },

        candidateId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: Candidate,
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        activeCandidateId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
        },

        submissionId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: CandidateSubmission,
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },

        formSlug: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        anchorAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        status: {
            type: DataTypes.ENUM(...Object.values(VslRunStatus)),
            allowNull: false,
            defaultValue: VslRunStatus.ACTIVE,
        },

        stopReason: {
            type: DataTypes.ENUM(...Object.values(VslStopReason)),
            allowNull: true,
            defaultValue: null,
        },

        holdUntil: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },

        priorityFlag: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },

        stoppedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'vsl_runs',
        underscored: true,
        timestamps: true,
        sequelize,
    }
);

export default VslRun;