import OpenAI from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = new OpenAI({ baseURL: endpoint, apiKey: token });

async function main() {
  // Step 1: Fetch manifest from your MCP server
  const manifestRes = await fetch("http://localhost:3000/manifest");
  const manifest: any = await manifestRes.json();

  // Step 2: Transform tools to OpenAI format
  const tools = manifest.tools.map((tool: any) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  console.log(
    "🤖 Agent initialized with tools:",
    tools.map((t: any) => t.function.name)
  );

  // Step 3: Start conversation
  const messages: any[] = [
    {
      role: "user",
      content: "", // there will be prompt
    },
  ];

  // Step 4: Run the agent loop
  let continueLoop = true;
  let iterationCount = 0;
  const maxIterations = 10;

  while (continueLoop && iterationCount < maxIterations) {
    iterationCount++;
    console.log(`\n--- Iteration ${iterationCount} ---`);

    // Call the model
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage: any = response.choices[0].message;
    messages.push(responseMessage);

    // Check if the model wants to call tools
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      console.log(
        `🔧 Model requested ${responseMessage.tool_calls.length} tool call(s)`
      );

      // Execute each tool call
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(
          `  → Calling: ${functionName}(${JSON.stringify(functionArgs)})`
        );

        // Call your MCP server
        const res = await fetch("http://localhost:3000/invoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: functionName, input: functionArgs }),
        });

        const result = await res.json();
        console.log(`  ← Result:`, result);

        // Add the tool response to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    } else {
      // No more tool calls, we're done
      continueLoop = false;
      console.log("\n💬 Assistant:", responseMessage.content);
    }
  }

  if (iterationCount >= maxIterations) {
    console.log("\n⚠️  Max iterations reached");
  }
}

main().catch(console.error);
