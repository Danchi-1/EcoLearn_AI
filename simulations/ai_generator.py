import os
from .procedural_engine import generate_procedural_config
from .llm_bridge import generate_with_llm

def generate_simulation_config(prompt, use_llm=False):
    """
    Main entry point for AI Simulation Generation.
    Prioritizes:
    1. LLM Generation (if requested AND API Key matches)
    2. Procedural Generation (Smart Mix & Match)
    """
    
    # 1. Try LLM (Bonus Feature)
    if use_llm:
        api_key = os.environ.get("LLM_API_KEY")
        if api_key:
            llm_result = generate_with_llm(prompt, api_key)
            if llm_result:
                return llm_result
            else:
                # If LLM requested but failed, we could log it.
                # For now, fallback silently or maybe return error? 
                # Falling back to procedural is safer for user experience.
                pass 

    # 2. Procedural Fallback (Robust, Local)
    return generate_procedural_config(prompt)
