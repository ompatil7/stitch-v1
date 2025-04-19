const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('express-async-handler');
const UserProgress = require('../models/UserProgress');
const Roadmap = require('../models/Roadmap');
const Quiz = require('../models/Quiz');

// @desc    Get all progress records for logged in user
// @route   GET /api/progress
// @access  Private
exports.getMyProgress = asyncHandler(async (req, res, next) => {
  const progress = await UserProgress.find({ user: req.user.id })
    .populate({
      path: 'roadmap',
      select: 'title description level duration'
    });

  res.status(200).json({
    success: true,
    count: progress.length,
    data: progress
  });
});

// @desc    Get single progress record
// @route   GET /api/progress/:roadmapId
// @access  Private
exports.getProgressForRoadmap = asyncHandler(async (req, res, next) => {
  const progress = await UserProgress.findOne({
    user: req.user.id,
    roadmap: req.params.roadmapId
  }).populate({
    path: 'roadmap',
    select: 'title description weeks'
  });

  if (!progress) {
    return next(
      new ErrorResponse(`No progress found for this roadmap`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: progress
  });
});

// @desc    Start a roadmap (create progress record)
// @route   POST /api/progress/:roadmapId/start
// @access  Private
exports.startRoadmap = asyncHandler(async (req, res, next) => {
  const roadmap = await Roadmap.findById(req.params.roadmapId);

  if (!roadmap) {
    return next(
      new ErrorResponse(`Roadmap not found with id of ${req.params.roadmapId}`, 404)
    );
  }

  // Check if user already has a progress record for this roadmap
  const existingProgress = await UserProgress.findOne({
    user: req.user.id,
    roadmap: req.params.roadmapId
  });

  if (existingProgress) {
    return next(
      new ErrorResponse(`You've already started this roadmap`, 400)
    );
  }

  // Create progress record
  const progress = await UserProgress.create({
    user: req.user.id,
    roadmap: req.params.roadmapId
  });

  res.status(201).json({
    success: true,
    data: progress
  });
});

// @desc    Mark a day as completed
// @route   PUT /api/progress/:roadmapId/complete-day/:weekNumber/:dayNumber
// @access  Private
exports.completeDay = asyncHandler(async (req, res, next) => {
  const { weekNumber, dayNumber } = req.params;
  
  // Find the progress record
  let progress = await UserProgress.findOne({
    user: req.user.id,
    roadmap: req.params.roadmapId
  });

  if (!progress) {
    return next(
      new ErrorResponse(`No progress found for this roadmap`, 404)
    );
  }

  // Check if day already marked as completed
  const dayAlreadyCompleted = progress.completedDays.some(
    day => day.weekNumber === parseInt(weekNumber) && day.dayNumber === parseInt(dayNumber)
  );

  if (dayAlreadyCompleted) {
    return next(
      new ErrorResponse(`This day has already been marked as completed`, 400)
    );
  }

  // Add day to completedDays
  progress.completedDays.push({
    weekNumber: parseInt(weekNumber),
    dayNumber: parseInt(dayNumber),
    completedAt: new Date()
  });

  // Update last accessed
  progress.lastAccessed = new Date();

  // Calculate new completion percentage
  const roadmap = await Roadmap.findById(req.params.roadmapId);
  const totalDays = roadmap.weeks.reduce((total, week) => {
    return total + week.days.length;
  }, 0);
  
  progress.completionPercentage = (progress.completedDays.length / totalDays) * 100;

  // Check if all days in week are completed
  const weekDays = roadmap.weeks.find(week => week.weekNumber === parseInt(weekNumber)).days;
  const completedWeekDays = progress.completedDays.filter(day => day.weekNumber === parseInt(weekNumber));
  
  if (weekDays.length === completedWeekDays.length && 
      !progress.completedWeeks.some(week => week.weekNumber === parseInt(weekNumber))) {
    // Add week to completedWeeks
    progress.completedWeeks.push({
      weekNumber: parseInt(weekNumber),
      completedAt: new Date()
    });
  }

  // Check if all weeks are completed
  if (progress.completedWeeks.length === roadmap.weeks.length) {
    progress.isCompleted = true;
  }

  await progress.save();

  res.status(200).json({
    success: true,
    data: progress
  });
});

// @desc    Submit quiz
// @route   POST /api/progress/:roadmapId/submit-quiz/:quizId
// @access  Private
exports.submitQuiz = asyncHandler(async (req, res, next) => {
  const { answers } = req.body;
  
  if (!answers || !Array.isArray(answers)) {
    return next(new ErrorResponse('Please provide quiz answers', 400));
  }

  // Find the quiz
  const quiz = await Quiz.findById(req.params.quizId);
  
  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found`, 404));
  }

  // Find the progress record
  let progress = await UserProgress.findOne({
    user: req.user.id,
    roadmap: req.params.roadmapId
  });

  if (!progress) {
    return next(new ErrorResponse(`No progress found for this roadmap`, 404));
  }

  // Check if quiz already attempted
  const quizAlreadyAttempted = progress.quizAttempts.some(
    attempt => attempt.quiz.toString() === req.params.quizId
  );

  if (quizAlreadyAttempted) {
    return next(new ErrorResponse(`You've already submitted this quiz`, 400));
  }

  // Calculate score
  let score = 0;
  const processedAnswers = [];

  for (const answer of answers) {
    const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
    
    if (!question) continue;
    
    let isCorrect = false;
    
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      // Check if selected answers match correct answers
      const correctAnswerIds = question.answers
        .filter(a => a.isCorrect)
        .map(a => a._id.toString());
      
      const selectedAnswerIds = answer.selectedAnswers.map(a => a.toString());
      
      isCorrect = correctAnswerIds.length === selectedAnswerIds.length &&
        correctAnswerIds.every(id => selectedAnswerIds.includes(id));
    }
    
    if (isCorrect) {
      score += question.points;
    }
    
    processedAnswers.push({
      questionId: answer.questionId,
      selectedAnswers: answer.selectedAnswers,
      isCorrect
    });
  }

  // Calculate percentage score
  const totalPoints = quiz.questions.reduce((total, question) => total + question.points, 0);
  const percentageScore = (score / totalPoints) * 100;
  
  // Determine if passed
  const passed = percentageScore >= quiz.passingScore;

  // Add quiz attempt to progress record
  progress.quizAttempts.push({
    quiz: req.params.quizId,
    score: percentageScore,
    passed,
    answers: processedAnswers,
    completedAt: new Date()
  });

  // Update last accessed
  progress.lastAccessed = new Date();

  await progress.save();

  res.status(200).json({
    success: true,
    data: {
      score: percentageScore,
      passed,
      totalPoints,
      earnedPoints: score
    }
  });
});

// @desc    Submit project
// @route   POST /api/progress/:roadmapId/submit-project/:weekNumber
// @access  Private
exports.submitProject = asyncHandler(async (req, res, next) => {
  const { submissionUrl } = req.body;
  
  if (!submissionUrl) {
    return next(new ErrorResponse('Please provide a submission URL', 400));
  }

  // Find the progress record
  let progress = await UserProgress.findOne({
    user: req.user.id,
    roadmap: req.params.roadmapId
  });

  if (!progress) {
    return next(new ErrorResponse(`No progress found for this roadmap`, 404));
  }

  // Check if project already submitted for this week
  const projectAlreadySubmitted = progress.completedProjects.some(
    project => project.weekNumber === parseInt(req.params.weekNumber)
  );

  if (projectAlreadySubmitted) {
    // Update existing project submission
    progress.completedProjects = progress.completedProjects.map(project => {
      if (project.weekNumber === parseInt(req.params.weekNumber)) {
        return {
          ...project,
          submissionUrl,
          completedAt: new Date()
        };
      }
      return project;
    });
  } else {
    // Add new project submission
    progress.completedProjects.push({
      weekNumber: parseInt(req.params.weekNumber),
      submissionUrl,
      completedAt: new Date()
    });
  }

  // Update last accessed
  progress.lastAccessed = new Date();

  await progress.save();

  res.status(200).json({
    success: true,
    data: progress.completedProjects.find(
      project => project.weekNumber === parseInt(req.params.weekNumber)
    )
  });
});

// @desc    Get all progress records (admin only)
// @route   GET /api/progress/admin/all
// @access  Private (Admin)
exports.getAllProgress = asyncHandler(async (req, res, next) => {
  const progress = await UserProgress.find()
    .populate({
      path: 'user',
      select: 'name email'
    })
    .populate({
      path: 'roadmap',
      select: 'title level'
    });

  res.status(200).json({
    success: true,
    count: progress.length,
    data: progress
  });
});