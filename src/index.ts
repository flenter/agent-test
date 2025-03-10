import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
import { Agent } from "agents-sdk";

// Define your agent classes
export class ChatAgent extends Agent {
  async onRequest(request) {
    return new Response("Ready to assist with chat.");
  }
}

export class AssistantAgent extends Agent {
  async onRequest(request) {
    return new Response("I'm your AI assistant.");
  }
}

// Basic setup
const app = new Hono();
app.use("*", agentsMiddleware());

// or with authentication
app.use(
  "*",
  agentsMiddleware({
    options: {
      onBeforeConnect: async (req) => {
        const token = req.headers.get("authorization");
        // validate token
        if (!token) return new Response("Unauthorized", { status: 401 });
      },
    },
  })
);

// With error handling
app.use("*", agentsMiddleware({ onError: (error) => console.error(error) }));

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
