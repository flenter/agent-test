import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
export { Chat } from "./Agent"
// import { ollama } from "ollama-ai-provider";

interface Env {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  OPENAI_API_KEY: string;
  Chat: DurableObjectNamespace<typeof Chat>;
  DB: D1Database;
}
// export class AssistantAgent extends Agent {
//   async onRequest(request) {
//     return new Response("I'm your AI assistant.");
//   }
// }

// Basic setup
const app = new Hono();
app.use("*", agentsMiddleware());

// // or with authentication
// app.use(
//   "*",
//   agentsMiddleware({
//     options: {
//       onBeforeConnect: async (req) => {
//         const token = req.headers.get("authorization");
//         // validate token
//         if (!token) return new Response("Unauthorized", { status: 401 });
//       },
//     },
//   })
// );

// // With error handling
// app.use("*", agentsMiddleware({ onError: (error) => console.error(error) }));

// With custom routing
app.use(
  "*",
  agentsMiddleware({
    options: {
      prefix: "agents", // Handles /agents/* routes only
    },
  })
);

export default app;
