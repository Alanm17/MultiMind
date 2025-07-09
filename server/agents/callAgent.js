const { APIClient } = require("./apiClient");
const apiClient = new APIClient(process.env.TOGETHER_API_KEY);

module.exports = async function callAgent({ model, prompt, context }) {
  return apiClient.callWithRetry(model, prompt, context, 2);
};
