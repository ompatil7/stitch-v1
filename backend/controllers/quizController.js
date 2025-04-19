const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('express-async-handler');
const Quiz = require('../models/Quiz');
const Roadmap = require('../models/Roadmap');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @route   GET /api/roadmaps/:roadmapId/quizzes
// @access  Public
exports.getQuizzes = asyncHandler(async (req, res, next) => {
  let query;

  if (req.params.roadmapId) {
    query = Quiz.find({ roadmapId: req.params.roadmapId });
  } else {
    query = Quiz.find().populate({
      path: 'roadmapId',
      select: 'title description'
    });
  }

  const quizzes = await query;

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes
  });
});

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Public
exports.getQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate({
    path: 'roadmapId',
    select: 'title description'
  });

  if (!quiz) {
    return next(
      new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: quiz
  });
});

// @desc    Create quiz
// @route   POST /api/roadmaps/:roadmapId/quizzes
// @access  Private (Admin/Instructor)
exports.createQuiz = asyncHandler(async (req, res, next) => {
  req.body.roadmapId = req.params.roadmapId;
  req.body.createdBy = req.user.id;

  const roadmap = await Roadmap.findById(req.params.roadmapId);

  if (!roadmap) {
    return next(
      new ErrorResponse(`No roadmap with the id of ${req.params.roadmapId}`, 404)
    );
  }

  // Make sure user is roadmap owner or admin
  if (roadmap.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a quiz to this roadmap`,
        401
      )
    );
  }

  const quiz = await Quiz.create(req.body);

  res.status(201).json({
    success: true,
    data: quiz
  });
});

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Admin/Instructor)
exports.updateQuiz = asyncHandler(async (req, res, next) => {
  let quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return next(
      new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is quiz owner or admin
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this quiz`,
        401
      )
    );
  }

  quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: quiz
  });
});

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Admin/Instructor)
exports.deleteQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return next(
      new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is quiz owner or admin
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this quiz`,
        401
      )
    );
  }

  await quiz.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});