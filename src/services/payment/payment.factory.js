const razorpay = require("./razorpay.service");
const ApiError = require("../../utils/ApiError");

const providers = {
  razorpay: {
    key: "razorpay",
    createOrder: razorpay.createOrder,
    verifySignature: razorpay.verifySignature,
  },
};

function getProvider(name) {
  const provider = providers[String(name || "").toLowerCase()];
  if (!provider) throw new ApiError(400, `Unsupported payment method: ${name}`);
  return provider;
}

module.exports = { getProvider };