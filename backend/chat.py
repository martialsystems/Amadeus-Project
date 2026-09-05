import memory as store
from llm import get_llm, reset_llm
from pydantic import BaseModel, Field
import random

default_LLM_Model = store.DEFAULT_LLM_MODEL
API_KEY = store.load_api_key()
LLM_Model = store.load_llm_model(default_model=default_LLM_Model)
default_personality = store.load_default_personality_messages()


#pre: The intended new_model is a string e.g., "deepseek/deepseek-v3.2-exp"
#post: global LLM_Model should be changed to new_model
#      LLM_Model.txt should be updated accordingly, to store the latest model the user chose.
def setLLMModel(new_model: str):
    global LLM_Model
    LLM_Model = new_model.strip()
    store.save_llm_model(LLM_Model)
    reset_llm()  # IMPORTANT: recreate ChatOpenAI with the new model
    print("[Amadeus] Model changed to " + LLM_Model)


#pre:
#post: If LLM_Model is empty, return an Error message
#      else, return the LLM Model e.g., "deepseek/deepseek-v3.2-exp"
def getLLMModel():
    global LLM_Model
    return LLM_Model.strip() if LLM_Model else "No Model Selected."


#pre: key_string is a string in the format: "sk-or-v1-566...."
#post: API_KEY set to key_string
#      API_Key.txt should also be updated accordingly.
def setKey(key_string: str):
    global API_KEY
    next_key = key_string.strip()
    store.save_api_key(next_key)
    API_KEY = next_key
    reset_llm()  # IMPORTANT: recreate with new key
    print("[Amadeus] API key updated")


def has_api_key() -> bool:
    return bool(API_KEY.strip())


#pre:
#post: memory.json should be erased
def resetMemory():
    store.reset_memory()
    print("[Amadeus] Memory Reset!")


#pre:
#post: returns a dict of JSON e.g., [{"role": "user", "content": "kurisu"....}....]
def get_raw_memory():
    return store.load_memory_raw()


class AmadeusPack(BaseModel):
    assistant_reply_ENG: str = Field(..., description="English text to show in UI. May include stage directions.")
    assistant_reply_JPS: str = Field(..., description=(
        "Japanese TTS text only. Must be plain spoken Japanese."
        " Allowed: Japanese characters, ASCII letters/digits if needed, and these punctuation marks only: 、。！？"
        " Newlines are allowed. Do NOT include: parentheses/brackets/quotes/asterisks/emojis/markdown/ellipses (…)/colons/semicolons."
        " Avoid long dashes and repeated punctuation.")
    )
    

# pre:
# - message_context is a List[Dict[str, str]] with keys: "role" and "content"
# - message_context contains recent user/assistant messages only (no system persona)
# - default_personality and internal system context are available
# - LLM (via LangChain + OpenRouter) is properly configured
#
# post:
# - returns an AmadeusPack with:
#     - assistant_reply_ENG: English UI text (may include stage directions)
#     - assistant_reply_JPS: Japanese TTS-safe speech text (no stage directions)
# - exactly ONE LLM call is made under normal operation
# - on structured output failure, falls back to a plain LLM call with a safe default Japanese reply
def getResponsePacked(message_context) -> AmadeusPack:
    llm = get_llm(API_KEY, LLM_Model)

    # IMPORTANT: Add a system rule that tells the model exactly what to output.
    pack_rules = {
        "role": "system",
        "content": (
            "Return a JSON object with keys: assistant_reply_ENG, assistant_reply_JPS.\n"
            "\n"
            "assistant_reply_ENG:\n"
            "- Natural English for UI. May include short stage directions in square brackets.\n"
            "- DO NOT USE ... for pauses IT BREAKS TTS"
            "\n"
            "assistant_reply_JPS:\n"
            "- Translate the meaning into natural spoken Japanese dialogue.\n"
            "- Keep it concise. Prefer 1 to 4 sentences.\n"
            "- Do NOT include narration, inner thoughts, or action descriptions.\n"
            "- Sound like a real person speaking, not formal or robotic.\n"
            "- Do not explain anything; respond directly as dialogue.\n"
            "- Avoid ultra short standalone interjections as their own sentence. Attach them to the following sentence when possible.\n"
            "- Mild conversational fillers such as えっと or まあ are allowed but should be used sparingly.\n"
            "- Allowed punctuation: 。 、 ！ ？ only.\n"
            "- Replace … or ... with 。\n"
            "- DO NOT USE … AT ALL---IT BREAKS TTS"
            "- Do NOT output any of these characters: ()[]{}<>\"'`*:_;#@~=|\\/・\n"
            "- If the input contains quotation marks, do not copy them; say the line naturally.\n"
        )
    }

    messages = (
        default_personality
        + [store.load_internal_context()]
        + [pack_rules]
        + message_context
    )

    try:
        structured = llm.with_structured_output(AmadeusPack)
        out: AmadeusPack = structured.invoke(messages)
        return out
    except Exception as e:
        # Fallback: if structured output fails, degrade gracefully
        print("[Amadeus] Packed response parse failed:", repr(e))
        # Fall back to plain response and reuse it as display, with a safe minimal JA
        plain = llm.invoke(messages).content
        return AmadeusPack(
            assistant_reply_ENG=plain, 
            assistant_reply_JPS="ごめん、今ちょっと調子が悪い。もう一回言って。"
            )



# pre:
# - user_message is a non-empty string from the user
# - SQLite memory store is available and writable
# - getResponsePacked(message_context) is defined and functional
#
# post:
# - appends the user message to memory
# - builds recent conversation context from memory
# - calls getResponsePacked(...) exactly once
# - appends assistant_reply_ENG to memory
# - returns an AmadeusPack containing:
#     - assistant_reply_ENG (English UI text)
#     - assistant_reply_JPS (Japanese TTS-safe speech text)
def getOutputPacked(user_message: str) -> str:
    store.append_message("user", user_message)
    context = store.build_prompt_messages()[-80:]

    pack = getResponsePacked(context)

    # Store what the user actually sees
    store.append_message("assistant", pack.assistant_reply_ENG)
    return pack



# ---------- SPECIAL INTERACTIONS ---------- 

INTERACTION_EVENTS = {
    1: "[Interaction event: The user touched your shoulder.]",
    2: "[Interaction event: The user patted your head.]",
    3: "[Interaction event: The user tapped your arm.]",
}

INTERACTION_RESPONSES = {
    1: [
        {"text": "Hey! What do you think you're doing?", "audio_url": None},
        {"text": "Pervert! Keep your hands to yourself!", "audio_url": None},
        {"text": "That was completely inappropriate, you idiot!", "audio_url": None},
        {"text": "Wha—? Explain yourself. Immediately.", "audio_url": None},
        {"text": "Do you have a death wish or are you just exceptionally stupid?", "audio_url": None},
        {"text": "Unbelievable. I'm adding 'personal space invader' to your file", "audio_url": None},
        {"text": "Touch me like that again and I'll have you banned from this lab.", "audio_url": None},
        {"text": "Was there a point to that, or is your intellect solely devoted to juvenile antics?", "audio_url": None},
        {"text": "My chest is not a laboratory interface, you know.", "audio_url": None},
        {"text": "Honestly... your lack of basic social decorum is astounding.", "audio_url": None},

    ],
    2: [
        {"text": "...", "audio_url": None},
        {"text": "...hmph.", "audio_url": None},
        {"text": "......Idiot.", "audio_url": None},
        {"text": "...Just... finish the calculations.", "audio_url": None},
        {"text": "...Fine. For a moment.", "audio_url": None},
        {"text": "...You're messing up my hair... a little.", "audio_url": None},
        {"text": "...I'm not a child, you know.", "audio_url": None},
        {"text": "...Tch.", "audio_url": None},
        {"text": "...Don't stop until I say so.", "audio_url": None},
        {"text": "Your hand is... very warm", "audio_url": None},
    ],
    3: [
        {"text": "You could just say my name.", "audio_url": None},
        {"text": "Hey! I'm right here.", "audio_url": None},
        {"text": "What's up?", "audio_url": None},
    ],
}

# pre:
# - interaction value represents int value of the corresponding interaction. e.g.,
#   1 -> Shoulder touch
#   2 -> Head pat
#   3 -> Arm poke
#
# post:
# - append in format: ("system", "[Interaction event: The user touched your shoulder.]")
# - return the hard coded responses
def SpecialInteraction(interaction_value: int) -> dict:
    event = INTERACTION_EVENTS.get(interaction_value)
    response_variants = INTERACTION_RESPONSES.get(interaction_value)
    if event is None or not response_variants:
        raise ValueError("Unknown interaction")
    # Select the text AND recording together, never independently.
    variant = random.choice(response_variants)
    response = variant["text"]
    store.append_message("user", event)
    store.append_message("assistant", response);    
    return {"response": response, "audio_url": variant.get("audio_url")}



#-----DEBUGGING TOOLS-----

# if __name__ == "__main__":
#     from datetime import datetime, timezone

#     print("OS local:", datetime.now().astimezone().isoformat())
#     print("UTC     :", datetime.now(timezone.utc).isoformat())

#     while True:
#         user_message = input("Enter msg: ").strip()
#         if user_message.lower() in {"no", "exit", "quit"}:
#             break
#         pack = getOutputPacked(user_message)
        

#         print("\n[Amadeus]: ENG:", pack.assistant_reply_ENG)
#         print("[Amadeus]: JPS:", pack.assistant_reply_JPS)
#         print("-" * 60)
