export type MemoryMessage = {
  role: string;
  content: string;
  created_at?: string;
};

const API_BASE = "http://127.0.0.1:5050";

export async function getApiKeyStatus(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api_key_status`, { cache: "no-store" });
  const data = await parseResponse(response);
  if (typeof data.configured !== "boolean") throw new Error("Could not read API key status");
  return data.configured;
}

export async function setApiKey(key: string): Promise<void> {
  await parseResponse(await fetch(`${API_BASE}/set_key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  }));
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed (${response.status})`
    );
  }

  return data;
}

export async function sendMessage(userInput: string): Promise<string> {
  const response = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_input: userInput,
    }),
  });

  const data = await parseResponse(response);
  return data.response;
}

export async function getMemory(): Promise<MemoryMessage[]> {
  const response = await fetch(`${API_BASE}/getMemory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await parseResponse(response);
  return data.messages ?? [];
}

export async function resetMemory(): Promise<void> {
  const response = await fetch(`${API_BASE}/memory_reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  await parseResponse(response);
}

export async function getCurrentModel(): Promise<string> {
  const response = await fetch(`${API_BASE}/getCurrLLMModel`);

  const data = await parseResponse(response);
  return data.message ?? "";
}

export async function setModel(model: string): Promise<void> {
  const response = await fetch(`${API_BASE}/setLLMModel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
    }),
  });

  await parseResponse(response);
}

export async function sendInteraction(interactionValue: number): Promise<string> {
  const response = await fetch(`${API_BASE}/doSpecialInteraction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      interaction_value: interactionValue,
    }),
  });

  const data = await parseResponse(response);
  return data.response;
}
