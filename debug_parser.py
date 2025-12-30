from simulations.procedural_engine import generate_procedural_config
import sys

prompt = """
Species Traits (This Is Where Depth Lives)

Each species has:

Reproduction rate

Resilience (disease, climate)

Migration tendency

Trophic efficiency (how much food → population)

Example:

Goats: high reproduction, destroy soil

Elephants: low reproduction, reshape terrain

Predators reduce overgrazing but risk extinction
"""

try:
    print("Attempting generation...")
    config = generate_procedural_config(prompt)
    print("Success!")
    print(config)
except Exception as e:
    print("CRASHED:")
    print(e)
    import traceback
    traceback.print_exc()
