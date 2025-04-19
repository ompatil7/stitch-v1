const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quiz',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedAnswers: [mongoose.Schema.Types.ObjectId],
    isCorrect: Boolean
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  roadmap: {
    type: mongoose.Schema.ObjectId,
    ref: 'Roadmap',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  userDailyHours: {
    type: Number,
    default: 2,
    min: 0.5,
    max: 12
  },
  userTotalDays: {
    type: Number,
    default: 30,
    min: 1
  },
  initialCompletedDays: [{
    weekNumber: Number,
    dayNumber: Number,
    completedAt: Date
  }],
  completedWeeks: [{
    weekNumber: Number,
    completedAt: Date
  }],
  completedDays: [{
    weekNumber: Number,
    dayNumber: Number,
    completedAt: Date
  }],
  quizAttempts: [QuizAttemptSchema],
  completedProjects: [{
    weekNumber: Number,
    submissionUrl: String,
    feedback: String,
    grade: String,
    completedAt: Date
  }],
  completionPercentage: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  certificate: {
    issued: {
      type: Boolean,  
      default: false
    },
    issuedAt: Date,
    certificateUrl: String
  }
});

// Create a compound index to ensure a user can only have one progress record per roadmap
UserProgressSchema.index({ user: 1, roadmap: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);