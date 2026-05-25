import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Camera, Play } from "lucide-react";

interface Protocol {
  id: string;
  title: string;
  duration: string;
  purpose: string;
  aiAnalyzes: string[];
  setup: string;
  steps: string[];
  tips: string[];
}

const PROTOCOLS: Protocol[] = [
  {
    id: "name_response",
    title: "Task 1 — Name Response Protocol",
    duration: "2–3 minutes",
    purpose: "Assesses auditory processing, social orientation, and response to social stimuli.",
    aiAnalyzes: ["Response latency", "Eye contact upon name call", "Orientation behavior", "Social reciprocity"],
    setup: "Position child engaged in a quiet activity. Stand or sit approximately 1 meter away, slightly behind or to the side.",
    steps: [
      "Wait until child is focused on an activity (not actively looking at you).",
      "Call the child's name clearly in a neutral voice. Do not gesture.",
      "Wait 5 seconds. Observe and allow camera to capture any response.",
      "Repeat twice more with a 30-second pause between each call.",
      "On the 4th attempt, call the name and add a gesture (wave or tap shoulder).",
    ],
    tips: [
      "Do not use a sing-song voice — use natural conversational tone.",
      "Avoid calling the name more than once per attempt.",
      "Capture the child's face and body in frame throughout.",
    ],
  },
  {
    id: "joint_play",
    title: "Task 2 — Joint Play Interaction",
    duration: "5–7 minutes",
    purpose: "Evaluates shared attention, imitation, social engagement, and reciprocal play capacity.",
    aiAnalyzes: ["Joint attention initiation", "Imitation of actions", "Emotional engagement", "Repetitive behavioral patterns", "Play complexity"],
    setup: "Sit on the floor facing the child. Have 2–3 simple toys available (ball, blocks, simple puzzle). Camera should capture both parent and child.",
    steps: [
      "Begin parallel play — play near the child but do not direct. Observe what child does.",
      "Attempt to join the child's activity. Follow their lead; do not redirect.",
      "Introduce a simple imitation game (clap hands, tap blocks together).",
      "Offer the child a toy. Observe if they offer one back.",
      "Try to establish a turn-taking routine (roll ball back and forth).",
      "Introduce a novel toy. Observe the child's reaction and how they communicate interest.",
    ],
    tips: [
      "Do not prompt the child to look at the camera or say specific words.",
      "Allow natural silence — do not fill every gap with narration.",
      "If child disengages, try a different toy rather than redirecting verbally.",
    ],
  },
  {
    id: "communication_sample",
    title: "Task 3 — Communication Sample",
    duration: "4–5 minutes",
    purpose: "Evaluates expressive language, vocabulary complexity, speech clarity, and communicative intent.",
    aiAnalyzes: ["Speech intelligibility", "Vocabulary diversity", "Sentence structure", "Response timing", "Spontaneous vs prompted communication"],
    setup: "Sit facing the child at eye level. Use a familiar picture book or simple picture cards. Camera frames the child's face and upper body.",
    steps: [
      "Show the child a picture. Ask: 'What is this?' — pause and wait up to 10 seconds for response.",
      "Point to an action in the picture. Ask: 'What is happening here?'",
      "Ask: 'Can you tell me about your favorite thing?'",
      "Hold up two pictures. Ask: 'Which one do you like? Why?'",
      "Ask: 'How are you feeling today?' — observe both verbal and non-verbal response.",
      "Ask child to make a request: 'If you could have anything right now, what would you ask for?'",
    ],
    tips: [
      "Do not model the answer or finish the child's sentence.",
      "Accept any form of communication — gesture, sound, word approximation, full sentence.",
      "Note the child's response latency — pauses of 5–10 seconds are developmentally significant.",
    ],
  },
  {
    id: "sensory_motor",
    title: "Task 4 — Sensory-Motor Observation",
    duration: "3–4 minutes",
    purpose: "Documents motor planning, sensory responses, and self-regulatory behaviors.",
    aiAnalyzes: ["Motor coordination", "Sensory-seeking vs sensory-avoiding behaviors", "Self-stimulatory patterns", "Adaptive responses"],
    setup: "Open, safe space (living room floor or outdoor area). Camera captures full body. Have a few textured objects available (fuzzy cloth, smooth ball, noisy toy).",
    steps: [
      "Allow child free movement for 60 seconds — observe natural movement patterns.",
      "Introduce the textured cloth — offer it without insisting. Observe response.",
      "Introduce the noisy toy. Observe reaction (approach, avoidance, indifference).",
      "Ask the child to hop on one foot, then both feet — observe coordination.",
      "Ask the child to pick up a small object (coin-sized) and place it in a cup.",
      "Observe the child for any spontaneous repetitive movements during transitions.",
    ],
    tips: [
      "Never force sensory contact. Let the child set the pace.",
      "Note the intensity and duration of any sensory reactions.",
      "Keep the session calm — do not add additional stimuli during the child's reactions.",
    ],
  },
];

export default function VideoProtocol() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((e) => (e === id ? null : id));
  }

  function markComplete(id: string) {
    setCompleted((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <Card className="border-[#163300]/20 bg-[#163300]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#163300]">
            <Video className="w-5 h-5" /> Structured Video Assessment Protocols
          </CardTitle>
          <CardDescription className="text-[#163300]/70">
            Complete all 4 video tasks in a single session or across 2–3 days. Upload recordings directly to your child's profile. Clinicians and our AI system will analyze behavioral patterns from structured tasks — not random footage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { icon: Camera, label: "Good lighting required", sub: "Natural daylight preferred" },
              { icon: Clock, label: "Total session time", sub: "15–20 minutes" },
              { icon: Video, label: "Filming tips", sub: "Horizontal, stable recording" },
              { icon: CheckCircle, label: "4 tasks total", sub: `${completed.size}/4 completed` },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-lg border border-[#163300]/20 bg-white p-3">
                <Icon className="w-5 h-5 text-[#163300] mx-auto mb-1" />
                <p className="text-xs font-semibold text-[#163300]">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>Privacy & Consent:</strong> All video recordings are encrypted, stored securely, and used solely for developmental assessment purposes. Video data is never shared without explicit parent consent. You may delete recordings from your account at any time.
        </span>
      </div>

      <div className="space-y-3">
        {PROTOCOLS.map((protocol, index) => (
          <Card key={protocol.id} className={`transition-all ${completed.has(protocol.id) ? "border-green-300 bg-green-50" : ""}`}>
            <button
              className="w-full text-left"
              onClick={() => toggle(protocol.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full w-8 h-8 flex items-center justify-center shrink-0 text-sm font-bold ${completed.has(protocol.id) ? "bg-green-500 text-white" : "bg-[#163300] text-[#9FE870]"}`}>
                      {completed.has(protocol.id) ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base">{protocol.title}</CardTitle>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {protocol.duration}
                        </span>
                        {completed.has(protocol.id) && (
                          <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Completed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {expanded === protocol.id ? <ChevronUp className="w-4 h-4 text-muted-foreground mt-1 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />}
                </div>
              </CardHeader>
            </button>

            {expanded === protocol.id && (
              <CardContent className="pt-0 space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-1">Purpose</p>
                  <p className="text-sm text-muted-foreground">{protocol.purpose}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">AI Will Analyze</p>
                  <div className="flex flex-wrap gap-2">
                    {protocol.aiAnalyzes.map((item) => (
                      <Badge key={item} variant="outline" className="text-xs">{item}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-1">Setup</p>
                  <p className="text-sm text-muted-foreground">{protocol.setup}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Step-by-Step Instructions</p>
                  <ol className="space-y-2">
                    {protocol.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#163300] text-[#9FE870] text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1.5">Filming Tips</p>
                  <ul className="space-y-1">
                    {protocol.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                        <span className="mt-0.5">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Play className="w-4 h-4" /> Upload Video Recording
                  </Button>
                  <Button
                    onClick={() => markComplete(protocol.id)}
                    variant={completed.has(protocol.id) ? "outline" : "default"}
                    className={completed.has(protocol.id) ? "border-green-400 text-green-700" : "bg-[#163300] text-white"}
                  >
                    {completed.has(protocol.id) ? "Mark Incomplete" : "Mark Complete"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {completed.size === PROTOCOLS.length && (
        <Card className="border-green-400 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">All video tasks completed!</p>
                <p className="text-sm text-green-700">Your clinician will receive a notification. AI video analysis will be completed within 24–48 hours.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
