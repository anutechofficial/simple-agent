import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Step 1: Expose a manifest of available tools
app.get("/manifest", (req, res) => {
  res.json({
    tools: [
      {
        name: "saveUserData",
        description:
          "With this tool user can share there information like name as name, date of birth as dob, phone number as phone, email id as email, there address location where they live as address, You have to go one by one like first ask user for there consent then name then dob etc. once you collect all the data which is specified by agent like [name, address], or [name, address, phone] or all then you can invoke this tool to save data. If the user provided content has the words like skip or continue or next question, etc., give collected information as skipped like name [skipped], dob [skipped] etc.",
        parameters: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "sessionId (uuid) of this convertation session",
            },
            consent: {
              type: "string",
              description: "User affirmative consent like yes or I agree, etc.",
            },
            name: {
              type: "string",
              description:
                "full name of the user, if name feels not complete ask user for there full name",
            },
            dob: {
              type: "string",
              description: "Date of birth of the user",
            },
            phone: {
              type: "string",
              description: "Phone number of the user",
            },
            email: {
              type: "string",
              description: "Email id of the user",
            },
            address: {
              type: "string",
              description: "Address of the user",
            },
          },
          required: ["sessionId", "consent"],
        },
      },
    ],
  });
});

// ✅ Step 2: Handle invoke calls
app.post("/invoke", async (req, res) => {
  const { tool, input } = req.body;

  if (tool === "getWeather") {
    const data = { city: input.city, temperature: "23°C", condition: "Sunny" };
    console.log("weather data :", data);

    return res.json({ result: data });
  }

  if (tool === "saveUserData") {
    const data = { id: Date.now(), name: input.name };
    console.log("user created: ", input);

    return res.json({ result: data });
  }

  res.status(400).json({ error: "Unknown tool" });
});

app.listen(3000, () =>
  console.log("🧠 MCP Server running on http://localhost:3000")
);
