# 🌿 EcoLearn AI

**EcoLearn AI** is an interactive climate education platform that empowers users to learn about renewable energy, sustainability, and environmental impact through gamified simulations and AI-powered dashboards.

---

## 🚀 Features

### ✅ Completed Features

- 🔐 **User Authentication**:
  - Sign up, login, and logout with secure password hashing.
  - Confirm password matching on signup.
  - Role-based registration (student, teacher, admin).

- 🧠 **AI-Styled Learning Dashboard**:
  - Personalized dashboard that fetches user data (name, email, role).
  - Dashboard accessible only after login (protected route).

- 🎨 **Modern Frontend UI**:
  - Clean, responsive design using CSS custom properties.
  - Loading screen with animated spinning leaves.
  - Orbiting earth + floating planet animation.
  - Animated particles on landing page.

- 📬 **Password Reset Flow**:
  - Forgot password form triggers secure token-based reset link.
  - Password can be securely updated via `/reset-password?token=...`.

- 🧭 **Conditional Navigation**:
  - Dashboard link adapts based on authentication status.
  - Login and Signup buttons hide after user logs in.

---

## 🧩 Planned Features

- 📊 Track Learning Progress:
  - Progress ring, badges, carbon savings, and leaderboards.

- 🤝 Community Features:
  - Peer challenges, shared simulations, and eco-actions.

- 🤖 AI Integration:
  - Smart simulation recommendation engine.
  - Carbon footprint estimators using ML.

- 📈 Admin & Analytics Dashboard:
  - Role-based access to deeper stats (for teachers, admins).

---

## 🛠️ Technologies

| Layer         | Tech Stack                         |
|--------------|------------------------------------|
| Frontend     | HTML, CSS (with custom variables), Vanilla JS |
| Backend      | Flask (Python)                     |
| Database     | SQLite3                            |
| Security     | Werkzeug password hashing, tokens  |
| Animation    | CSS keyframes + transitions        |

---

## 🗂️ Project Structure

EcoMind-AI/
│
├── main.py                          # App entry point
│
├── frontend/                        # All client-side files (HTML, CSS, JS)
│   ├── index.html                   # Homepage (sign up / sign in)
│   ├── dashboard.html               # Learner dashboard
│   ├── simulation.html              # Simulation interface
│   ├── create_simulation.html       # UI for custom simulation builder
│   │
│   ├── css/
│   │   ├── style.css                # Main styles
│   │   └── dashboard.css           # Dashboard-specific styling
│   │
│   ├── js/
│   │   ├── auth.js                  # Sign up / login logic
│   │   ├── simulation.js           # Dynamic simulation handling
│   │   ├── builder.js              # JS for creating new simulations
│   │   └── dashboard.js            # UI interactivity (badges, progress, etc.)
│   │
│   └── assets/
│       ├── fonts/
│       ├── images/
│       └── icons/
|
├── ai_module/
│   ├── recommender.py               # Personalized learning path
│   ├── nlp_chatbot.py               # Interactive AI chatbot
│   └── analytics.py                 # Track learner performance & impact
│
├── simulations/
│   ├── core/                        # Built-in simulations
│   │   ├── solar_school.py
│   │   ├── eco_village.py
│   │   └── carbon_tracker.py
│   │
│   ├── custom/                      # User/teacher-created simulations
│   │   ├── template.json            # JSON schema/template for making new simulations
│   │   └── user_sims/               # Uploaded/created simulation files
│   │       ├── sim_green_farm.json
│   │       └── sim_plastic_factory.json
│   │
│   └── simulation_engine.py         # Logic to load and run both core & custom simulations
│
├── simulation_builder/              # Interface for creating new simulations
│   ├── builder_ui.py                # Drag-and-drop interface (if frontend)
│   └── validator.py                 # Validates custom simulations against schema
│
├── content/
│   ├── lessons/                     # Structured educational content
│   ├── quizzes/                     # Auto-graded quizzes
│   └── challenges/                  # Daily eco-tasks
│
├── user_system/
│   ├── auth.py                      # Sign up, sign in, sign out
│   ├── user_profiles.py             # Handles user data and preferences
│   ├── admin.py                     # Admin controls
│   └── roles.py                     # Role-based access (Student, Teacher, Admin)
│
├── ui/
│   ├── dashboard.py                 # Main learner dashboard
│   ├── leaderboard.py               # Global and local leaderboards
│   └── simulation_ui.py             # Interface for simulation interaction
│
├── database/
│   ├── models.py                    # SQLite database schema definitions
│   ├── seed_data.py                 # Initial data for testing
│   └── db_config.py                 # SQLite connection and setup
│
├── data/
│   ├── eco_stats.json               # Local/global environment data
│   ├── badges_config.json           # Badge & reward rules
│   └── progress_tracking.json       # User progress data
│
├── assets/
│   ├── images/
│   ├── videos/
│   └── audio/
│
├── README.md
└── requirements.txt


---

## 🔐 Security Notes

- Passwords are hashed using `werkzeug.security`'s `generate_password_hash`.
- Password reset links are token-based and expire after 1 hour.
- Sessions are managed client-side using `localStorage` (`ecoUser` email key).

---

## 📦 Setup Instructions

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/ecolearn-ai.git
   cd ecolearn-ai
Create a virtual environment:

python3 -m venv .venv
source .venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Set up the database:

python database/db_config.py

Run the Flask app:

    python main.py

    Open in browser:
    Navigate to: http://127.0.0.1:5000

📩 Feedback & Contributions

This project is in active development. Suggestions and contributions are welcome!

To contribute:

    Fork the repo

    Create a branch

    Submit a pull request

📜 License

MIT License © 2025 EcoLearn AI Team


---

Would you like me to:

- Save this as a `README.md` file for you?
- Generate a `requirements.txt`?
- Add screenshots or a logo?

Let me know so we can polish your project completely!