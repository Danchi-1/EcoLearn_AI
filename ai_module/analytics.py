import json
import sqlite3
from typing import Dict, List, Optional
import logging
from pathlib import Path
from datetime import datetime, timedelta

class LearningAnalytics:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            self.db_path = str(Path(__file__).resolve().parent.parent / "database" / "ecolearn.db")
        else:
            self.db_path = db_path
        self.setup_logging()
        
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def track_user_interaction(self, user_id: int, interaction_type: str, 
                              module_id: Optional[int] = None, score: Optional[float] = None, 
                              time_spent: Optional[int] = None):
        """Track user learning interactions"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_interactions 
                (user_id, interaction_type, module_id, score, time_spent, timestamp)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            """, (user_id, interaction_type, module_id, score, time_spent))
            conn.commit()
            self.logger.info(f"Tracked interaction for user {user_id}")
        except Exception as e:
            self.logger.error(f"Error tracking interaction: {e}")
        finally:
            if conn:
                conn.close()

    def get_user_progress(self, user_id: int) -> Dict:
        """Get comprehensive user progress analytics"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            # Get completion stats
            cursor.execute("""
                SELECT COUNT(*) as total_interactions,
                       AVG(score) as avg_score,
                       SUM(time_spent) as total_time,
                       COUNT(DISTINCT module_id) as modules_attempted
                FROM user_interactions 
                WHERE user_id = ? AND score IS NOT NULL
            """, (user_id,))
            stats = cursor.fetchone() or (0, 0, 0, 0)

            # Get learning streak
            cursor.execute("""
                SELECT COUNT(*) as streak_days
                FROM (
                    SELECT DATE(timestamp) as interaction_date
                    FROM user_interactions
                    WHERE user_id = ?
                    GROUP BY DATE(timestamp)
                    ORDER BY DATE(timestamp) DESC
                ) streak_calc
            """, (user_id,))
            streak_row = cursor.fetchone()
            streak = streak_row[0] if streak_row and streak_row[0] is not None else 0

            # Get topic performance
            cursor.execute("""
                SELECT lm.topics, AVG(ui.score) as avg_score
                FROM user_interactions ui
                JOIN learning_modules lm ON ui.module_id = lm.id
                WHERE ui.user_id = ? AND ui.score IS NOT NULL
                GROUP BY lm.topics
            """, (user_id,))
            topic_performance = {}
            for row in cursor.fetchall():
                try:
                    topics = json.loads(row[0]) if row[0] else []
                except Exception:
                    topics = []
                for topic in topics:
                    topic_performance[topic] = row[1] if row[1] is not None else 0

            return {
                'total_interactions': stats[0] if stats[0] is not None else 0,
                'average_score': round(stats[1], 2) if stats[1] is not None else 0,
                'total_time_minutes': stats[2] if stats[2] is not None else 0,
                'modules_attempted': stats[3] if stats[3] is not None else 0,
                'learning_streak_days': streak,
                'topic_performance': topic_performance,
                'eco_impact': self._calculate_eco_impact(user_id),
                'badges_earned': self._get_user_badges(user_id),
                'weekly_progress': self._get_weekly_progress(user_id)
            }
        except Exception as e:
            self.logger.error(f"Error getting user progress: {e}")
            return {}
        finally:
            if conn:
                conn.close()

    def _calculate_eco_impact(self, user_id: int) -> Dict:
        """Calculate user's simulated environmental impact"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    SUM(CASE WHEN lm.topics LIKE '%solar%' THEN 1 ELSE 0 END) as solar_modules,
                    SUM(CASE WHEN lm.topics LIKE '%carbon%' THEN 1 ELSE 0 END) as carbon_modules,
                    SUM(CASE WHEN lm.topics LIKE '%sustainability%' THEN 1 ELSE 0 END) as sustainability_modules
                FROM user_interactions ui
                JOIN learning_modules lm ON ui.module_id = lm.id
                WHERE ui.user_id = ? AND ui.score >= 70
            """, (user_id,))
            completed = cursor.fetchone() or (0, 0, 0)
            solar = completed[0] if completed[0] is not None else 0
            carbon = completed[1] if completed[1] is not None else 0
            sustain = completed[2] if completed[2] is not None else 0
            co2_saved = solar * 50  # 50kg CO2 per solar module
            water_saved = carbon * 100  # 100L water per carbon module
            waste_reduced = sustain * 25  # 25kg waste per sustainability module
            return {
                'co2_saved_kg': co2_saved,
                'water_saved_liters': water_saved,
                'waste_reduced_kg': waste_reduced,
                'trees_equivalent': round(co2_saved / 21.7, 1) if co2_saved else 0  # 1 tree = ~21.7kg CO2/year
            }
        except Exception as e:
            self.logger.error(f"Error calculating eco impact: {e}")
            return {'co2_saved_kg': 0, 'water_saved_liters': 0, 'waste_reduced_kg': 0, 'trees_equivalent': 0}
        finally:
            if conn:
                conn.close()

    def _get_user_badges(self, user_id: int) -> List[Dict]:
        """Get user's earned badges"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT badge_name, earned_date, description
                FROM user_badges
                WHERE user_id = ?
                ORDER BY earned_date DESC
            """, (user_id,))
            badges = []
            for row in cursor.fetchall():
                badges.append({
                    'name': row[0],
                    'earned_date': row[1],
                    'description': row[2]
                })
            return badges
        except Exception as e:
            self.logger.error(f"Error getting user badges: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def _get_weekly_progress(self, user_id: int) -> List[Dict]:
        """Get user's progress over the last 7 days"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DATE(timestamp) as day, 
                       COUNT(*) as interactions,
                       AVG(COALESCE(score, 0)) as avg_score,
                       SUM(COALESCE(time_spent, 0)) as total_time
                FROM user_interactions
                WHERE user_id = ? AND timestamp >= date('now', '-7 days')
                GROUP BY DATE(timestamp)
                ORDER BY DATE(timestamp)
            """, (user_id,))
            weekly_data = []
            for row in cursor.fetchall():
                weekly_data.append({
                    'day': row[0],
                    'interactions': row[1] if row[1] is not None else 0,
                    'avg_score': round(row[2], 2) if row[2] is not None else 0,
                    'total_time': row[3] if row[3] is not None else 0
                })
            return weekly_data
        except Exception as e:
            self.logger.error(f"Error getting weekly progress: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def get_global_stats(self) -> Dict:
        """Get platform-wide impact statistics"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(DISTINCT user_id) as total_users,
                       COUNT(*) as total_interactions,
                       AVG(score) as avg_platform_score
                FROM user_interactions
                WHERE score IS NOT NULL
            """)
            stats = cursor.fetchone() or (0, 0, 0)
            cursor.execute("""
                SELECT COUNT(*) as total_completions
                FROM user_interactions
                WHERE score >= 70
            """)
            completions_row = cursor.fetchone()
            completions = completions_row[0] if completions_row and completions_row[0] is not None else 0
            total_co2_saved = completions * 50
            total_water_saved = completions * 100
            total_waste_reduced = completions * 25
            return {
                'total_users': stats[0] if stats[0] is not None else 0,
                'total_interactions': stats[1] if stats[1] is not None else 0,
                'average_platform_score': round(stats[2], 2) if stats[2] is not None else 0,
                'total_completions': completions,
                'global_eco_impact': {
                    'co2_saved_kg': total_co2_saved,
                    'water_saved_liters': total_water_saved,
                    'waste_reduced_kg': total_waste_reduced,
                    'trees_equivalent': round(total_co2_saved / 21.7, 1) if total_co2_saved else 0
                }
            }
        except Exception as e:
            self.logger.error(f"Error getting global stats: {e}")
            return {}
        finally:
            if conn:
                conn.close()

    def generate_learning_insights(self, user_id: int) -> Dict:
        """Generate personalized learning insights"""
        try:
            progress = self.get_user_progress(user_id)
            insights = {
                'strengths': [],
                'improvement_areas': [],
                'recommendations': [],
                'next_goals': []
            }
            topic_performance = progress.get('topic_performance', {})
            for topic, score in topic_performance.items():
                if score >= 80:
                    insights['strengths'].append(f"Excellent understanding of {topic}")
                elif score < 60:
                    insights['improvement_areas'].append(f"Consider reviewing {topic} concepts")
            avg_score = progress.get('average_score', 0)
            if avg_score >= 80:
                insights['recommendations'].append("Try advanced modules to challenge yourself")
            elif avg_score >= 60:
                insights['recommendations'].append("Great progress! Keep practicing current topics")
            else:
                insights['recommendations'].append("Focus on fundamentals before advancing")
            streak = progress.get('learning_streak_days', 0)
            if streak < 7:
                insights['next_goals'].append("Maintain a 7-day learning streak")
            else:
                insights['next_goals'].append("Extend your learning streak to 30 days")
            return insights
        except Exception as e:
            self.logger.error(f"Error generating insights: {e}")
            return {'strengths': [], 'improvement_areas': [], 'recommendations': [], 'next_goals': []}

    def award_badge(self, user_id: int, badge_name: str, description: str):
        """Award a badge to a user"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM user_badges
                WHERE user_id = ? AND badge_name = ?
            """, (user_id, badge_name))
            if cursor.fetchone()[0] == 0:
                cursor.execute("""
                    INSERT INTO user_badges (user_id, badge_name, description, earned_date)
                    VALUES (?, ?, ?, datetime('now'))
                """, (user_id, badge_name, description))
                conn.commit()
                self.logger.info(f"Awarded badge '{badge_name}' to user {user_id}")
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error awarding badge: {e}")
            return False
        finally:
            if conn:
                conn.close()

    def check_and_award_badges(self, user_id: int):
        """Check user progress and award appropriate badges"""
        progress = self.get_user_progress(user_id)
        # First simulation badge
        if progress.get('modules_attempted', 0) >= 1:
            self.award_badge(user_id, "First Steps", "Completed your first simulation")
        # Streak badges
        streak = progress.get('learning_streak_days', 0)
        if streak >= 7:
            self.award_badge(user_id, "Week Warrior", "Maintained 7-day learning streak")
        if streak >= 30:
            self.award_badge(user_id, "Month Master", "Maintained 30-day learning streak")
        # Performance badges
        avg_score = progress.get('average_score', 0)
        if avg_score >= 90:
            self.award_badge(user_id, "Excellence", "Maintained 90%+ average score")
        elif avg_score >= 80:
            self.award_badge(user_id, "High Achiever", "Maintained 80%+ average score")
        # Eco impact badges
        eco_impact = progress.get('eco_impact', {})
        if eco_impact.get('co2_saved_kg', 0) >= 500:
            self.award_badge(user_id, "Carbon Saver", "Saved 500kg+ CO2 equivalent")
        if eco_impact.get('trees_equivalent', 0) >= 10:
            self.award_badge(user_id, "Forest Friend", "Impact equivalent to 10+ trees")