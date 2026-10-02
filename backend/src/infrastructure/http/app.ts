import express from 'express';
import cookieParser from 'cookie-parser';
import { AuthController } from './controllers/AuthController';
import { AuthenticateUserUseCase } from '../../application/AuthenticateUserUseCase';
import { validate } from './middlewares/validate';
import { loginSchema } from '../../shared/validation/auth.schema';
import { PrismaUserRepository } from '../database/PrismaUserRepository';
import { PrismaFormConfigRepository } from '../database/PrismaFormConfigRepository';
import { PrismaSubmissionRepository } from '../database/PrismaSubmissionRepository';
import { PrismaFormReservationRepository } from '../database/PrismaFormReservationRepository';
import { PrismaAssetRepository } from '../database/PrismaAssetRepository';
import { PrismaCustomViewRepository } from '../database/PrismaCustomViewRepository';
import { LocalFileStorageService } from '../storage/LocalFileStorageService';
import { ManageFormConfigUseCase } from '../../application/ManageFormConfigUseCase';
import { SubmitFormUseCase } from '../../application/SubmitFormUseCase';
import { SoftDeleteSubmissionUseCase } from '../../application/SoftDeleteSubmissionUseCase';
import { GetSubmissionsUseCase } from '../../application/GetSubmissionsUseCase';
import { ReserveFormSpotUseCase } from '../../application/ReserveFormSpotUseCase';
import { GetFormConfigUseCase } from '../../application/GetFormConfigUseCase';
import { GetFormsUseCase } from '../../application/GetFormsUseCase';
import { GetCustomViewsUseCase } from '../../application/GetCustomViewsUseCase';
import { UploadAssetUseCase } from '../../application/UploadAssetUseCase';
import { ManageCustomViewUseCase } from '../../application/ManageCustomViewUseCase';
import { FormConfigController } from './controllers/FormConfigController';
import { SubmissionController } from './controllers/SubmissionController';
import { AssetController } from './controllers/AssetController';
import { CustomViewController } from './controllers/CustomViewController';
import { updateFormConfigSchema } from '../../shared/validation/formConfig.schema';
import { submitSchema } from '../../shared/validation/submission.schema';
import { createCustomViewSchema } from '../../shared/validation/customView.schema';
import { requireAuth } from './middlewares/auth';
import { Role } from '../../domain/user';
import jwt from 'jsonwebtoken';
import multer from 'multer';

import { PrismaClient } from '@prisma/client';

const app = express();

app.use(express.json());
app.use(cookieParser());

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit configured in multer as well

import { ChangePasswordUseCase } from '../../application/ChangePasswordUseCase';

import { prisma as prismaClient } from '../database/prisma';

const prismaUserRepository = new PrismaUserRepository(prismaClient); 
const authenticateUserUseCase = new AuthenticateUserUseCase(prismaUserRepository);
const changePasswordUseCase = new ChangePasswordUseCase(prismaUserRepository);
const authController = new AuthController(authenticateUserUseCase, changePasswordUseCase);

const prismaFormConfigRepository = new PrismaFormConfigRepository(prismaClient);
const manageFormConfigUseCase = new ManageFormConfigUseCase(prismaFormConfigRepository);
const getFormConfigUseCase = new GetFormConfigUseCase(prismaFormConfigRepository);
const getFormsUseCase = new GetFormsUseCase(prismaFormConfigRepository);
const formConfigController = new FormConfigController(manageFormConfigUseCase, getFormConfigUseCase, getFormsUseCase);

import { ManageUsersUseCase } from '../../application/users/ManageUsersUseCase';
import { UserController } from './controllers/UserController';
const manageUsersUseCase = new ManageUsersUseCase();
const userController = new UserController(manageUsersUseCase);

const prismaSubmissionRepository = new PrismaSubmissionRepository(prismaClient);
const prismaFormReservationRepository = new PrismaFormReservationRepository(prismaClient);

const submitFormUseCase = new SubmitFormUseCase(prismaFormConfigRepository, prismaSubmissionRepository, prismaFormReservationRepository);
const softDeleteUseCase = new SoftDeleteSubmissionUseCase(prismaSubmissionRepository);
const getSubmissionsUseCase = new GetSubmissionsUseCase(prismaFormConfigRepository, prismaSubmissionRepository);
const reserveFormSpotUseCase = new ReserveFormSpotUseCase(prismaFormConfigRepository, prismaFormReservationRepository, prismaSubmissionRepository);

const submissionController = new SubmissionController(submitFormUseCase, softDeleteUseCase, getSubmissionsUseCase, reserveFormSpotUseCase);

const prismaAssetRepository = new PrismaAssetRepository(prismaClient);
const localFileStorageService = new LocalFileStorageService();
const uploadAssetUseCase = new UploadAssetUseCase(prismaAssetRepository, localFileStorageService);
const assetController = new AssetController(uploadAssetUseCase);

const prismaCustomViewRepository = new PrismaCustomViewRepository(prismaClient);
const manageCustomViewUseCase = new ManageCustomViewUseCase(prismaCustomViewRepository);
const getCustomViewsUseCase = new GetCustomViewsUseCase(prismaCustomViewRepository);
const customViewController = new CustomViewController(manageCustomViewUseCase, getCustomViewsUseCase);

const optionalAuth = (req: any, res: any, next: any) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      req.user = { 
        id: decoded.userId, 
        role: decoded.role, 
        email: decoded.email,
        has_default_password: decoded.has_default_password
      };
    } catch (e) {}
  }
  next();
};

const apiRouter = express.Router();

apiRouter.post('/auth/login', validate(loginSchema), (req, res) => authController.login(req, res));
apiRouter.get('/auth/me', requireAuth(), (req, res) => authController.getMe(req, res));
apiRouter.post('/auth/change-password', requireAuth(), (req, res) => authController.changePassword(req, res));
apiRouter.get('/public-forms', (req, res) => formConfigController.getPublicList(req, res));
apiRouter.get('/forms', requireAuth(['SUPERADMIN', 'ADMIN', 'ANALYST']), (req, res) => formConfigController.getAll(req, res));
apiRouter.get('/forms/:form_identifier/config', (req, res) => formConfigController.getConfig(req, res));
apiRouter.patch('/forms/:form_identifier/config', requireAuth(['SUPERADMIN', 'ADMIN'], true), validate(updateFormConfigSchema), (req, res) => formConfigController.updateConfig(req, res));
apiRouter.post('/forms/:form_identifier/reserve', (req, res) => submissionController.reserve(req, res));
apiRouter.post('/forms/:form_identifier/submissions', optionalAuth, validate(submitSchema), (req, res) => submissionController.submit(req, res));
apiRouter.get('/forms/:form_identifier/submissions', requireAuth(['SUPERADMIN', 'ADMIN', 'ANALYST'], true), (req, res) => submissionController.getSubmissions(req, res));
apiRouter.delete('/forms/:form_identifier/submissions/:submission_id', requireAuth(['SUPERADMIN', 'ADMIN'], true), (req, res) => submissionController.softDelete(req, res));

apiRouter.post('/assets', optionalAuth, upload.single('file'), (req, res) => assetController.upload(req, res));

apiRouter.post('/custom-views', requireAuth(['SUPERADMIN', 'ADMIN']), validate(createCustomViewSchema), (req, res) => customViewController.create(req, res));
apiRouter.get('/forms/:form_identifier/custom-views', requireAuth(['SUPERADMIN', 'ADMIN', 'ANALYST'], true), (req, res) => customViewController.getCustomViews(req, res));

apiRouter.get('/users', requireAuth(['SUPERADMIN']), (req, res) => userController.getAll(req, res));
apiRouter.post('/users', requireAuth(['SUPERADMIN']), (req, res) => userController.create(req, res));
apiRouter.delete('/users/:id', requireAuth(['SUPERADMIN']), (req, res) => userController.delete(req, res));
apiRouter.patch('/users/:id/password', requireAuth(['SUPERADMIN']), (req, res) => userController.changePassword(req, res));
apiRouter.patch('/users/:id/role', requireAuth(['SUPERADMIN']), (req, res) => userController.updateRole(req, res));
apiRouter.post('/users/:id/access', requireAuth(['SUPERADMIN']), (req, res) => userController.setFormAccess(req, res));

app.use('/api', apiRouter);

// Serve static frontend files in production
import path from 'path';
import { fileURLToPath } from 'url';

// Using tsx or node with ES modules requires this for __dirname
// But since we are CommonJS, we can just use __dirname
const frontendDistPath = path.join(__dirname, '../../../frontend/dist');
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    next();
  }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred'
    }
  });
});

export default app;
