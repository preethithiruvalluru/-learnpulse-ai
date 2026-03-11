"""
LearnPulse AI - Sample Dataset Generator
Generates realistic synthetic student interaction data with concept drift patterns.
Run: python seed.py (with venv activated and from the backend/ directory)
"""
import sys
import os
import random
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user import User, Role
from app.models.question import Question
from app.models.attempt import Attempt
from app.models.drift_report import DriftReport
from app.utils.security import get_password_hash

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ─────────────────────────────────────────────
# Sample Questions
# ─────────────────────────────────────────────
QUESTIONS = [
    # ── Arrays (10) ──
    {"topic": "Arrays", "difficulty": "easy", "content": "What is the time complexity of accessing an element in an array by index?", "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "correct_option_index": 0},
    {"topic": "Arrays", "difficulty": "easy", "content": "Which data structure is fundamentally a dynamic array in Python?", "options": ["Tuple", "List", "Dictionary", "Set"], "correct_option_index": 1},
    {"topic": "Arrays", "difficulty": "medium", "content": "What does the 'two pointer technique' solve efficiently?", "options": ["Graph traversal", "Pair sum in sorted array", "Tree balancing", "Stack overflow"], "correct_option_index": 1},
    {"topic": "Arrays", "difficulty": "medium", "content": "How do you efficiently rotate an array of n elements to the right by k steps?", "options": ["Reverse 3 times", "Bubble swap", "Use a stack", "Linked list conversion"], "correct_option_index": 0},
    {"topic": "Arrays", "difficulty": "medium", "content": "What is the time complexity to insert at the beginning of a standard dynamic array?", "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "correct_option_index": 1},
    {"topic": "Arrays", "difficulty": "medium", "content": "In a 2D array matrix[m][n], what is the element at [i][j] in a 1D flattened array?", "options": ["i * m + j", "i * n + j", "i + j * n", "j * m + i"], "correct_option_index": 1},
    {"topic": "Arrays", "difficulty": "hard", "content": "Find the maximum subarray sum (Kadane's algorithm) time complexity?", "options": ["O(n^2)", "O(n log n)", "O(n)", "O(1)"], "correct_option_index": 2},
    {"topic": "Arrays", "difficulty": "hard", "content": "Which algorithm finds the majority element (appears > ⌊n/2⌋ times) in O(n) time and O(1) space?", "options": ["Boyer-Moore Voting", "Kadane's", "Sliding Window", "Merge Sort"], "correct_option_index": 0},
    {"topic": "Arrays", "difficulty": "hard", "content": "What is the optimal time complexity to find the missing number in an array containing 1 to N?", "options": ["O(n^2)", "O(n log n)", "O(n)", "O(1)"], "correct_option_index": 2},
    {"topic": "Arrays", "difficulty": "hard", "content": "To solve 'Trapping Rain Water', what is the best space complexity possible?", "options": ["O(n)", "O(log n)", "O(1)", "O(n^2)"], "correct_option_index": 2},

    # ── Recursion (10) ──
    {"topic": "Recursion", "difficulty": "easy", "content": "What is the base case in a recursive function?", "options": ["The first call", "The condition that stops recursion", "The return type", "The function name"], "correct_option_index": 1},
    {"topic": "Recursion", "difficulty": "easy", "content": "What data structure does the system use to keep track of recursive calls?", "options": ["Queue", "Heap", "Stack", "Array"], "correct_option_index": 2},
    {"topic": "Recursion", "difficulty": "medium", "content": "What happens if a recursive function has no base case?", "options": ["It returns 0", "It runs forever / stack overflow", "It compiles with error", "It skips recursion"], "correct_option_index": 1},
    {"topic": "Recursion", "difficulty": "medium", "content": "Which of the following problems is naturally solved using Recursion?", "options": ["Iterating an array", "Tower of Hanoi", "Finding min in array", "String concatenation"], "correct_option_index": 1},
    {"topic": "Recursion", "difficulty": "medium", "content": "What is Tail Recursion?", "options": ["Recursion at the start", "When the recursive call is the very last operation", "Recursion with a loop", "Recursion with multiple branches"], "correct_option_index": 1},
    {"topic": "Recursion", "difficulty": "medium", "content": "Fibonacci(5) using pure recursion results in how many function calls total?", "options": ["5", "9", "15", "25"], "correct_option_index": 2},
    {"topic": "Recursion", "difficulty": "hard", "content": "What is the space complexity of a recursive depth-first search on a tree of height h?", "options": ["O(1)", "O(log h)", "O(h)", "O(2^h)"], "correct_option_index": 2},
    {"topic": "Recursion", "difficulty": "hard", "content": "How can you optimize a recursive function that calculates Fibonacci numbers?", "options": ["Use tail recursion", "Memoization / DP", "Use a static variable", "Recursion cannot be optimized"], "correct_option_index": 1},
    {"topic": "Recursion", "difficulty": "hard", "content": "Tower of Hanoi with n disks requires how many moves?", "options": ["n", "2n", "2^n - 1", "n^2"], "correct_option_index": 2},
    {"topic": "Recursion", "difficulty": "hard", "content": "Which sorting mechanism uses Divide and Conquer recursion?", "options": ["Bubble Sort", "Merge Sort", "Insertion Sort", "Selection Sort"], "correct_option_index": 1},

    # ── Linked Lists (10) ──
    {"topic": "Linked Lists", "difficulty": "easy", "content": "What does a basic Linked List node contain?", "options": ["Data and Hash", "Data and Pointer to next", "Two pointers", "Array index"], "correct_option_index": 1},
    {"topic": "Linked Lists", "difficulty": "easy", "content": "What is the time complexity of inserting at the head of a linked list?", "options": ["O(n)", "O(1)", "O(log n)", "O(n^2)"], "correct_option_index": 1},
    {"topic": "Linked Lists", "difficulty": "medium", "content": "How do you detect a cycle in a linked list?", "options": ["DFS traversal", "Floyd's Tortoise and Hare", "Binary search", "Hash tables only"], "correct_option_index": 1},
    {"topic": "Linked Lists", "difficulty": "medium", "content": "To delete a node in a singly linked list given only a pointer to that node (not tail), what do you do?", "options": ["Traverse from head", "Copy next node's data and delete next node", "Set to null", "Double pointers"], "correct_option_index": 1},
    {"topic": "Linked Lists", "difficulty": "medium", "content": "What is the time complexity to find the length of a singly linked list?", "options": ["O(1)", "O(n)", "O(log n)", "Depends on the system"], "correct_option_index": 1},
    {"topic": "Linked Lists", "difficulty": "medium", "content": "How do you find the middle of a linked list in one pass?", "options": ["Recursion", "Fast and slow pointers", "Hash map", "Convert to array"], "correct_option_index": 1},
    {"topic": "Linked Lists", "difficulty": "hard", "content": "What is the time complexity of reversing a linked list?", "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"], "correct_option_index": 2},
    {"topic": "Linked Lists", "difficulty": "hard", "content": "Which variant of a linked list allows O(1) traversal backwards?", "options": ["Singly Linked List", "Circular Linked List", "Doubly Linked List", "Skip List"], "correct_option_index": 2},
    {"topic": "Linked Lists", "difficulty": "hard", "content": "What is the space complexity to reverse a linked list iteratively?", "options": ["O(n)", "O(log n)", "O(1)", "O(n^2)"], "correct_option_index": 2},
    {"topic": "Linked Lists", "difficulty": "hard", "content": "To merge two sorted linked lists, what is the most optimal time complexity?", "options": ["O(1)", "O(n + m)", "O(n log n)", "O(n * m)"], "correct_option_index": 1},

    # ── Trees (10) ──
    {"topic": "Trees", "difficulty": "easy", "content": "What is the root of a tree?", "options": ["The node with no children", "The topmost node", "A leaf node", "The center node"], "correct_option_index": 1},
    {"topic": "Trees", "difficulty": "easy", "content": "What defines a Binary Tree?", "options": ["Nodes have exactly 2 children", "Nodes have at most 2 children", "Sorted nodes", "Balanced branches"], "correct_option_index": 1},
    {"topic": "Trees", "difficulty": "medium", "content": "In-order traversal of a Binary Search Tree gives?", "options": ["Random order", "Reverse sorted", "Sorted order", "Level-by-level"], "correct_option_index": 2},
    {"topic": "Trees", "difficulty": "medium", "content": "What traversal method visits the root, then left subtree, then right subtree?", "options": ["In-order", "Pre-order", "Post-order", "Level-order"], "correct_option_index": 1},
    {"topic": "Trees", "difficulty": "medium", "content": "What defines a complete binary tree?", "options": ["All levels filled except possibly the last, left-aligned", "All levels completely filled", "All leaf nodes at same level", "Every node has 2 children"], "correct_option_index": 0},
    {"topic": "Trees", "difficulty": "medium", "content": "What is the height of a balanced binary tree with N nodes?", "options": ["O(n)", "O(log N)", "O(n^2)", "O(1)"], "correct_option_index": 1},
    {"topic": "Trees", "difficulty": "hard", "content": "What is the worst-case time complexity to search in an unbalanced BST?", "options": ["O(log n)", "O(n)", "O(n log n)", "O(1)"], "correct_option_index": 1},
    {"topic": "Trees", "difficulty": "hard", "content": "Which of these is a self-balancing binary search tree?", "options": ["Segment Tree", "AVL Tree", "Trie", "Heap"], "correct_option_index": 1},
    {"topic": "Trees", "difficulty": "hard", "content": "To serialize a binary tree, what traversal is commonly combined with null markers?", "options": ["In-order", "Pre-order", "Post-order", "Reverse In-order"], "correct_option_index": 1},
    {"topic": "Trees", "difficulty": "hard", "content": "What is the time complexity of finding the Lowest Common Ancestor in a balanced BST?", "options": ["O(n)", "O(h)", "O(1)", "O(n log n)"], "correct_option_index": 1},

    # ── Dynamic Programming (10) ──
    {"topic": "Dynamic Programming", "difficulty": "easy", "content": "What are the two main approaches in Dynamic Programming?", "options": ["Greedy and Brute-force", "Top-down (Memoization) and Bottom-up (Tabulation)", "BFS and DFS", "Hashing and Pointers"], "correct_option_index": 1},
    {"topic": "Dynamic Programming", "difficulty": "medium", "content": "DP solves problems by breaking them into:", "options": ["Random partitions", "Overlapping subproblems", "Greedy choices", "Independent subproblems"], "correct_option_index": 1},
    {"topic": "Dynamic Programming", "difficulty": "medium", "content": "What property must a problem have to be solved by DP?", "options": ["Optimal Substructure", "Non-deterministic", "Cyclic graphs", "Linear time"], "correct_option_index": 0},
    {"topic": "Dynamic Programming", "difficulty": "medium", "content": "What is Memoization?", "options": ["Caching results of expensive function calls", "Iteratively building an array", "Using less memory", "Sorting data first"], "correct_option_index": 0},
    {"topic": "Dynamic Programming", "difficulty": "medium", "content": "What is the classic space-optimized way to solve the Fibonacci sequence?", "options": ["O(n) array", "O(n^2) matrix", "O(1) keeping two variables", "Using a hash map"], "correct_option_index": 2},
    {"topic": "Dynamic Programming", "difficulty": "hard", "content": "Longest Common Subsequence of strings length N and M has time complexity:", "options": ["O(N+M)", "O(N log M)", "O(N*M)", "O(2^min(N,M))"], "correct_option_index": 2},
    {"topic": "Dynamic Programming", "difficulty": "hard", "content": "The 0/1 Knapsack problem is solved optimally using:", "options": ["Greedy algorithm", "Dynamic Programming", "Binary Search", "Bit manipulation"], "correct_option_index": 1},
    {"topic": "Dynamic Programming", "difficulty": "hard", "content": "For DP on Grids (like unique paths), what is typically the transition state?", "options": ["dp[i] = dp[i-1]", "dp[i][j] = dp[i-1][j] + dp[i][j-1]", "dp[i] = max(arr)", "dp[n] = 0"], "correct_option_index": 1},
    {"topic": "Dynamic Programming", "difficulty": "hard", "content": "Coin Change (minimum coins) can fail with Greedy. Why does DP succeed?", "options": ["DP tries multiple combinations", "DP evaluates all valid sub-states to find global minimum", "DP sorts the coins", "DP uses more memory"], "correct_option_index": 1},
    {"topic": "Dynamic Programming", "difficulty": "hard", "content": "What is Matrix Chain Multiplication's time complexity using DP?", "options": ["O(n^2)", "O(n^3)", "O(n!)", "O(2^n)"], "correct_option_index": 1},

    # ── Sorting (10) ──
    {"topic": "Sorting", "difficulty": "easy", "content": "Which sort is stable by nature?", "options": ["Quick Sort", "Merge Sort", "Heap Sort", "Selection Sort"], "correct_option_index": 1},
    {"topic": "Sorting", "difficulty": "easy", "content": "What data structure is used to implement Heap Sort?", "options": ["Stack", "Hash map", "Binary Heap", "Linked List"], "correct_option_index": 2},
    {"topic": "Sorting", "difficulty": "medium", "content": "Quick sort's average time complexity?", "options": ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"], "correct_option_index": 1},
    {"topic": "Sorting", "difficulty": "medium", "content": "What does a 'stable' sorting algorithm mean?", "options": ["It doesn't crash", "O(n) space complexity", "Equal elements retain their original relative order", "It uses no extra space"], "correct_option_index": 2},
    {"topic": "Sorting", "difficulty": "medium", "content": "Which sorting algorithm is typically used for small arrays built into many language standard libraries?", "options": ["Merge Sort", "Insertion Sort", "Radix Sort", "Bubble Sort"], "correct_option_index": 1},
    {"topic": "Sorting", "difficulty": "medium", "content": "In Quick Sort, what is a pivot?", "options": ["The middle element always", "An element used to partition the array", "The largest element", "A pointer variable"], "correct_option_index": 1},
    {"topic": "Sorting", "difficulty": "hard", "content": "Which sorting algorithm has O(n) best-case time complexity?", "options": ["Merge sort", "Heap sort", "Insertion sort", "Selection sort"], "correct_option_index": 2},
    {"topic": "Sorting", "difficulty": "hard", "content": "What is the worst-case time complexity of Quick Sort?", "options": ["O(n log n)", "O(n)", "O(n^2)", "O(n!)"], "correct_option_index": 2},
    {"topic": "Sorting", "difficulty": "hard", "content": "Which of these algorithms sorts in linear time O(n+k)?", "options": ["Heap Sort", "Counting Sort", "Merge Sort", "Tim Sort"], "correct_option_index": 1},
    {"topic": "Sorting", "difficulty": "hard", "content": "What is the space complexity of Merge Sort?", "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"], "correct_option_index": 2},
]

def clear_data():
    try:
        db.query(DriftReport).delete()
        db.query(Attempt).delete()
        db.query(Question).delete()
        db.query(User).delete()
        db.commit()
        print("[OK] Cleared existing data")
    except Exception as e:
        db.rollback()
        print(f"Warning clearing: {e}")

def seed_questions():
    for q_data in QUESTIONS:
        q = Question(
            topic=q_data["topic"],
            difficulty=q_data["difficulty"],
            content=q_data["content"],
            options=q_data["options"],
            correct_option_index=q_data["correct_option_index"]
        )
        db.add(q)
    db.commit()
    print(f"[OK] Seeded {len(QUESTIONS)} questions")

def seed_users():
    users = []
    
    # Instructor
    inst = User(
        username="instructor1",
        email="instructor@learnpulse.ai",
        hashed_password=get_password_hash("instructor123"),
        role=Role.INSTRUCTOR
    )
    db.add(inst)
    
    # Students with different learning patterns
    student_profiles = [
        ("alice_good",    "alice@test.com",    "alice123",    "consistent"),   # Good learner
        ("bob_guesser",   "bob@test.com",      "bob123",      "guessing"),     # Guessing behavior
        ("charlie_str",   "charlie@test.com",  "charlie123",  "struggling"),   # Struggling student
        ("diana_mem",     "diana@test.com",    "diana123",    "memorizer"),    # Pattern memorizer
        ("evan_drift",    "evan@test.com",     "evan123",     "drifting"),     # Gradual drift
        ("fiona_avg",     "fiona@test.com",    "fiona123",    "consistent"),
    ]
    
    student_list = []
    for username, email, pwd, profile in student_profiles:
        u = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(pwd),
            role=Role.STUDENT
        )
        db.add(u)
        student_list.append((u, profile))
    
    db.commit()
    db.refresh(inst)
    for u, _ in student_list:
        db.refresh(u)
    
    print(f"[OK] Seeded 1 instructor + {len(student_list)} students")
    return student_list

def generate_attempt(student_id, question, profile, week_offset=0, is_drifting=False):
    """Generate a realistic attempt based on student profile."""
    topics_weak = {
        "consistent": [],
        "guessing": ["Recursion", "Dynamic Programming"],
        "struggling": ["Trees", "Dynamic Programming", "Recursion"],
        "memorizer": [],
        "drifting": ["Recursion"] if week_offset > 2 else [],
    }
    
    is_weak_topic = question.topic in topics_weak.get(profile, [])
    
    if profile == "consistent":
        correct = random.random() < 0.82
        time_taken = random.gauss(42, 8)
        retry_count = 0 if correct else random.randint(0, 1)
    
    elif profile == "guessing":
        if is_weak_topic:
            correct = random.random() < 0.35  # Low accuracy
            time_taken = random.gauss(7, 2)   # Very fast
            retry_count = random.randint(0, 1)
        else:
            correct = random.random() < 0.72
            time_taken = random.gauss(38, 10)
            retry_count = 0
    
    elif profile == "struggling":
        if is_weak_topic:
            correct = random.random() < 0.25  # Very low accuracy
            time_taken = random.gauss(75, 15) # Very slow - thinking hard
            retry_count = random.randint(1, 4)
        else:
            correct = random.random() < 0.65
            time_taken = random.gauss(50, 12)
            retry_count = random.randint(0, 2)
    
    elif profile == "memorizer":
        correct = random.random() < 0.88  # High accuracy
        time_taken = random.gauss(12, 3)  # Fast answers
        retry_count = 0
    
    elif profile == "drifting":
        if week_offset <= 1:
            # Early: good student
            correct = random.random() < 0.80
            time_taken = random.gauss(40, 8)
            retry_count = 0
        elif week_offset <= 3:
            # Middle: starting to show signs
            correct = random.random() < 0.58
            time_taken = random.gauss(55, 15)
            retry_count = random.randint(0, 2)
        else:
            # Late: clear drift pattern
            correct = random.random() < 0.35
            time_taken = random.gauss(10, 5) if is_weak_topic else random.gauss(60, 20)
            retry_count = random.randint(1, 3)
    
    else:
        correct = random.random() < 0.7
        time_taken = random.gauss(40, 12)
        retry_count = 0

    # Clamp values
    time_taken = max(2.0, round(time_taken, 1))
    retry_count = max(0, retry_count)
    
    return Attempt(
        student_id=student_id,
        question_id=question.id,
        correct=bool(correct),
        time_taken=time_taken,
        retry_count=retry_count,
        topic=question.topic,
        timestamp=datetime.utcnow() - timedelta(days=(6 - week_offset) * 7) + timedelta(
            hours=random.randint(0, 48),
            minutes=random.randint(0, 59)
        )
    )

def seed_attempts(student_list):
    questions = db.query(Question).all()
    total_attempts = 0
    
    for student, profile in student_list:
        # Generate 4-6 weeks of attempts
        for week in range(6):
            week_questions = random.choices(questions, k=random.randint(8, 12))
            for q in week_questions:
                attempt = generate_attempt(student.id, q, profile, week)
                db.add(attempt)
                total_attempts += 1
        
    db.commit()
    print(f"[OK] Seeded {total_attempts} student attempts with realistic drift patterns")

if __name__ == "__main__":
    print("\n[*] LearnPulse AI - Database Seeder")
    print("=" * 40)
    clear_data()
    seed_questions()
    student_list = seed_users()
    seed_attempts(student_list)
    
    print("\n[OK] Seeding Complete!")
    print("\nDemo Credentials:")
    print("  Instructor: username=instructor1  password=instructor123")
    print("  Student:    username=alice_good   password=alice123")
    print("  Student:    username=bob_guesser  password=bob123")
    print("  Student:    username=charlie_str  password=charlie123")
    print("  Student:    username=evan_drift   password=evan123")
    print("\nTo run ML analysis on students, use the Instructor Dashboard > Analyze Drift button")
    
    db.close()

