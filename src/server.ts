import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
import { Agent, type AgentNamespace } from "agents-sdk";
// import { AIChatAgent } from "agents-sdk/ai-chat-agent";

export type Env = {
  Chat: AgentNamespace<Chat>;
};

// Define your agent classes
export class Chat extends Agent<Env> {

  // async onRequest(request) {
  //   return new Response("Ready to assist with chat.");
  // }
  // async onChatMessage(onFinish: StreamTextOnFinishCallback<{}>) {

  // }
  // Called when an Agent is started (or woken up)
  async onStart() {
    // Can access this.env and this.state
    console.log("Agent started");
  }

  // Called when a HTTP request is received
  // Can be connected to routeAgentRequest to automatically route
  // requests to an individual Agent.
  async onRequest(request) {
    console.log("Received request!");
  }

  // Called when a WebSocket connection is established
  async onConnect(connection, ctx) {
    console.log("Connected!");
    // Check the request at ctx.request
    // Authenticate the client
    // Give them the OK.
    connection.accept();
  }

  // Called for each message received on the WebSocket connection
  async onMessage(connection, message) {
    console.log(`message from client ID: ${connection.id}`);
    // Send messages back to the client
    connection.send("Hello!");
  }

  // WebSocket error and disconnection (close) handling.
  async onError(connection, error) {
    console.error(`WS error: ${error}`);
  }

  async onClose(connection, code, reason, wasClean) {
    console.log(`WS closed: ${code} - ${reason} - wasClean: ${wasClean}`);
    connection.close();
  }

  // Called when the Agent's state is updated
  // via this.setState or the useAgent hook from the agents-sdk/react package.
  async onStateUpdate(state) {
    // 'state' will be typed if you supply a type parameter to the Agent class.
  }

}

// export class AssistantAgent extends Agent {
//   async onRequest(request) {
//     return new Response("I'm your AI assistant.");
//   }
// }

// Basic setup
const app = new Hono();
app.use("*", (c, next) => {
  console.log('Chat', Chat)
  // console.log("Request received", c.req.url, "next", next);
  return next();
})
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
