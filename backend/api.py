from flask import Flask, request, jsonify
from flask_cors import CORS

from chat import (
    getOutputPacked,
    setKey,
    has_api_key,
    resetMemory,
    setLLMModel,
    getLLMModel,
    get_raw_memory,
    SpecialInteraction,
)

from tts import streamVoice

from flask_cors import CORS
import threading

application = Flask(__name__)
CORS(application)

# pre:
# - JSON body contains an "key" field
#
# post:
# - updates the active API key if provided
# - returns status indicating success or error
@application.route("/set_key", methods=["POST"])
def set_api_key():
    print("[Flask] /set_key route triggered")  # ← add this
    data = request.get_json(silent=True)
    key = data.get("key") if isinstance(data, dict) else None
    if isinstance(key, str) and key.strip():
        try:
            setKey(key.strip())
        except OSError:
            return jsonify({"message": "Could not save API key"}), 500
        return jsonify({"status": "ok", "message": "API key received"})
    else:
        return jsonify({"status": "error", "message": "No key received"}), 400


@application.route("/api_key_status", methods=["GET"])
def api_key_status():
    response = jsonify({"configured": has_api_key()})
    response.headers["Cache-Control"] = "no-store"
    return response

# pre:
# - JSON body contains "user_input" as a string
#
# post:
# - generates an assistant response and voice output
# - returns English UI text to the client
@application.route("/", methods=["POST"])
def request_message():
    if not has_api_key():
        return jsonify({"message": "No API key. Add one in Settings."}), 400
    print("[Flask] / route triggered")  
    content = request.get_json()
    user_input = content.get("user_input", "")

    pack = getOutputPacked(user_input)
    print("\n[Flask]: ENG:", pack.assistant_reply_ENG)
    print("[Flask]: JPS:", pack.assistant_reply_JPS)
    
    # Synthesize and play Japanese sentence-by-sentence in the background.
    # The English response can return immediately instead of waiting for all TTS.
    threading.Thread(
        target=streamVoice,
        args=(pack.assistant_reply_JPS,),
        name="amadeus-tts-stream",
        daemon=True,
    ).start()

    return jsonify({"response": pack.assistant_reply_ENG})

# pre
# post:
# - clears all stored conversation memory
# - returns confirmation status
@application.route("/memory_reset", methods=["POST"])
def memory_reset():
    print("[Flask] /memory_reset triggered")  
    resetMemory()
    return jsonify({"status": "ok", "message": "Memory reset"})


# pre:
# - JSON body contains "model" option as string
#
# post:
# - updates the active LLM model if provided
# - returns success or error status
@application.route("/setLLMModel", methods=["POST"])
def settingLLMModel():
    print("[Flask] /setLLMModel triggered")  
    data = request.get_json() or {}
    new_model = data.get("model", "").strip()
    if new_model:
        setLLMModel(new_model)
        return jsonify({"status": "ok", "message": "new model recieved!"})
    else:
        return jsonify({"status": "error", "message": "No model recieved"}), 400

# pre
# post:
# - returns the currently active LLM model name as a string
@application.route("/getCurrLLMModel", methods=["GET"])
def getCurrLLMModel():
    print("[Flask] /getCurrLLMModel triggered")  
    LLM_Model = getLLMModel()
    if LLM_Model:
        return jsonify({"status": "ok", "message": LLM_Model})
    else:
        return jsonify({"status": "error", "message": "No Model Selected"}), 400

# pre
# post:
# - returns all stored conversation messages in list of Jsons
@application.route("/getMemory", methods=["POST"])
def getMemory():
    print("[Flask] /getMemory triggered")  
    msgs = get_raw_memory()
    return jsonify({"status":"ok","messages": msgs})

# pre: Interaction number is given. e.g., 1,2,3
# post: use SpecialInteraction() from chat to update accordingly
@application.route("/doSpecialInteraction", methods=["POST"])
def doSpecialInteraction():
    data = request.get_json(silent=True)
    interaction_value = data.get("interaction_value")
    response = SpecialInteraction(interaction_value)

    return jsonify({
    "status": "ok",
    "response": response,
    })
