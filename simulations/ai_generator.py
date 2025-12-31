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
                # llm_result is now {'reasoning': str, 'config': dict}
                # If config is None (e.g. mock mode), we fall back to procedural
                # but we could potentially attach the reasoning to the procedural result?
                
                config = llm_result.get('config')
                reasoning = llm_result.get('reasoning')
                
                if config:
                    config['ai_reasoning'] = reasoning # Store reasoning in the config
                    return config
                
                # If config is None (Mock), fall through to procedural
                # We could print reasoning for debugging
                print(f"AI Reasoning (Mock): {reasoning}")
            else:
                pass 

    # 2. Procedural Fallback (Robust, Local)
    return generate_procedural_config(prompt)
