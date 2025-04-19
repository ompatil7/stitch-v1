const express = require('express');
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz
} = require('../controllers/quizController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(getQuizzes)
  .post(protect, authorize('admin', 'instructor'), createQuiz);

router
  .route('/:id')
  .get(getQuiz)
  .put(protect, authorize('admin', 'instructor'), updateQuiz)
  .delete(protect, authorize('admin', 'instructor'), deleteQuiz);

module.exports = router;