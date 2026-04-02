import { Router } from 'express';
import { requireAccessToken, requireAccessTokenOrDocToken } from '../../core/http/auth.js';
import {
  pomonHealthController,
  pomonPrfByIdController,
  pomonPrfByIdWithItemsController,
  pomonPrfDocumentsController,
  pomonPrfDocumentsDownloadController,
  pomonPrfDocumentsDownloadLinkController,
  pomonPrfDocumentsViewController,
  pomonPrfDocumentsViewLinkController,
  pomonPrfFilesController,
  pomonPrfFilesUploadController,
  pomonPrfsController,
  pomonPrfsFiltersStatusController,
  pomonPrfsSearchController,
  pomonPrfsWithItemsController,
  pomonUpdatePrfItemController,
} from './pomon.controller.js';

export function createPomonRouter() {
  const router = Router();
  router.get('/api/pomon/health', requireAccessToken, pomonHealthController);
  router.get('/api/pomon/prfs', requireAccessToken, pomonPrfsController);
  router.get('/api/pomon/prfs/with-items', requireAccessToken, pomonPrfsWithItemsController);
  router.get('/api/pomon/prfs/filters/status', requireAccessToken, pomonPrfsFiltersStatusController);
  router.get('/api/pomon/prfs/search', requireAccessToken, pomonPrfsSearchController);
  router.get('/api/pomon/prfs/:id', requireAccessToken, pomonPrfByIdController);
  router.get('/api/pomon/prfs/:id/with-items', requireAccessToken, pomonPrfByIdWithItemsController);
  router.put('/api/pomon/prfs/items/:itemId', requireAccessToken, pomonUpdatePrfItemController);
  router.get('/api/pomon/prf-files/:prfId', requireAccessToken, pomonPrfFilesController);
  router.post('/api/pomon/prf-files/:prfId/upload', requireAccessToken, pomonPrfFilesUploadController);
  router.get('/api/pomon/prf-documents/documents/:prfId', requireAccessToken, pomonPrfDocumentsController);
  router.get('/api/pomon/prf-documents/view-link/:fileId', requireAccessToken, pomonPrfDocumentsViewLinkController);
  router.get('/api/pomon/prf-documents/download-link/:fileId', requireAccessToken, pomonPrfDocumentsDownloadLinkController);
  router.get('/api/pomon/prf-documents/view/:fileId', requireAccessTokenOrDocToken, pomonPrfDocumentsViewController);
  router.get('/api/pomon/prf-documents/download/:fileId', requireAccessTokenOrDocToken, pomonPrfDocumentsDownloadController);
  return router;
}

