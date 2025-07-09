const fetch = require("node-fetch");
require("dotenv").config();

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

async function listModels() {
  try {
    const response = await fetch("https://api.together.xyz/v1/models", {
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
      },
    });

    const data = await response.json();

    console.log("Response Status:", response.status);
    console.log("Full Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Error fetching models:", data);
      return;
    }

    if (data.data && Array.isArray(data.data)) {
      console.log("Available models:");
      data.data.forEach((model) => {
        console.log(`- ${model.id} (${model.object})`);
      });
    } else {
      console.log("No models found or unexpected response structure");
    }
  } catch (error) {
    console.error("Request Error:", error);
  }
}

listModels();
