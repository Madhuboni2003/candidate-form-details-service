import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute
} from 'sequelize';

import { VslRunStatus } from '../../utils/enums/VslRunStatus';
import { VslStopReason } from '../../utils/enums/VslStopReason';
import Candidate from './Candidate.model';
import CandidateSubmission from './CandidateSubmission.model';
import sequelize from './sequelize';

class VslRun extends Model<InferAttributes<VslRun>, InferCreationAttributes<VslRun>> {
    declare id: CreationOptional<number>;
    declare candidateId: ForeignKey<Candidate['id']>;
    declare submissionId: ForeignKey<CandidateSubmission['id']>;
    declare formSlug: string;
    declare anchorAt: Date;
    declare stepsSent: CreationOptional<number>;
    declare status: CreationOptional<VslRunStatus>;
    declare stopReason: CreationOptional<VslStopReason | null>;
    declare activeCandidateId: CreationOptional<number | null>;
    declare priorityFlag: CreationOptional<boolean>;
    declare lastStepAt: CreationOptional<Date | null>;
    declare completedAt: CreationOptional<Date | null>;
    declare stoppedAt: CreationOptional<Date | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare candidate?: NonAttribute<Candidate>;
    declare submission?: NonAttribute<CandidateSubmission>;
}

VslRun.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    candidateId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: Candidate, key: 'id' }
    },
    submissionId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: CandidateSubmission, key: 'id' }
    },
    formSlug: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    anchorAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    stepsSent: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM(...Object.values(VslRunStatus)),
        allowNull: false,
        defaultValue: VslRunStatus.ACTIVE
    },
    stopReason: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null
    },
    activeCandidateId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        unique: true,
        defaultValue: null
    },
    priorityFlag: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    lastStepAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    stoppedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'vsl_runs',
    underscored: true,
    timestamps: true,
    sequelize
});

export default VslRun;