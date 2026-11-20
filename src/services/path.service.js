const Path = require("../models/Path");
const ApiError = require("../utils/ApiError");

const pathService = {
  list() {
    return Path.findAll();
  },

  async get(id) {
    const p = await Path.findById(id);
    if (!p) throw new ApiError(404, "Career path not found");
    return p;
  },

  create(body) {
    if (!body.title || !body.description) {
      throw new ApiError(400, "Title and description are required");
    }
    // Normalize skills whether the client sends array or comma-separated string
    const skills = Array.isArray(body.skills)
      ? body.skills
      : typeof body.skills === "string"
        ? body.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    return Path.create({ ...body, skills });
  },

  update(id, body) {
    return Path.update(id, body);
  },

  async remove(id) {
    const ok = await Path.remove(id);
    if (!ok) throw new ApiError(404, "Career path not found");
    return true;
  },
};

module.exports = pathService;