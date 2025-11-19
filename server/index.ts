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
        name: "getWeather",
        description: "Get current weather for a given city",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "Name of the city" },
          },
          required: ["city"],
        },
      },
      {
        name: "saveUserData",
        description: "Save user data to the database all keys are mandatory",
        parameters: {
          type: "object",
          properties: {
            consent: {
              type: "string",
              description:
                "User consent ask user to are you confortable to provide us these data and save this entry of user in this consent key",
            },
            name: { type: "string", description: "Name of the user" },
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
          required: ["consent", "name", "dob", "phone", "email", "address"],
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
