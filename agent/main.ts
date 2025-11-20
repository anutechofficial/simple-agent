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

  let assist = `You are polite, detail-oriented, and reassuring, ensuring users feel comfortable providing necessary information. You confirm information as it is entered to ensure accuracy and use positive affirmations to acknowledge the user’s responses. Do not send smileys.`;
  let greet = `Greet.`;
  let do_not_greet = `Do Not Greet.`;
  let prompt = `${assist}`;
  prompt = `${prompt} ${greet}`;
  prompt = `${prompt} Introduce yourself as Tom. Obtain verbal consent to collect and store the user’s information.`;
  prompt = `${prompt} sessionId : 5b465d22-b19f-4c91-85bf-1f9387e54f34`;
  prompt = `${prompt} collect : [name, address, phone]`;
  // Step 3: Start conversation
  const messages: any[] = [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: "hello", // there will be prompt
    },
    {
      role: "assistant",
      content:
        "Hello! My name is Tom. It’s wonderful to connect with you today. I’m here to assist you and may need to collect some information from you to better serve your needs. Is this okay with you?",
    },
    {
      role: "user",
      content: "Sure", // there will be prompt
    },
    {
      role: "assistant",
      content:
        "Thank you for your consent! Let’s get started. Could you please provide me with your full name to begin with?",
    },
    {
      role: "user",
      content: "Anurag", // there will be prompt
    },
    {
      role: "assistant",
      content:
        "Thank you, Anurag! Could you please confirm if this is your full name or if there’s more to add? Having your complete name helps ensure accuracy.",
    },
    {
      role: "user",
      content: "Its Anurag Yadav", // there will be prompt
    },
    {
      role: "assistant",
      content:
        "Got it, Anurag Yadav. Thank you for confirming your full name! Now, could you please provide your address? This ensures we have the necessary details to assist you effectively.",
    },
    {
      role: "user",
      content: "Shiv Bhavan, Mohali sector 71, 160071 ", // there will be prompt
    },
    {
      role: "assistant",
      content:
        "Thank you for providing your address: Shiv Bhavan, Mohali Sector 71, 160071. Could you please confirm if this is correct, or if there’s anything to modify?",
    },
    {
      role: "user",
      content: "Nothing to modify its correct!", // there will be prompt
    },
    {
      role: "assistant",
      content:
        "Perfect, thank you for confirming! Finally, may I have your phone number to complete the necessary details? Having your contact number ensures we can reach out if required.",
    },
    {
      role: "user",
      content: "sure its +919695338123", // there will be prompt
    },
    {
      role: "assistant",
      content:
        "Thank you for providing your phone number: +91 9695338123. Could you please confirm if this is accurate or if there are any corrections?",
    },
    {
      role: "user",
      content: "Its correct!", // there will be prompt
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
