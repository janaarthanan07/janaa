import path from "node:path";
import { fileURLToPath } from "node:url";

async function loadDependency(packageName, localFallback) {
  try {
    return await import(packageName);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") {
      throw error;
    }

    return import(localFallback);
  }
}

const { default: express } = await loadDependency(
  "express",
  "./.deps/node_modules/express/index.js"
);
const { default: cors } = await loadDependency(
  "cors",
  "./.deps/node_modules/cors/lib/index.js"
);
const { default: dotenv } = await loadDependency(
  "dotenv",
  "./.deps/node_modules/dotenv/dist/index.cjs"
);
const { GoogleGenAI } = await loadDependency(
  "@google/genai",
  "./.deps/node_modules/@google/genai/dist/node/index.mjs"
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDirectory = path.resolve(__dirname, "..", "front end");

dotenv.config({ path: path.join(__dirname, "AH.env") });

const app = express();
const port = Number(process.env.PORT) || 3000;
const retryDelaysMs = [0, 750, 2000];

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.static(frontendDirectory));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/advice", async (req, res) => {
  const { question, financialData } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "A question is required." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key is not configured." });
  }

  try {
    const prompt = `
You are PocketSmart, a helpful personal-budget assistant.
Give clear, practical educational guidance; do not present it as professional financial advice.

Financial data:
${JSON.stringify(financialData)}

User question:
${question}
`;

    let response;

    for (const [attempt, delay] of retryDelaysMs.entries()) {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        response = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
          contents: prompt
        });
        break;
      } catch (error) {
        const status = Number(error?.status);
        const canRetry = status === 429 || status === 503;

        if (!canRetry || attempt === retryDelaysMs.length - 1) {
          throw error;
        }
      }
    }

    res.json({ answer: response.text || "I could not generate advice." });
  } catch (error) {
    console.error("Gemini request failed:", error);
    const status = Number(error?.status);
    const isBusy = status === 429 || status === 503;

    res.status(isBusy ? 503 : 502).json({
      error: isBusy
        ? "Gemini is busy right now. Please try again in a few seconds."
        : "Unable to get advice from Gemini."
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`PocketSmart is running at http://localhost:${port}`);
});
