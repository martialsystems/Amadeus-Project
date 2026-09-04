export type MemoryMessage = { role: string; content: string; created_at?: string };
const API_BASE = "http://127.0.0.1:5000";
async function parseResponse(response: Response) { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`); return data; }
export async function sendMessage(userInput: string): Promise<string> { const response = await fetch(`${API_BASE}/`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user_input:userInput})}); const data = await parseResponse(response); return data.response; }
export async function getMemory(): Promise<MemoryMessage[]> { const response = await fetch(`${API_BASE}/getMemory`, {method:"POST",headers:{"Content-Type":"application/json"}}); const data = await parseResponse(response); return data.messages ?? []; }
export async function resetMemory(): Promise<void> { const response = await fetch(`${API_BASE}/memory_reset`, {method:"POST",headers:{"Content-Type":"application/json"}}); await parseResponse(response); }
export async function getCurrentModel(): Promise<string> { const response = await fetch(`${API_BASE}/getCurrLLMModel`); const data = await parseResponse(response); return data.message ?? ""; }
export async function setModel(model: string): Promise<void> { const response = await fetch(`${API_BASE}/setLLMModel`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model})}); await parseResponse(response); }
