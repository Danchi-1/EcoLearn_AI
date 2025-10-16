import json
import random
import os
from typing import Dict, List, Optional
import logging
from datetime import datetime, timedelta
from nlp_chatbot import EcoLearnChatbot

class SimulationGenerator:
    def __init__(self):
        self.setup_logging()
        self.chatbot = EcoLearnChatbot()
        self.ensure_directories()
        
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def ensure_directories(self):
        """Ensure required directories exist"""
        directories = [
            "simulations/custom/user_sims",
            "simulations/core",
            "data"
        ]
        
        for directory in directories:
            if not os.path.exists(directory):
                os.makedirs(directory)
    
    def generate_from_prompt(self, prompt: str, user_id: int = None) -> Dict:
        """Generate a simulation from natural language prompt"""
        try:
            # Use chatbot to process the prompt
            response = self.chatbot.process_message(prompt, user_id)
            
            if response['type'] == 'simulation_created':
                # Save the simulation
                sim_data = response['simulation_data']
                sim_id = self._save_simulation(sim_data, user_id)
                
                if sim_id:
                    return {
                        'success': True,
                        'simulation_id': sim_id,
                        'simulation_data': sim_data,
                        'message': 'Simulation created successfully!'
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Failed to save simulation'
                    }
            else:
                return {
                    'success': False,
                    'message': response['response'],
                    'suggestions': response.get('suggestions', [])
                }
                
        except Exception as e:
            self.logger.error(f"Error generating simulation: {e}")
            return {
                'success': False,
                'message': 'Error creating simulation. Please try again.',
                'error': str(e)
            }
    
    def _save_simulation(self, sim_data: Dict, user_id: int = None) -> str:
        """Save simulation to file"""
        try:
            # Generate unique simulation ID
            sim_id = f"sim_{random.randint(1000, 9999)}"
            
            # Add metadata
            sim_data['id'] = sim_id
            sim_data['created_by'] = user_id
            sim_data['created_at'] = str(int(datetime.now().timestamp()))
            sim_data['type'] = 'custom'
            sim_data['version'] = '1.0'
            
            # Save to file
            filename = f"simulations/custom/user_sims/{sim_id}.json"
            with open(filename, 'w') as f:
                json.dump(sim_data, f, indent=2)
            
            self.logger.info(f"Saved simulation {sim_id}")
            return sim_id
            
        except Exception as e:
            self.logger.error(f"Error saving simulation: {e}")
            return None
    
    def get_simulation_templates(self) -> List[Dict]:
        """Get available simulation templates"""
        return [
            {
                'id': 'solar_school',
                'name': 'Solar-Powered School',
                'description': 'Design and manage a school powered by renewable energy',
                'category': 'renewable_energy',
                'difficulty': 'intermediate'
            },
            {
                'id': 'eco_village',
                'name': 'Sustainable Eco-Village',
                'description': 'Manage a self-sufficient sustainable community',
                'category': 'sustainability',
                'difficulty': 'advanced'
            },
            {
                'id': 'carbon_tracker',
                'name': 'Carbon Footprint Tracker',
                'description': 'Track and reduce personal carbon emissions',
                'category': 'climate_action',
                'difficulty': 'beginner'
            },
            {
                'id': 'green_farm',
                'name': 'Sustainable Smart Farm',
                'description': 'Manage an eco-friendly farm with smart technology',
                'category': 'agriculture',
                'difficulty': 'intermediate'
            },
            {
                'id': 'eco_factory',
                'name': 'Green Manufacturing Plant',
                'description': 'Run a zero-waste manufacturing facility',
                'category': 'industry',
                'difficulty': 'advanced'
            }
        ]
    
    def validate_simulation(self, sim_data: Dict) -> Dict:
        """Validate simulation data structure"""
        required_fields = ['title', 'description', 'goals', 'parameters', 'actions']
        
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        # Check required fields
        for field in required_fields:
            if field not in sim_data:
                validation_result['valid'] = False
                validation_result['errors'].append(f"Missing required field: {field}")
        
        # Validate actions structure
        if 'actions' in sim_data:
            for i, action in enumerate(sim_data['actions']):
                if 'name' not in action:
                    validation_result['errors'].append(f"Action {i} missing 'name' field")
                if 'effect' not in action:
                    validation_result['warnings'].append(f"Action {i} missing 'effect' field")
        
        # Validate parameters
        if 'parameters' in sim_data:
            params = sim_data['parameters']
            if not isinstance(params, dict):
                validation_result['errors'].append("Parameters must be a dictionary")
        
        return validation_result