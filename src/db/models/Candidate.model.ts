import {
    Association,
    CreationOptional,
    DataTypes,
    HasManyAddAssociationMixin,
    HasManyAddAssociationsMixin,
    HasManyCountAssociationsMixin,
    HasManyCreateAssociationMixin,
    HasManyGetAssociationsMixin,
    HasManyHasAssociationMixin,
    HasManyHasAssociationsMixin,
    HasManyRemoveAssociationMixin,
    HasManyRemoveAssociationsMixin,
    HasManySetAssociationsMixin,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from 'sequelize';

import CandidateSubmission from './CandidateSubmission.model';
import sequelize from './sequelize';

class Candidate extends Model<InferAttributes<Candidate>, InferCreationAttributes<Candidate>> {
    declare id: CreationOptional<number>;
    declare public_id: CreationOptional<string>;
    declare fullName: string;
    declare email: string;
    declare phone: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date | null>;
    declare emailUnsubscribedAt: CreationOptional<Date | null>;
    declare optedOutAt: CreationOptional<Date | null>;
    declare submissions?: NonAttribute<CandidateSubmission[]>;

    // HasMany CandidateSubmission mixins
    declare getSubmissions: HasManyGetAssociationsMixin<CandidateSubmission>;
    declare countSubmissions: HasManyCountAssociationsMixin;
    declare hasSubmission: HasManyHasAssociationMixin<CandidateSubmission, string>;
    declare hasSubmissions: HasManyHasAssociationsMixin<CandidateSubmission, string>;
    declare addSubmission: HasManyAddAssociationMixin<CandidateSubmission, string>;
    declare addSubmissions: HasManyAddAssociationsMixin<CandidateSubmission, string>;
    declare setSubmissions: HasManySetAssociationsMixin<CandidateSubmission, string>;
    declare removeSubmission: HasManyRemoveAssociationMixin<CandidateSubmission, string>;
    declare removeSubmissions: HasManyRemoveAssociationsMixin<CandidateSubmission, string>;
    declare createSubmission: HasManyCreateAssociationMixin<CandidateSubmission, 'candidateId'>;

    declare static associations: {
        submissions: Association<Candidate, CandidateSubmission>;
    };
}

Candidate.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },

    public_id: {
        type: DataTypes.UUID,
        defaultValue: () => crypto.randomUUID(),
        allowNull: false
    },

    fullName: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },

    email: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    phone: {
        type: DataTypes.STRING(30),
        allowNull: false
    },

    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },

    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },

    emailUnsubscribedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },

    optedOutAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },

    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
}, {
    tableName: 'candidates',
    underscored: true,
    timestamps: true,
    sequelize
});

export default Candidate;