import { SpaceGroup, SynthesisProtocol } from "../types";

export async function getHarmonicSynthesis(group: SpaceGroup, protocol: SynthesisProtocol): Promise<string> {
  try {
    const res = await fetch('/api/synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ group, protocol }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `API error: ${res.status}`);
    }

    const data = await res.json();
    return data.text || "Harmonic synthesis was interrupted. The resonance field failed to stabilize.";
  } catch (error) {
    console.error("Synthesis Stream Error:", error);
    return "Harmonic synthesis was interrupted. The resonance field failed to stabilize.";
  }
}
