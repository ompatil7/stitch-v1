const express = require('express');
const {
  getRoadmaps,
  getRoadmap,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap
} = require('../controllers/roadmapController');

// Include quiz routes
const quizRouter = require('./quizRoutes');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:roadmapId/quizzes', quizRouter);

router
  .route('/')
  .get(getRoadmaps)
  .post(protect, authorize('admin', 'instructor'), createRoadmap);

router
  .route('/:id')
  .get(getRoadmap)
  .put(protect, authorize('admin', 'instructor'), updateRoadmap)
  .delete(protect, authorize('admin', 'instructor'), deleteRoadmap);

module.exports = router;