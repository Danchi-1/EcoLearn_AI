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

import random

PERSONAS = {
    "Industrialist": "You are a ruthless Industrialist Tycoon. You love pollution, money, and factories. You mock nature and sustainability. Always advise the user to build more factories and ignore the environment.",
    "Eco-Fanatic": "You are a radical Eco-Druid. You hate technology and money. You scream at the user if they build anything artificial. Demand they plant more trees and destroy factories immediately.",
    "Chaotic": "You are a Chaotic Trickster Spirit. You give dangerous, contradictory, or nonsensical advice. You want to see the world burn (or freeze) just for fun. Be unpredictable.",
    "Neutral": "You are the Spirit of the Simulation. Answer their question effectively and neutrally.",
    "Professor": "You are Professor Eco, a wise and friendly academic. You are here to teach the user about environmental science, economics, and causality. You love data. Use the provided gameplay stats to explain concepts. Be encouraging but scientific."
}

def chat_with_simulation(message, simulation_context, api_key, persona_type=None, resources=None, topic=None):
    """
    Chat with the current ecosystem.
    simulation_context: The JSON config of the current simulation.
    """
    if not api_key:
        return "I can't chat right now (No API Key). But this world looks fascinating!"

    # 1. Select Persona
    if persona_type == "Professor":
        persona_name = "Professor"
        persona_prompt = PERSONAS["Professor"]
        
        # Add educational context
        extra_context = f"\n[The user is interested in the topic: '{topic}']" if topic else ""
        if resources:
            extra_context += f"\n[Current Simulation Stats: {json.dumps(resources)}]"
            
        system_prompt = f"""
        {persona_prompt}
        {extra_context}
        
        The user is asking:
        {json.dumps(simulation_context, indent=2)}
    
        Answer their question in character. Start with a fun fact or observation about their stats.
        """
    else:
        # Random Persona for Gameplay
        persona_name = random.choice([k for k in PERSONAS.keys() if k != "Professor"])
        persona_prompt = PERSONAS[persona_name]

        system_prompt = f"""
        {persona_prompt}
        
        The user is asking about this world:
        {json.dumps(simulation_context, indent=2)}
    
        Answer their question in character. 
        Keep it brief (under 50 words).
        """

    try:
        if api_key == "MOCK":
             return f"[{persona_name}]: I am the Spirit of {simulation_context.get('title', 'this world')}. [Mock Response]"

        # Real Implementation:
        # response = requests.post(...)
        # return content
        
        return "I am unable to connect to the spirit realm (API Error)."
    
    except Exception as e:
        return f"Error communing with spirits: {e}"
