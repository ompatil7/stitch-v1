const express = require('express');
const {
  getMyProgress,
  getProgressForRoadmap,
  startRoadmap,
  completeDay,
  submitQuiz,
  submitProject,
  getAllProgress
} = require('../controllers/progressController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply middleware to all routes
router.use(protect);

router.route('/').get(getMyProgress);
router.route('/admin/all').get(authorize('admin'), getAllProgress);
router.route('/:roadmapId').get(getProgressForRoadmap);
router.route('/:roadmapId/start').post(startRoadmap);
router.route('/:roadmapId/complete-day/:weekNumber/:dayNumber').put(completeDay);
router.route('/:roadmapId/submit-quiz/:quizId').post(submitQuiz);
router.route('/:roadmapId/submit-project/:weekNumber').post(submitProject);

module.exports = router;