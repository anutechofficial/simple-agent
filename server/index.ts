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
        name: "createUser",
        description: "Create a new user record",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the user" },
          },
          required: ["name"],
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

  if (tool === "createUser") {
    const data = { id: Date.now(), name: input.name };
    console.log("user created: ", data);
    
    return res.json({ result: data });
  }

  res.status(400).json({ error: "Unknown tool" });
});

app.listen(3000, () =>
  console.log("🧠 MCP Server running on http://localhost:3000")
);
