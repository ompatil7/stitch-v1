const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please add answer text']
  },
  isCorrect: {
    type: Boolean,
    required: [true, 'Please specify if the answer is correct']
  }
});

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please add question text']
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'coding'],
    default: 'multiple-choice'
  },
  answers: [AnswerSchema],
  codeSnippet: {
    type: String
  },
  explanation: {
    type: String
  },
  points: {
    type: Number,
    default: 1
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  roadmapId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Roadmap',
    required: true
  },
  weekNumber: {
    type: Number,
    required: [true, 'Please specify week number']
  },
  dayNumber: {
    type: Number
  },
  questions: [QuestionSchema],
  timeLimit: {
    type: Number, // in minutes
    default: 15
  },
  passingScore: {
    type: Number,
    default: 70 // percentage
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);