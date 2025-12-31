import os
import json
import requests
import re

def generate_with_llm(prompt, api_key):
    """
    Attempts to generate a simulation config using an external LLM API.
    Returns a dict with 'config' (json) and 'reasoning' (str).
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

    system_prompt = f"""
    You are a Game Designer API. 
    Step 1: Write a short paragraph analyzing the user's theme and explaining your design choices (mechanics, resources, balance).
    Step 2: Output a JSON block matching this schema: {schema_desc}.
    
    Output format:
    [DESIGN]
    ... your reasoning ...
    [/DESIGN]
    
    ```json
    ... your json ...
    ```
    """

    try:
        # NOTE: This implementation is a framework. 
        # Since we cannot make real API calls without a key, we mock the behavior if key is "MOCK"
        
        if api_key == "MOCK":
            # Simulate a "Thinking" response
            return {
                "reasoning": f"Analyzing theme '{prompt}'... efficient mechanics selected for maximum engagement.",
                "config": None # Returning None here will trigger the fallback to procedural engine, 
                               # but in a real app, this would be the parsed JSON.
            }

        # Real Implementation Skeleton:
        # response = requests.post("https://api.openai.com/v1/chat/completions", headers=..., json=...)
        # content = response.json()['choices'][0]['message']['content']
        
        # Example Content parsing:
        # reasoning_match = re.search(r'\[DESIGN\](.*?)\[/DESIGN\]', content, re.DOTALL)
        # reasoning = reasoning_match.group(1).strip() if reasoning_match else "No design notes provided."
        
        # json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
        # config = json.loads(json_match.group(1)) if json_match else None
        
        # return {"reasoning": reasoning, "config": config}

        print(f"LLM Bridge received Prompt: {prompt}. (Configure Real API Call in `simulations/llm_bridge.py`)")
        return None 

    except Exception as e:
        print(f"LLM Bridge Error: {e}")
        return None

def chat_with_simulation(message, simulation_context, api_key):
    """
    Chat with the current ecosystem.
    simulation_context: The JSON config of the current simulation.
    """
    if not api_key:
        return "I can't chat right now (No API Key). But this world looks fascinating!"

    system_prompt = f"""
    You are the Spirit of the Simulation. 
    The user is asking about this world:
    {json.dumps(simulation_context, indent=2)}

    Answer their question in character, explaining the mechanics or lore of this specific world.
    Keep it brief (under 50 words).
    """

    try:
        if api_key == "MOCK":
             return f"I am the Spirit of {simulation_context.get('title', 'this world')}. [Mock Response]"

        # Real Implementation:
        # response = requests.post(...)
        # return content
        
        return "I am unable to connect to the spirit realm (API Error)."
    
    except Exception as e:
        return f"Error communing with spirits: {e}"
