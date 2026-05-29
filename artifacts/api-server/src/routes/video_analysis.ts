import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { db, aiAnalysisResultsTable } from "@workspace/db";

const router = Router();

const PROTOCOL_META: Record<string, { name: string; markers: string[] }> = {
  "social-reciprocity": {
    name: "Social Reciprocity Protocol",
    markers: ["Gaze & joint attention", "Social engagement", "Facial affect responsiveness", "Behavioral regulation", "Communication initiation"],
  },
  social_reciprocity: {
    name: "Social Reciprocity Protocol",
    markers: ["Gaze & joint attention", "Social engagement", "Facial affect responsiveness", "Behavioral regulation", "Communication initiation"],
  },
  name_response: {
    name: "Name Response Protocol",
    markers: ["Response latency", "Eye contact upon name call", "Orientation behavior", "Social reciprocity"],
  },
  joint_play: {
    name: "Joint Play Interaction",
    markers: ["Joint attention initiation", "Imitation of actions", "Emotional engagement", "Repetitive behavioral patterns", "Play complexity"],
  },
  communication_sample: {
    name: "Communication Sample",
    markers: ["Speech intelligibility", "Vocabulary diversity", "Sentence structure", "Response timing", "Spontaneous vs prompted communication"],
  },
  sensory_motor: {
    name: "Sensory-Motor Observation",
    markers: ["Motor coordination", "Sensory-seeking vs sensory-avoiding behaviors", "Self-stimulatory patterns", "Adaptive responses"],
  },
};

router.post("/video-analysis", async (req, res) => {
  const { protocolId, frames, childId } = req.body as { protocolId: string; frames: string[]; childId?: number };
  const startTime = Date.now();

  if (!protocolId || !frames || !Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ error: "protocolId and frames are required" });
  }

  const protocol = PROTOCOL_META[protocolId];
  if (!protocol) {
    return res.status(400).json({ error: "Unknown protocolId" });
  }

  const markersJson = protocol.markers.map(m => `"${m}"`).join(", ");
  const systemPrompt = `You are NEOBRAIN, a specialized AI for pediatric developmental behavioral analysis trained on clinical assessment protocols.

You are analyzing ${frames.length} sequential video frames from the "${protocol.name}" assessment protocol used for early developmental screening (ASD, ADHD, language delays, sensory processing).

Your task: Analyze the child's behavior visible in these frames and score the following behavioral markers:
[${markersJson}]

For each marker, assign:
- score: integer 0–100 (100 = fully age-appropriate, 0 = severely atypical)
- severity: "normal" (score 65–100), "moderate" (score 35–64), or "high" concern (score 0–34)

Base your analysis on observable cues: gaze direction, body orientation, facial expressions, motor patterns, responsiveness, and social engagement visible in the frames.

Respond ONLY with valid JSON in this exact structure (no markdown, no explanation outside JSON):
{
  "findings": [
    {"label": "<marker name>", "score": <integer 0-100>, "severity": "<normal|moderate|high>"}
  ],
  "summary": "<2-4 sentence clinical summary of observed behaviors>",
  "recommendation": "<1-3 sentence clinical recommendation for the parent and clinician>",
  "riskLevel": "<low|moderate|high>"
}

riskLevel rules:
- "low": all findings are normal
- "moderate": 1–2 high-severity findings OR majority moderate
- "high": 3+ high-severity findings OR any single finding below 25`;

  const imageParts = frames.slice(0, 12).map((frame: string) => ({
    inlineData: {
      mimeType: "image/jpeg" as const,
      data: frame.replace(/^data:image\/[a-z]+;base64,/, ""),
    },
  }));

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              ...imageParts,
              { text: "Analyze these frames now and return the JSON response." },
            ],
          },
        ],
        config: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });

      const text = response.text ?? "";
      const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const result = JSON.parse(clean);
      const processingTimeMs = Date.now() - startTime;

      // Persist the AI analysis result to the database
      if (childId) {
        try {
          const highFindings = (result.findings ?? []).filter((f: { severity: string }) => f.severity === "high");
          const flaggedConcerns = highFindings.length > 0
            ? highFindings.map((f: { label: string }) => f.label).join(", ")
            : null;

          await db.insert(aiAnalysisResultsTable).values({
            childId,
            analysisType: `video_${protocolId}`,
            modelUsed: "gemini-2.5-flash",
            inputSummary: `${frames.length} frames · protocol: ${protocol.name}`,
            rawOutput: clean,
            structuredInsights: result,
            confidenceScore: result.findings?.length > 0
              ? Math.round(result.findings.reduce((a: number, f: { score: number }) => a + f.score, 0) / result.findings.length)
              : null,
            flaggedConcerns,
            recommendations: result.recommendation ?? null,
            processingTimeMs,
          });
        } catch (persistErr) {
          req.log.warn({ persistErr }, "Failed to persist AI analysis result — returning result anyway");
        }
      }

      return res.json(result);
    } catch (err: unknown) {
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes("429") || err.message.toLowerCase().includes("rate limit") || err.message.toLowerCase().includes("quota"));

      if (isRateLimit && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 1500 * attempts));
        continue;
      }

      req.log.error({ err }, "Video analysis failed");
      return res.status(500).json({ error: "AI analysis failed. Please try again." });
    }
  }
  return res.status(500).json({ error: "Max retries exceeded. Please try again." });
});

export default router;
