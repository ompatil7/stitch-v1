const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('express-async-handler');
const Roadmap = require('../models/Roadmap');

// @desc    Get all roadmaps
// @route   GET /api/roadmaps
// @access  Public
exports.getRoadmaps = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  let query = Roadmap.find(JSON.parse(queryStr)).populate('createdBy', 'name');

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Roadmap.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const roadmaps = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: roadmaps.length,
    pagination,
    data: roadmaps
  });
});

// @desc    Get single roadmap
// @route   GET /api/roadmaps/:id
// @access  Public
exports.getRoadmap = asyncHandler(async (req, res, next) => {
  const roadmap = await Roadmap.findById(req.params.id).populate('createdBy', 'name');

  if (!roadmap) {
    return next(
      new ErrorResponse(`Roadmap not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: roadmap
  });
});

// @desc    Create new roadmap
// @route   POST /api/roadmaps
// @access  Private (Admin/Instructor)
exports.createRoadmap = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const roadmap = await Roadmap.create(req.body);

  res.status(201).json({
    success: true,
    data: roadmap
  });
});

// @desc    Update roadmap
// @route   PUT /api/roadmaps/:id
// @access  Private (Admin/Instructor)
exports.updateRoadmap = asyncHandler(async (req, res, next) => {
  let roadmap = await Roadmap.findById(req.params.id);

  if (!roadmap) {
    return next(
      new ErrorResponse(`Roadmap not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is roadmap owner or admin
  if (roadmap.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this roadmap`,
        401
      )
    );
  }

  roadmap = await Roadmap.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: roadmap
  });
});

// @desc    Delete roadmap
// @route   DELETE /api/roadmaps/:id
// @access  Private (Admin/Instructor)
exports.deleteRoadmap = asyncHandler(async (req, res, next) => {
  const roadmap = await Roadmap.findById(req.params.id);

  if (!roadmap) {
    return next(
      new ErrorResponse(`Roadmap not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is roadmap owner or admin
  if (roadmap.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this roadmap`,
        401
      )
    );
  }

  await roadmap.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});