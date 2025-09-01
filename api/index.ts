import {
  DeepgramSTT,
  TextComponent,
  RealtimeKitTransport,
  ElevenLabsTTS,
  RealtimeAgent,
} from "@cloudflare/realtime-agents";

class ChatTextProcessor extends TextComponent {
  env;

  constructor(env) {
    super();
    this.env = env;
  }

  async onTranscript(text, reply) {
    // TODO: Make this do something useful once I've figured it out.
    const prompt = `You are a helpful AI assistant in a video chat meeting. Respond naturally and helpfully to: ${text}`;

    try {
      const { response } = await this.env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct",
        { prompt }
      );
      reply(response);
    } catch (error) {
      console.error("AI processing error:", error);
      reply("I'm having trouble processing that right now. Could you please repeat?");
    }
  }
}

export class RealtimeChatAgent extends RealtimeAgent {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async init(agentId, meetingId, authToken, workerUrl, accountId, apiToken) {
    const textProcessor = new ChatTextProcessor(this.env);
    const rtkTransport = new RealtimeKitTransport(meetingId, authToken);

    await this.initPipeline(
      [
        rtkTransport,
        new DeepgramSTT(this.env.DEEPGRAM_API_KEY),
        textProcessor,
        new ElevenLabsTTS(this.env.ELEVENLABS_API_KEY),
        rtkTransport,
      ],
      agentId,
      workerUrl,
      accountId,
      apiToken,
    );

    const { meeting } = rtkTransport;

    meeting.participants.joined.on("participantJoined", (participant) => {
      console.log(`Participant joined: ${participant.name}`);
      textProcessor.speak(`Welcome ${participant.name}! I'm your AI assistant. How can I help you today?`);
    });

    meeting.participants.joined.on("participantLeft", (participant) => {
      console.log(`Participant left: ${participant.name}`);
    });

    await meeting.join();
  }

  async deinit() {
    await this.deinitPipeline();
  }
}

interface Env {
  ASSETS: Fetcher;
  REALTIME_CHAT_AGENT: DurableObjectNamespace;
  DEEPGRAM_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  ACCOUNT_ID: string;
  API_TOKEN: string;
  RTK_API_BASE_URL: string;
  AI: any;
}

async function handleMeetingAPI(request: Request, env: Env) {
  const url = new URL(request.url);
  const meetingId = url.searchParams.get("meetingId");

  if (!meetingId) {
    return new Response(JSON.stringify({ error: "meetingId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const agentId = `agent-${meetingId}`;
  const agent = env.REALTIME_CHAT_AGENT.idFromName(meetingId);
  const stub = env.REALTIME_CHAT_AGENT.get(agent);

  if (url.pathname.startsWith("/agentsInternal")) {
    return stub.fetch(request);
  }

  switch (url.pathname) {
    case "/api/meeting/join":
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(JSON.stringify({ error: "Authorization header required" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }

        const authToken = authHeader.split(" ")[1];

        if (env.API_TOKEN && env.RTK_API_BASE_URL) {
          const participantsResponse = await fetch(`${env.RTK_API_BASE_URL}/meetings/${meetingId}/participants`, {
            headers: {
              "Authorization": `Bearer ${env.API_TOKEN}`,
              "Content-Type": "application/json"
            }
          });

          if (participantsResponse.ok) {
            const participants = await participantsResponse.json();
            const hasAgent = participants.data?.some((p: any) => p.name?.includes('agent') || p.role === 'agent');

            if (!hasAgent) {
              await stub.init(
                agentId,
                meetingId,
                authToken,
                url.host,
                env.ACCOUNT_ID,
                env.API_TOKEN
              );
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          meetingId,
          message: "Ready to join meeting"
        }), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (error) {
        console.error("Meeting join error:", error);
        return new Response(JSON.stringify({ error: "Failed to join meeting" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

    case "/api/meeting/leave":
      try {
        await stub.deinit();
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("Meeting leave error:", error);
        return new Response(JSON.stringify({ error: "Failed to leave meeting" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

    case "/api/webhook":
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      try {
        const event = await request.json();
        console.log("Webhook event received:", event);

        switch (event.type) {
          case "meeting.participant_joined":
            // TODO: Agent logic can be added here if needed
            break;
          case "meeting.participant_left":
            // TODO: Check if we need to keep agent in meeting
            break;
        }

        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("Webhook error:", error);
        return new Response("Internal Server Error", { status: 500 });
      }

    default:
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/agentsInternal")) {
      return handleMeetingAPI(request, env);
    }

    // Serve static assets for everything else
    try {
      return await env.ASSETS.fetch(request);
    } catch (error) {
      if (url.pathname !== "/" && !url.pathname.includes(".")) {
        const indexRequest = new Request(new URL("/", request.url), request);
        return await env.ASSETS.fetch(indexRequest);
      }
      throw error;
    }
  },
};
