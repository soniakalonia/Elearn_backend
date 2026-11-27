const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const service = require("../services/counselling.service");
const env = require("../config/env");

exports.getPlans = asyncHandler(async (req, res) => {
  const plans = await service.adminListPlans();
  return res.json(new ApiResponse(200, { plans }, "Counselling plans fetched"));
});

exports.updatePlan = asyncHandler(async (req, res) => {
  const plan = await service.adminUpdatePlan(req.params.duration, req.body);
  return res.json(new ApiResponse(200, { plan }, "Plan updated"));
});

exports.deletePlan = asyncHandler(async (req, res) => {
  await service.adminDeletePlan(Number(req.params.id));
  return res.json(new ApiResponse(200, {}, "Plan deleted"));
});

exports.getQuestions = asyncHandler(async (req, res) => {
  const questions = await service.adminListQuestions();
  return res.json(new ApiResponse(200, { questions }, "Questions fetched"));
});

exports.createQuestion = asyncHandler(async (req, res) => {
  const question = await service.adminCreateQuestion(req.body);
  return res.status(201).json(new ApiResponse(201, { question }, "Question created"));
});

exports.updateQuestion = asyncHandler(async (req, res) => {
  const question = await service.adminUpdateQuestion(Number(req.params.id), req.body);
  return res.json(new ApiResponse(200, { question }, "Question updated"));
});

exports.deleteQuestion = asyncHandler(async (req, res) => {
  await service.adminDeleteQuestion(Number(req.params.id));
  return res.json(new ApiResponse(200, {}, "Question deleted"));
});

exports.createOption = async (req, res, next) => {
  try {
    let imageUrl = null;
    if (req.file) imageUrl = `/${env.UPLOAD_DIR}/${req.file.filename}`;
    const option = await service.adminCreateOption({ ...req.body, questionId: Number(req.body.questionId), imageUrl });
    return res.status(201).json(new ApiResponse(201, { option }, "Option created"));
  } catch (err) { next(err); }
};

exports.updateOption = async (req, res, next) => {
  try {
    let imageUrl = undefined;
    if (req.file) imageUrl = `/${env.UPLOAD_DIR}/${req.file.filename}`;
    const option = await service.adminUpdateOption(Number(req.params.id), { ...req.body, imageUrl });
    return res.json(new ApiResponse(200, { option }, "Option updated"));
  } catch (err) { next(err); }
};

exports.deleteOption = asyncHandler(async (req, res) => {
  await service.adminDeleteOption(Number(req.params.id));
  return res.json(new ApiResponse(200, {}, "Option deleted"));
});

exports.listBookings = asyncHandler(async (req, res) => {
  const data = await service.adminListBookings({ range: req.query.range || "all", page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 });
  return res.json(new ApiResponse(200, data, "Bookings fetched"));
});

exports.stats = asyncHandler(async (req, res) => {
  const data = await service.adminStats({ range: req.query.range || "all" });
  return res.json(new ApiResponse(200, data, "Stats fetched"));
});