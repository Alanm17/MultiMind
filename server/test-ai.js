const fetch = require("node-fetch");
require("dotenv").config();

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

async function testTogetherAI() {
  console.log("Testing Together AI API...");
  console.log("API Key:", TOGETHER_API_KEY ? "Present" : "Missing");

  try {
    const response = await fetch(
      "https://api.together.xyz/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Phind-CodeLlama-34B-v2",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Say hello" },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("Response Status:", response.status);
    console.log(
      "Response Headers:",
      Object.fromEntries(response.headers.entries())
    );
    console.log("Response Body:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      return;
    }

    if (data.error) {
      console.error("API Error:", data.error);
      return;
    }

    if (data.choices && data.choices.length > 0) {
      console.log("Success! AI Response:", data.choices[0].message.content);
    } else {
      console.log("No choices in response");
    }
  } catch (error) {
    console.error("Request Error:", error);
  }
}

testTogetherAI();
