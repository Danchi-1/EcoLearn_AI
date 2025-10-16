from openai import OpenAI
from datetime import datetime, timedelta

client = OpenAI()
class EcoLearnChatbot:
    def __init__(self):
        self.conversation_history = []
        self.last_interaction_time = None
        self.inactivity_threshold = timedelta(minutes=30)  # 30 minutes threshold

    def get_response(self, user_input: str) -> str:
        current_time = datetime.now()
        if self.last_interaction_time and (current_time - self.last_interaction_time) > self.inactivity_threshold:
            self.reset_conversation()
        
        self.last_interaction_time = current_time
        self.conversation_history.append({"role": "user", "content": user_input})
        
        # Simulate response generation (replace with actual model call)
        response = f"Echo: {user_input}"
        
        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    def reset_conversation(self):
        self.conversation_history = []
        self.last_interaction_time = None

    def process_message(self, message: str, user_id: int = None) -> Dict:
        response_text = self.get_response(message)
        
        # Here you would parse the response to check if a simulation was created
        # For demonstration, let's assume any message containing "create simulation" creates one
        if "create simulation" in message.lower():
            simulation_data = {
                "title": "Sample Simulation",
                "description": "This is a sample simulation created based on your prompt.",
                "parameters": {}
            }
            return {
                "type": "simulation_created",
                "simulation_data": simulation_data,
                "response": response_text
            }
        else:
            return {
                "type": "message",
                "response": response_text,
                "suggestions": ["Try asking to create a simulation!"]
            }