import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from collections import defaultdict

# ADWIN Fallback Implementation (Adaptive Windowing for concept drift detection)
class SimpleADWIN:
    """A minimal version of ADWIN (Adaptive Windowing) for concept drift detection."""
    def __init__(self, delta=0.002):
        self.delta = delta
        self.window = []
        self.variance = 0.0
        self.width = 0
        self.total = 0.0

    def add_element(self, value):
        self.window.append(value)
        self.width += 1
        self.total += value
        return self._check_drift()

    def _check_drift(self):
        if self.width < 10:
            return False
        
        half = self.width // 2
        w1 = self.window[:half]
        w2 = self.window[half:]
        
        mu1 = sum(w1) / len(w1)
        mu2 = sum(w2) / len(w2)
        diff = abs(mu1 - mu2)
        
        epsilon = np.sqrt((1 / len(w1) + 1 / len(w2)) * np.log(2 / self.delta) / 2)
        
        if diff > epsilon:
            self.window = w2
            self.width = len(self.window)
            self.total = sum(self.window)
            return True
        return False


class MLEngine:
    def __init__(self):
        self.rf_classifier = RandomForestClassifier(n_estimators=200, random_state=42, max_depth=6)
        self.isolation_forest = IsolationForest(contamination=0.15, random_state=42)
        self.adwin_detectors = {}  # Map student_id -> ADWIN

        # Pre-train RF with richer synthetic concepts
        # Features: [accuracy_drop, time_change, retry_increase, anomaly_score, guess_prob]
        X_mock = np.array([
            # Normal Learner - consistent, moderate speed, low retries
            [0.0,  0.0,  0.0, 0.0, 0.1],
            [0.05, 0.1,  0.0, 0.1, 0.1],
            [0.1,  0.2,  0.0, 0.1, 0.15],
            # Guessing Behavior - very fast, wrong, no retries
            [0.5, -0.8,  0.1, 0.9, 0.85],
            [0.7, -0.9,  0.0, 0.8, 0.9],
            [0.6, -0.7,  0.0, 0.85, 0.8],
            # Conceptual Struggler - slow, wrong, many retries
            [0.8,  0.5,  0.8, 0.7, 0.2],
            [0.9,  0.4,  1.0, 0.8, 0.15],
            [0.7,  0.6,  0.7, 0.75, 0.25],
            # Pattern Memorizer - fast and right but low understanding
            [0.1, -0.5,  0.0, 0.2, 0.35],
            [0.05,-0.6,  0.0, 0.15, 0.4],
        ])
        y_mock = np.array([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3])
        self.rf_classifier.fit(X_mock, y_mock)
        
        self.behavior_map = {
            0: "Normal Learner",
            1: "Guessing Behavior",
            2: "Conceptual Struggler",
            3: "Pattern Memorizer"
        }

    def _compute_topic_stats(self, df: pd.DataFrame) -> dict:
        """Compute per-topic accuracy and mistake counts."""
        topic_stats = {}
        for topic, group in df.groupby('topic'):
            total = len(group)
            correct = group['correct'].sum()
            wrong = total - correct
            avg_time = group['time_taken'].mean()
            topic_stats[str(topic)] = {
                "total": int(total),
                "correct": int(correct),
                "wrong": int(wrong),
                "accuracy": float(correct / total) if total > 0 else 0.0,
                "avg_time": float(avg_time)
            }
        return topic_stats

    def _compute_guess_probability(self, df: pd.DataFrame) -> float:
        """Estimate guessing probability from very fast answers."""
        if len(df) == 0:
            return 0.0
        mean_time = df['time_taken'].mean()
        std_time = df['time_taken'].std() + 1e-9
        # Very fast = below (mean - 1.5*std) and below 15 seconds
        threshold = max(mean_time - 1.5 * std_time, 5.0)
        very_fast = ((df['time_taken'] < threshold) & (~df['correct'])).sum()
        return float(min(very_fast / len(df), 1.0))

    def _compute_consistency_score(self, df: pd.DataFrame) -> float:
        """Consistency score: 1 if student is consistent, lower if erratic."""
        if len(df) < 3:
            return 0.5
        # Stddev of correct (0/1) over a rolling window as proxy
        accuracy_series = df['correct'].astype(float).rolling(window=3).mean().dropna()
        if len(accuracy_series) < 2:
            return 0.5
        consistency = 1.0 - min(accuracy_series.std(), 1.0)
        return float(max(0.0, consistency))

    def _compute_learning_velocity(self, df: pd.DataFrame) -> float:
        """Learning velocity: positive if accuracy improves over time, negative if declining."""
        if len(df) < 6:
            return 0.0
        half = len(df) // 2
        first_half_accuracy = df['correct'].iloc[:half].mean()
        second_half_accuracy = df['correct'].iloc[half:].mean()
        velocity = second_half_accuracy - first_half_accuracy
        return float(velocity)

    def process_student_sequence(self, student_id: int, attempts_data: list):
        """Process a sequence of attempts and generate a comprehensive drift report."""
        if len(attempts_data) < 5:
            return None

        df = pd.DataFrame(attempts_data)
        
        # Sliding window: compare recent 5 vs rest
        recent_df = df.tail(5)
        past_df = df.iloc[:-5]

        # Core metrics
        past_accuracy = past_df['correct'].mean() if len(past_df) > 0 else df['correct'].mean()
        recent_accuracy = recent_df['correct'].mean()
        accuracy_drop = float(max(past_accuracy - recent_accuracy, 0.0))

        past_time = past_df['time_taken'].mean() if len(past_df) > 0 else df['time_taken'].mean()
        recent_time = recent_df['time_taken'].mean()
        time_change = float((recent_time - past_time) / (past_time + 1e-9))

        past_retries = past_df['retry_count'].mean() if len(past_df) > 0 else 0.0
        recent_retries = recent_df['retry_count'].mean()
        retry_increase = float(max(recent_retries - past_retries, 0.0))

        # Advanced behavioral features
        guess_probability = self._compute_guess_probability(df)
        consistency_score = self._compute_consistency_score(df)
        learning_velocity = self._compute_learning_velocity(df)
        topic_stats = self._compute_topic_stats(df)

        # ADWIN drift detection on accuracy stream
        if student_id not in self.adwin_detectors:
            self.adwin_detectors[student_id] = SimpleADWIN()
        
        adwin = self.adwin_detectors[student_id]
        drift_flag = False
        for correctness in df['correct'].astype(int):
            if adwin.add_element(int(correctness)):
                drift_flag = True

        # Anomaly Detection (Isolation Forest)
        features = df[['correct', 'time_taken', 'retry_count']].fillna(0).values
        if len(features) > 5:
            self.isolation_forest.fit(features)
            recent_features = features[-5:]
            raw_scores = self.isolation_forest.decision_function(recent_features)
            anomaly_score = float(np.clip(1.0 - (np.mean(raw_scores) + 0.5), 0, 1))
        else:
            anomaly_score = 0.0

        # Random Forest Classification (with 5 features now)
        rf_features = np.array([[accuracy_drop, time_change, retry_increase, anomaly_score, guess_probability]])
        # Pad to match original 5-feature model
        behavior_class = self.rf_classifier.predict(rf_features)[0]
        behavior_label = self.behavior_map[behavior_class]

        # Drift Score Formula
        normalized_time_change = float(min(abs(time_change), 1.0))
        normalized_retry = float(min(retry_increase / 3.0, 1.0))
        
        drift_score = (
            0.35 * min(accuracy_drop, 1.0) +
            0.2  * normalized_time_change +
            0.2  * normalized_retry +
            0.15 * anomaly_score +
            0.1  * guess_probability
        )
        
        # Bonus drift if ADWIN triggered statistical change
        if drift_flag:
            drift_score = float(min(drift_score + 0.15, 1.0))
        
        drift_score = float(drift_score)

        # Risk Levels
        if drift_score < 0.3:
            risk_level = "Normal"
        elif drift_score < 0.6:
            risk_level = "Warning"
        else:
            risk_level = "High Risk"

        # Advanced AI Insight Generator
        recent_topic = str(df.iloc[-1]['topic'])
        
        # Find weakest topic
        weakest_topic = recent_topic
        lowest_acc = 1.0
        for t, stats in topic_stats.items():
            if stats["accuracy"] < lowest_acc and stats["total"] >= 2:
                lowest_acc = stats["accuracy"]
                weakest_topic = t

        insight = self._generate_insight(
            behavior_class, drift_score, accuracy_drop, time_change,
            retry_increase, guess_probability, consistency_score,
            learning_velocity, recent_topic, weakest_topic, drift_flag
        )
        
        # Override behavior_label with more specific classification
        if behavior_class == 1 or (time_change < -0.3 and accuracy_drop > 0.3):
            behavior_label = "Guessing Behavior"
        elif behavior_class == 2 or (accuracy_drop > 0.4 and retry_increase > 0.5):
            behavior_label = "Conceptual Struggler"
        elif behavior_class == 3:
            behavior_label = "Pattern Memorizer"
        elif drift_flag and drift_score >= 0.3:
            behavior_label = "Concept Drift Detected"
        else:
            behavior_label = "Normal Learner"

        return {
            "drift_score": drift_score,
            "recent_accuracy_drop": accuracy_drop,
            "time_change_factor": time_change,
            "retry_increase_factor": retry_increase,
            "anomaly_score": anomaly_score,
            "guess_probability": guess_probability,
            "consistency_score": consistency_score,
            "learning_velocity": learning_velocity,
            "behavior_classification": behavior_label,
            "risk_level": risk_level,
            "ai_insight": insight,
            "topic_stats": topic_stats
        }

    def _generate_insight(self, behavior_class, drift_score, accuracy_drop, time_change,
                          retry_increase, guess_prob, consistency, velocity,
                          recent_topic, weakest_topic, adwin_flag):
        """Generate a rich, natural-language AI learning insight."""
        
        if drift_score < 0.3 and velocity >= 0:
            return (
                f"Your learning trajectory is stable and improving. You are maintaining strong "
                f"conceptual understanding in {recent_topic}. Keep up the consistent pace and "
                f"challenge yourself with harder problems to accelerate growth."
            )
        
        if drift_score < 0.3 and velocity < 0:
            return (
                f"Your understanding appears stable, but there is a slight downward trend detected. "
                f"Consider revisiting recent topics and ensuring you understand core concepts before "
                f"moving to advanced material in {recent_topic}."
            )

        # Guessing behavior
        if behavior_class == 1 or (time_change < -0.3 and accuracy_drop > 0.2) or guess_prob > 0.5:
            return (
                f"⚠️ Guessing behavior detected. Your problem-solving speed has increased "
                f"significantly (time change: {time_change*100:.0f}%) while accuracy dropped by "
                f"{accuracy_drop*100:.0f}%. In {weakest_topic}, you appear to be selecting answers "
                f"without fully reasoning through them. We recommend slowing down, re-reading each "
                f"question carefully, and reviewing foundational {weakest_topic} concepts before "
                f"your next session."
            )
        
        # Conceptual Struggler
        if behavior_class == 2 or (accuracy_drop > 0.3 and retry_increase > 0.3):
            return (
                f"⚠️ Conceptual learning difficulty detected. You are making repeated mistakes in "
                f"{weakest_topic} with a {accuracy_drop*100:.0f}% accuracy drop and "
                f"{retry_increase:.1f} more retries than usual. This pattern indicates the core "
                f"concepts in {weakest_topic} may not be fully understood. We recommend reviewing "
                f"fundamentals, practicing simpler problems first, and seeking clarification from "
                f"your instructor on problem-solving strategies."
            )
        
        # Pattern Memorizer
        if behavior_class == 3:
            return (
                f"Pattern memorization behavior detected. You are answering {recent_topic} questions "
                f"quickly and correctly, but your performance drops significantly when question "
                f"formats change. This may indicate surface-level memorization rather than deep "
                f"understanding. Try explaining concepts in your own words and solving unseen "
                f"problem variations to build genuine conceptual mastery."
            )
        
        # ADWIN statistical drift
        if adwin_flag:
            return (
                f"🔍 Statistical learning drift detected by ADWIN algorithm. Your behavioral "
                f"patterns have changed significantly from your baseline. Accuracy dropped "
                f"{accuracy_drop*100:.0f}% in recent attempts. Review your recent activity in "
                f"{weakest_topic} to identify and address emerging conceptual gaps before they worsen."
            )

        # General drift
        return (
            f"📊 Behavioral change detected. Your learning patterns in {recent_topic} show signs "
            f"of drift with a {drift_score*100:.0f}% drift score. Accuracy has dropped "
            f"{accuracy_drop*100:.0f}% and consistency score is {consistency*100:.0f}%. "
            f"Take time to review concepts you've struggled with recently before attempting "
            f"new material."
        )


engine_instance = MLEngine()
