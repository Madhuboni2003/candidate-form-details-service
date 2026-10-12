import cors from 'cors';
import express from 'express';

import logger from './configs/logger.config';
import { frontendConfig, serverConfig } from './configs/server.config';
import { bookingReminderCron } from './crons/bookingReminder.cron';
import { vslCron } from './crons/vsl.cron';
import setupAssociations from './db/models/associations';
import sequelize from './db/models/sequelize';
import { attachCorrelationIdMiddleware } from './middlewares/correlation.middleware';
import { appErrorHandler, genericErrorHandler } from './middlewares/error.middleware';
import apiRouter from './routes';


const app = express();

app.use(cors({
    origin: [frontendConfig.ADMIN_FRONTEND_URL, frontendConfig.CANDIDATE_FRONTEND_URL],
    credentials: true
}));

app.use(express.json());

app.use(attachCorrelationIdMiddleware);

app.use('/api', apiRouter);

app.use(appErrorHandler);
app.use(genericErrorHandler);

app.listen(serverConfig.PORT, async () => {
    logger.info(`Server is running on http://localhost:${serverConfig.PORT}`);
    setupAssociations();
    logger.info('All the associations are successfully set');
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully', {error: 'new error'});
    bookingReminderCron();
    vslCron();
});