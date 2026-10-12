import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from 'sequelize';

import { VslStepChannel } from '../../utils/enums/VslStepChannel';
import { VslStepKey } from '../../utils/enums/VslStepKey';
import { VslStepStatus } from '../../utils/enums/VslStepStatus';

import VslRun from './VslRun.model';
import sequelize from './sequelize';

class VslStep extends Model<
    InferAttributes<VslStep>,
    InferCreationAttributes<VslStep>
> {
    declare id: CreationOptional<number>;
    declare runId: ForeignKey<VslRun['id']>;

    declare stepKey: VslStepKey;
    declare dayNumber: number;
    declare channel: VslStepChannel;
    declare dueAt: Date;

    declare status: CreationOptional<VslStepStatus>;
    declare attemptCount: CreationOptional<number>;

    declare claimedAt: CreationOptional<Date | null>;
    declare processedAt: CreationOptional<Date | null>;
    declare lastError: CreationOptional<string | null>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare run?: NonAttribute<VslRun>;
}

VslStep.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },

        runId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: VslRun,
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },

        stepKey: {
            type: DataTypes.ENUM(...Object.values(VslStepKey)),
            allowNull: false,
        },

        dayNumber: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
        },

        channel: {
            type: DataTypes.ENUM(...Object.values(VslStepChannel)),
            allowNull: false,
        },

        dueAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        status: {
            type: DataTypes.ENUM(...Object.values(VslStepStatus)),
            allowNull: false,
            defaultValue: VslStepStatus.PENDING,
        },

        attemptCount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },

        claimedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },

        processedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },

        lastError: {
            type: DataTypes.TEXT,
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
        tableName: 'vsl_steps',
        underscored: true,
        timestamps: true,
        sequelize,
    }
);

export default VslStep;