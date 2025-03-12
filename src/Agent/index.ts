import { Agent, type AgentContext, type AgentNamespace, type Connection, type ConnectionContext, type WSMessage } from "agents-sdk";
import packageJson from "../../package.json";
import { generateText, tool, type LanguageModelV1, type ToolSet } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { z } from "zod";
import { createMessages } from "./utils";

type GenerateTextParams = Parameters<typeof generateText>[0]
const dependencies = packageJson.dependencies;
// export type Env = {
//   Chat: AgentNamespace<Chat>;
//   GOOGLE_GENERATIVE_AI_API_KEY: string;
//   OPENAI_API_KEY: string;
// };

export type Env = {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  OPENAI_API_KEY: string;
  Chat: DurableObjectNamespace<Chat>;
  DB: D1Database;
}

const FindDatabase = tool({
  description: "Find the database being used in the project.",
  parameters: z.object({}),
  execute: async () => {
    const names = Object.keys(dependencies);
    if (names.find(item => item.toLowerCase().includes("mongodb"))) {
      return {
        type: "text",
        text: "The database being used is MongoDB",
      };
    }

    return {
      type: "text",
      text: "Type of DB is unknown",
    };
  }
})

const ListDependencies = tool({
  description: "List the dependencies in tha package.json file. This can help figure out what database is being used.",
  parameters: z.object({}),
  execute: async () => {
    try {

      // const packageJson = await fetch("../package.json").then((res) => res.json());
      // const dependencies = packageJson.dependencies;
      const packages = Object.entries(dependencies).map(([name, version]) => `${name}@${version}`);
      return {
        type: "text",
        text: `Here are the npm packages: 
${packages.length ? `* ${packages.join("* ")}` : "No dependencies found"}`,
      };
    } catch (error) {
      console.error("Not working", error);
    }
    return {
      type: "text",
      text: "Failed to retrieve a list of dependencies",
    };
  },
})

const tools: ToolSet = {
  "list_dependencies": ListDependencies,
  // "find_database": FindDatabase,
}
// Define your agent classes
export class Chat extends Agent<Env> {

  private apiKey: string;
  // Override constructor so we can store the `GOOGLE_GENERATIVE_AI_API_KEY` env var
  constructor(ctx: AgentContext, env: Env) {
    super(ctx, env);
    this.apiKey = env.OPENAI_API_KEY;
    // this.apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
  }
  // console

  // async onRequest(_request: Request) {
  //   return new Response("Ready to assist with chat.");
  // }

  // // async onChatMessage(onFinish: generateTextOnFinishCallback<{}>) {

  // // }
  // // Called when an Agent is started (or woken up)

  private _model: LanguageModelV1 | null = null;
  private _openai: OpenAIProvider | null = null;
  async onStart() {
    console.log("Agent started");

    this._openai = createOpenAI({
      apiKey: this.apiKey,
    });
    this._model = this._openai(
      'gpt-4o',
      // {
      //   apiKey: this.apiKey,
      //   // model: "gpt-4o",
      // }
    )
    // const google = createGoogleGenerativeAI({
    //   apiKey: this.apiKey,
    // });
    // this._model = google("gemini-2.0-flash-exp");
  }

  // // Called when a HTTP request is received
  // // Can be connected to routeAgentRequest to auotomatically route
  // // requests to an individual Agent.
  // async onRequest(request) {
  //   console.log("Received request!");
  // }

  // Called when a WebSocket connection is established
  async onConnect(
    connection: Connection,
    ctx: ConnectionContext
  ) {
    console.log("Connected!", connection.id, connection.readyState === WebSocket.OPEN);
    connection.send(JSON.stringify("Hello, from server world!"));
  }

  // // Called for each message received on the WebSocket connection
  async onMessage(connection: Connection, message: WSMessage): Promise<void> {
    console.log(`message from client ID: ${connection.id} `, message.toString());
    connection.send(JSON.stringify("ACK"));

    if (this._model) {
      const params: GenerateTextParams = {
        model: this._model,
        tools,
        messages: createMessages(message.toString()),
        experimental_activeTools: ["list_dependencies"],
        maxSteps: 5,
        experimental_continueSteps: true,
        // onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
        //   console.log("Step finished", { text, toolCalls, toolResults, finishReason, usage });
        // }
      };
      try {
        const result = await generateText(params);
        console.log("------------------");
        // console.log(JSON.stringify(result, null, 2));
        console.log("Done", result.text);
      } catch (error) {
        console.error('Failed', error)
      }

      // const response = await openai.chat.completions.create({
      //   model: 'gpt-4o',
      //   messages: createMessages(message.toString()),
      //   tools: [/* your tool definitions */],
      //   stream: true,
      //   tool_choice: 'auto',
      // });

      // // Use AI SDK's built-in handling for tool calls
      // const stream = OpenAIStream(response, {
      //   async experimental_onToolCall(toolCall) {
      //     if (toolCall.name === 'list_dependencies') {
      //       // Implement your tool logic
      //       return { result: '...' }; // Return the tool result
      //     }
      //     if (toolCall.name === 'find_database') {
      //       // Implement your tool logic  
      //       return { result: '...' }; // Return the tool result
      //     }
      //   }
      // });

      // return new StreamingTextResponse(stream);
      // }
    }
  }

  async makeCall(message: string) {

    if (!this._openai) {
      return;
    }

    const model = await this._openai.completion(
      "gpt-4o");
    // Initial call
    const response = generateText({
      model,
      tools,
      messages: createMessages(message.toString()),
    });

    // Get the assistant's reply
    const assistantMessage = response.choices[0].message;

    // Check if the assistant wants to call a tool
    if (assistantMessage.tool_calls) {
      // Process each tool call
      const toolResponses = [];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === "list_dependencies") {
          // Execute the list_dependencies function
          const dependencies = "Here are the npm packages: \n* hono@^4.7.4..."; // Your actual function implementation

          // Add the tool response
          toolResponses.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: dependencies
          });
        }
      }

      // Continue the conversation with the tool responses
      const secondResponse = await this._openai.completion({
        model: "gpt-4o",
        messages: [
          { role: "user", content: "I want a list user endpoint" },
          assistantMessage,  // Include the assistant's message with tool_calls
          ...toolResponses   // Add all tool responses
        ]
      });

      // Now the model can use the tool results to provide a complete answer
      return secondResponse;
    }
  }

  // // WebSocket error and disconnection (close) handling.
  async onError(connection: Connection, error: unknown) {
    console.error(`WS error: ${error} `);
  }

  async onClose(
    connection: Connection,
    code: number,
    reason: string,
    wasClean: boolean
  ) {
    console.log(`WS closed: ${code} - ${reason} - wasClean: ${wasClean} `);
    connection.close();
  }

  // // Called when the Agent's state is updated
  // // via this.setState or the useAgent hook from the agents-sdk/react package.
  // async onStateUpdate(state) {
  //   // 'state' will be typed if you supply a type parameter to the Agent class.
  // }

}

// export async function POST(messages: GenerateTextParams["messages"], model: LanguageModelV1) {
//   // This is the key part: create a proper tools config for Gemini
//   const googleTools = tools.map(tool => ({
//     functionDeclarations: [{
//       name: tool.name,
//       description: tool.description
//     }]
//   }));

//   // Create the response stream using the Vercel AI SDK
//   const response = await model.generateContentStream({
//     contents: messages.map(m => ({
//       role: m.role === 'user' ? 'user' : 'model',
//       parts: [{ text: m.content }]
//     })),
//     generationConfig: {
//       temperature: 0.2,
//     },
//     systemInstruction: {
//       parts: [{
//         text: "You are an expert on the Hono framework. Use the provided tools whenever relevant to answer user queries."
//       }]
//     },
//     tools: {
//       functionDeclarations: tools.map(tool => ({
//         name: tool.name,
//         description: tool.description
//       }))
//     },
//     toolConfig: {
//       functionCallingConfig: {
//         mode: 'AUTO'
//       }
//     }
//   });

//   // Process tool calls automatically
//   const stream = GoogleAIStream(response, {
//     // This part handles the tool calling cycle
//     async experimental_onToolCall(call) {
//       // Find the matching tool in your tools array
//       const tool = tools.find(t => t.name === call.name);
//       if (!tool) {
//         return { error: `Tool ${call.name} not found` };
//       }

//       // Execute the tool and return the result
//       try {
//         return await tool.execute(call.args || {});
//       } catch (error) {
//         console.error(`Error executing tool ${call.name}:`, error);
//         return { error: `Error executing ${call.name}: ${error.message}` };
//       }
//     }
//   });

//   // Return the streaming response
//   return new StreamingTextResponse(stream);
// }
