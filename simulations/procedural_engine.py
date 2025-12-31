import random
import re

# --- DATA POOLS ---

BIOMES = [
    { "name": "Space", "bg": "#000000", "keywords": ["space", "void", "star", "mars"], "valid_tags": ["space", "tech", "future"] },
    { "name": "Grassland", "bg": "#27ae60", "keywords": ["grass", "field", "farm", "park", "forest"], "valid_tags": ["nature", "grass", "forest", "animal", "farm", "wild"] },
    { "name": "Desert", "bg": "#d35400", "keywords": ["desert", "sand", "dune", "heat"], "valid_tags": ["desert", "sand", "nature", "wild"] },
    { "name": "Ocean", "bg": "#2980b9", "keywords": ["ocean", "water", "blue", "sea"], "valid_tags": ["water", "ocean", "nature", "animal"] },
    { "name": "Snow", "bg": "#ecf0f1", "keywords": ["ice", "snow", "cold", "winter"], "valid_tags": ["snow", "cold", "nature", "wild"] },
    { "name": "City", "bg": "#95a5a6", "keywords": ["city", "urban", "road", "concrete", "town"], "valid_tags": ["city", "urban", "building", "tech", "modern", "industry"] }
]

CURRENCIES = [
    { "name": "Gold", "keywords": ["gold", "medieval", "kingdom"], "valid_tags": ["medieval", "magic", "fantasy"] },
    { "name": "Credits", "keywords": ["future", "cyber", "scifi", "tech"], "valid_tags": ["future", "tech", "cyber", "space"] },
    { "name": "Dollars", "keywords": ["modern", "city", "business", "money"], "valid_tags": ["city", "modern", "building", "industry"] },
    { "name": "Mana", "keywords": ["magic", "wizard", "fantasy"], "valid_tags": ["magic", "fantasy", "medieval"] },
    { "name": "Energy", "keywords": ["robot", "machine", "tech", "power"], "valid_tags": ["tech", "building", "future"] },
    { "name": "Bottle Caps", "keywords": ["waste", "trash", "apocalypse"], "valid_tags": ["wild", "scavenge", "waste"] }
]

ENTITIES = [
    # NATURE
    { "id": "tree", "name": "Tree", "icon": "🌳", "desc": "Provides shade.", "tags": ["nature", "grass", "forest"] },
    { "id": "rock", "name": "Rock", "icon": "🪨", "desc": "Just a rock.", "tags": ["nature", "desert", "mountain", "wild"] },
    { "id": "cactus", "name": "Cactus", "icon": "🌵", "desc": "Spiky plant.", "tags": ["nature", "desert"] },
    { "id": "flower", "name": "Flower", "icon": "🌻", "desc": "Pretty.", "tags": ["nature", "garden", "grass"] },
    
    # ANIMALS
    { "id": "cow", "name": "Cow", "icon": "🐄", "desc": "Moo.", "tags": ["animal", "farm", "grass"] },
    { "id": "wolf", "name": "Wolf", "icon": "🐺", "desc": "Howl.", "tags": ["animal", "wild", "forest", "snow"] },
    { "id": "fish", "name": "Fish", "icon": "🐟", "desc": "Glub glub.", "tags": ["animal", "water", "ocean"] },
    { "id": "alien", "name": "Alien", "icon": "👽", "desc": "Take me to your leader.", "tags": ["animal", "space", "future"] },
    { "id": "penguin", "name": "Penguin", "icon": "🐧", "desc": "Waddle.", "tags": ["animal", "snow", "water"] },
    
    # BUILDINGS
    { "id": "house", "name": "House", "icon": "🏠", "desc": "People live here.", "tags": ["building", "city", "town", "modern"] },
    { "id": "castle", "name": "Castle", "icon": "🏰", "desc": "Seat of power.", "tags": ["building", "medieval", "fantasy"] },
    { "id": "factory", "name": "Factory", "icon": "🏭", "desc": "Makes things.", "tags": ["building", "industry", "city"] },
    { "id": "tent", "name": "Tent", "icon": "⛺", "desc": "Camping.", "tags": ["building", "wild", "nature"] },
    { "id": "skyscraper", "name": "Skyscraper", "icon": "🏙️", "desc": "Office space.", "tags": ["building", "city", "modern"] },
    
    # TECH / MAGIC
    { "id": "robot", "name": "Robot", "icon": "🤖", "desc": "Beep boop.", "tags": ["tech", "future", "city"] },
    { "id": "rocket", "name": "Rocket", "icon": "🚀", "desc": "To the moon!", "tags": ["tech", "space", "future"] },
    { "id": "potion", "name": "Potion Shop", "icon": "🧪", "desc": "Magical brews.", "tags": ["magic", "fantasy", "medieval"] },
    { "id": "crystal", "name": "Mana Crystal", "icon": "💎", "desc": "Glowing.", "tags": ["magic", "fantasy"] },
    { "id": "computer", "name": "Supercomputer", "icon": "🖥️", "desc": "Computing data.", "tags": ["tech", "future", "city"] }
]

class TextParser:
    def __init__(self):
        self.verbs_positive = ["produces", "creates", "generates", "yeilds", "provides", "increases", "restores"]
        self.verbs_negative = ["consumes", "eats", "destroys", "reduces", "needs", "requires", "depletes", "damages"]
        
    def parse(self, text):
        """
        Parses text to find entities, resources, and their relationships.
        Returns: {
            "entities": [{"name": "Goat", "effects": {"soil": -5}}],
            "resources": ["soil", "food"]
        }
        """
        data = {
            "entities": {},
            "resources": set(["money"]), # Default resource
            "detected": False
        }
        
        # Split into lines/sentences
        sentences = re.split(r'[.\n]', text)
        
        for sent in sentences:
            sent = sent.strip()
            if not sent: continue
            
            # 1. Simple Definition: "Goats: high reproduction, destroy soil"
            if ":" in sent:
                parts = sent.split(":")
                subject = parts[0].strip()
                desc = parts[1].strip()
                
                # Check if subject is an entity candidate (capitalized or simple word)
                if len(subject.split()) <= 2:
                    self._add_entity(data, subject, desc)
                    
            # 2. Sentences: "Predators reduce overgrazing"
            else:
                # Naive Subject-Verb-Object detection
                words = sent.split()
                # If starts with noun
                if words[0][0].isupper() or len(words) < 10:
                     # Look for impact verbs
                     for i, w in enumerate(words):
                         if w.lower() in self.verbs_positive + self.verbs_negative:
                             subject = " ".join(words[:i])
                             target = " ".join(words[i+1:])
                             effect = 10 if w.lower() in self.verbs_positive else -10
                             
                             # Clean target (remove punctuation)
                             target = re.sub(r'[^\w\s]', '', target).strip().lower()
                             # Take last word as resource key usually (e.g. "destroy the soil" -> "soil")
                             if target:
                                res_key = target.split()[-1]
                                self._add_effect(data, subject, res_key, effect)
        
        # Determine if we successfully parsed enough to take over
        if len(data["entities"]) >= 1:
            data["detected"] = True
            
        return data

    def _add_entity(self, data, name, desc):
        # Clean name
        name = re.sub(r'[^\w\s]', '', name).strip()
        name_key = name.lower()
        
        if name_key not in data["entities"]:
            data["entities"][name_key] = {
                "name": name,
                "description": desc,
                "effects": {},
                "cost": {}
            }
            
        # Try to parse effects from description
        # "destroy soil", "high reproduction"
        desc_parts = [p.strip() for p in desc.split(",")]
        for p in desc_parts:
            words = p.split()
            for w in words:
                w_lower = w.lower()
                if w_lower in self.verbs_negative:
                    # simplistic: look for noun after
                    idx = words.index(w)
                    if idx + 1 < len(words):
                        res = words[idx+1].lower()
                        self._add_effect(data, name, res, -5)
                elif w_lower in self.verbs_positive:
                    idx = words.index(w)
                    if idx + 1 < len(words):
                        res = words[idx+1].lower()
                        self._add_effect(data, name, res, 5)
                
                # Special cases mentioned by user
                if "reproduction" in w_lower:
                    self._add_effect(data, name, "population", 2)
    
    def _add_effect(self, data, entity_name, res_name, value):
        entity_name = re.sub(r'[^\w\s]', '', entity_name).strip().lower()
        if entity_name not in data["entities"]:
             data["entities"][entity_name] = {
                "name": entity_name.capitalize(),
                "description": "Custom entity",
                "effects": {},
                "cost": {}
            }
            
        # Add resource
        res_name = res_name.lower()
        # Filter junk resources
        if len(res_name) < 3 or res_name in ["the", "a", "it"]: return
        
        data["resources"].add(res_name)
        data["entities"][entity_name]["effects"][res_name] = value

def generate_procedural_config(prompt):
    # 0. Try Adaptive Parsing first
    print(f"DEBUG: Unknown Prompt received: {repr(prompt)}")
    parser = TextParser()
    try:
        parsed_data = parser.parse(prompt)
        print(f"DEBUG: Parsed Data: {parsed_data}")
        
        if parsed_data["detected"]:
            # Build config from parsed data
            entities_list = []
            for key, ent in parsed_data["entities"].items():
                
                # Cost logic: if gives pos effect, costs money. if neg effect, maybe costs less?
                cost_val = 100
                
                # Simple Icon Mapper
                icon = "📦"
                lower_name = ent["name"].lower()
                if "goat" in lower_name: icon = "🐐"
                elif "soil" in lower_name: icon = "🟤"
                elif "tree" in lower_name: icon = "🌳"
                elif "water" in lower_name: icon = "💧"
                elif "fire" in lower_name: icon = "🔥"
                elif "predator" in lower_name or "wolf" in lower_name: icon = "🐺"
                elif "elephant" in lower_name: icon = "🐘"
                elif "grass" in lower_name: icon = "🌿"
                else: icon = "📦"
                
                new_ent = {
                    "id": f"{key}_{random.randint(100,999)}",
                    "name": ent["name"],
                    "icon": icon,
                    "description": ent["description"],
                    "cost": { "budget": cost_val },
                    "effects": ent["effects"]
                }
                entities_list.append(new_ent)
                
            # Clean resources
            global_res = { "budget": 1000 }
            for r in parsed_data["resources"]:
                global_res[r] = 50
                
            return {
                "title": "Custom Simulation",
                "description": "Adaptive simulation based on your rules.",
                "grid": { "width": 12, "height": 8, "background_color": "#95a5a6" },
                "global_resources": global_res,
                "entities": entities_list
            }
    except Exception as e:
        print(f"Parser failed: {e}")
        # Continue to fallback

    # Fallback to Standard Procedural Logic
    prompt_lower = prompt.lower()
    
    # 1. Select Biome
    selected_biome = random.choice(BIOMES)
    for b in BIOMES:
        for k in b["keywords"]:
            if k in prompt_lower:
                selected_biome = b
                break
    
    # 2. Select Currency
    selected_currency = random.choice(CURRENCIES)
    for c in CURRENCIES:
        for k in c["keywords"]:
            if k in prompt_lower:
                selected_currency = c
                break
    
    # 3. Intelligent Entity Selection
    # Combine valid tags from Biome and Currency to form a "Theme Filter"
    allowed_tags = set(selected_biome.get("valid_tags", []) + selected_currency.get("valid_tags", []))
    
    matching_pool = []
    
    for ent in ENTITIES:
        # Strict Match: Entity MUST share a tag with the environment
        if any(tag in allowed_tags for tag in ent["tags"]):
            matching_pool.append(ent)
            
    # Select entities
    chosen_entities = []
    
    # Try to pick 4-6 entities
    target_count = random.randint(4, 6)
    
    if len(matching_pool) >= target_count:
        chosen_entities = random.sample(matching_pool, target_count)
    else:
        # If not enough matches, take all matches
        chosen_entities = matching_pool
        # If drastically low (less than 3), we might need to relax rules or duplicate?
        # For now, let's just stick to what we have to ensure coherence. 
        # A small, coherent world is better than a broken one.
        
    # 4. Construct Final Entity Configs
    final_entities_config = []
    c_name = selected_currency["name"].lower()
    
    for ent in chosen_entities:
        cost_val = random.randint(50, 500)
        effect_val = random.randint(1, 10)
        
        new_ent = {
            "id": f"{ent['id']}_{random.randint(100,999)}",
            "name": ent["name"],
            "icon": ent["icon"],
            "description": ent["desc"],
            "cost": { c_name: cost_val },
            "effects": { "score": effect_val }
        }
        
        # Add Trade-offs (Upkeep / Pollution)
        # 1. Maintenance Cost (50% chance for high-cost items)
        if cost_val > 200 and random.random() > 0.5:
            new_ent["effects"][c_name] = -random.randint(5, 15) # Drains currency!
            new_ent["description"] += " Needs upkeep."
            
        # 2. Pollution (30% chance for tech/industry items)
        if "tech" in ent["tags"] or "industry" in ent["tags"]:
             if random.random() > 0.7:
                 new_ent["effects"]["pollution"] = random.randint(2, 8)
                 new_ent["description"] += " Pollutes."
                 
        final_entities_config.append(new_ent)
        
    # 5. Title
    if len(prompt) < 25 and prompt.strip().replace(" ", "").isalpha(): # Check if it's a clean title
        title = prompt.title()
    else:
        title = f"{selected_biome['name']} {selected_currency['name']} World"

    return {
        "title": title,
        "description": f"A generated {selected_biome['name']} world run on {selected_currency['name']}.",
        "grid": {
            "width": 12,
            "height": 8,
            "background_color": selected_biome["bg"]
        },
        "global_resources": {
            c_name: 1000,
            "score": 0,
            "pollution": 0
        },
        "entities": final_entities_config
    }
