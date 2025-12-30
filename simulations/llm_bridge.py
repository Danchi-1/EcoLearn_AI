import os
import json
import requests

def generate_with_llm(prompt, api_key):
    """
    Attempts to generate a simulation config using an external LLM API.
    Returns None if generation fails or API key is invalid.
    """
    if not api_key:
        return None

    # Schema definition for the LLM to follow
    schema_desc = """
    {
        "title": "string",
        "description": "string",
        "grid": { "width": int, "height": int, "background_color": "hex_string" },
        "global_resources": { "resource_name": int },
        "entities": [
            {
                "id": "string_id",
                "name": "string",
                "icon": "emoji_char",
                "description": "string",
                "cost": { "resource_name": int },
                "effects": { "resource_name": int }
            }
        ]
    }
    """

    system_prompt = f"You are a Game Designer API. Convert the user prompt into a JSON simulation config matching this schema: {schema_desc}. Output ONLY JSON."

    try:
        # Example: Using a hypothetical standard OpenAI-compatible endpoint
        # In a real scenario, this would rely on the specific provider (OpenAI, Gemini, Anthropic)
        
        # Mocking the call for now as we don't have a real key in current context
        # But this structure allows the user to drop in their logic.
        
        if "MOCK_FAIL" in api_key:
             return None

        # Real implementation would look like:
        # response = requests.post("https://api.openai.com/v1/chat/completions", headers=..., json=...)
        # return json.loads(response.json()['choices'][0]['message']['content'])
        
        print(f"LLM Bridge received Prompt: {prompt} with Key: {api_key[:5]}...")
        return None # Return None to fall back to procedural for this demo

    except Exception as e:
        print(f"LLM Bridge Error: {e}")
        return None
