/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from "node-fetch";

const API_KEY = 'AIzaSyBOIImI98soYKCn4W61qdfSJm0bT3grNdI';

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`, // ✅ note ?key=
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to list models: ${res.statusText}`);
  }

  const data = (await res.json()) as { models: { name: string; supportedGenerationMethods: string[] }[] };
  console.log("✅ Available models:\n");
  data.models.forEach((m: any) => {
    console.log(`• ${m.name}`, m.supportedGenerationMethods);
  });
}

listModels();
