const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a module title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a module description'],
  },
  duration: {
    type: String,
    required: [true, 'Please specify the module duration'],
  },
  order: {
    type: Number,
    required: [true, 'Please specify the module order'],
  }
});

const DayContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  videoUrl: {
    type: String,
  },
  articleSummary: {
    type: String,
  },
  codingChallenge: {
    type: String,
  },
  supplementalResources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['blog', 'video', 'guide', 'article', 'other']
    }
  }]
});

const WeekSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: [true, 'Please specify week number'],
  },
  title: {
    type: String,
    required: [true, 'Please add a week title'],
    trim: true,
  },
  overview: {
    type: String,
    required: [true, 'Please add a week overview'],
  },
  days: [DayContentSchema],
  weekendProject: {
    title: String,
    description: String,
    requirements: [String],
    stretchGoals: [String]
  }
});

const RoadmapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    unique: true,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  placementQuiz: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quiz'
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'AI Tools',
      'Web Development',
      'Mobile Development',
      'Data Science',
      'Machine Learning',
      'DevOps',
      'Other'
    ]
  },
  level: {
    type: String,
    required: [true, 'Please add a level'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  duration: {
    type: String,
    required: [true, 'Please add duration']
  },
  weeks: [WeekSchema],
  prerequisites: [String],
  tags: [String],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: false
  }
});

// Create roadmap slug from the title
RoadmapSchema.pre('save', function(next) {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  next();
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);