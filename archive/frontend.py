import streamlit as st
import requests

def format_option(opt):
    letter, text = opt
    return f"{letter}: {text}"

# Function to make the POST request to the backend using form-data
def get_quiz_data(prompt, num_quizzes, questions_str=None, file=None):
    url = "http://127.0.0.1:5011/generate-quiz"
    
    # Data to be sent in the form body
    data = {
        "prompt": prompt,
        "num_quizzes": num_quizzes  
    }
    
    # Include the questions string if provided
    if questions_str is not None:
        data["questions"] = questions_str
    
    # Prepare the files dictionary if a file is uploaded
    files = {}
    if file is not None:
        files['file'] = (file.name, file, file.type)
    
    response = requests.post(url, data=data, files=files)
    
    if response.status_code == 200:
        return response.json()
    else:
        return None


def upload_student_questions(text_file):
    if text_file is not None:
        content = text_file.read().decode("utf-8")
        questions = content.splitlines()
        return questions
    return None

# Initialize session state variables if they don't exist.
if "page" not in st.session_state:
    st.session_state["page"] = "generator"
if "quiz_data" not in st.session_state:
    st.session_state["quiz_data"] = []
if "user_answers" not in st.session_state:
    st.session_state["user_answers"] = {}

# final results view
if st.session_state["page"] == "final":
    st.title("Quiz Results")
    if not st.session_state.quiz_data:
        st.error("No quiz data available. Please generate a quiz first.")
    else:
        quiz_data = st.session_state.quiz_data
        score = 0
        i = 0
        for quiz in quiz_data:
            st.subheader(f"Question {i+1}")
            st.write(f"**Question:** {quiz['question']}")
            options = quiz.get("options", {})
            for key, value in options.items():
                st.write(f"{key}: {value}")
            correct = quiz["correct"]
            user_answer = st.session_state.user_answers.get(i, None)
            if user_answer == correct:
                st.success(f"Your answer: {user_answer} (Correct)")
                score += 1
            else:
                st.error(f"Your answer: {user_answer} (Incorrect) — Correct answer: {correct}")
            st.write(f"Explanation: {quiz['explanation']}")
            st.markdown("---")
            i += 1
        st.write(f"**Your Score: {score} out of {len(quiz_data)}**")
    if st.button("Restart"):
        st.session_state["page"] = "generator"
        st.session_state["quiz_data"] = []
        st.session_state["user_answers"] = {}
        st.rerun()


# interactive quiz view
elif st.session_state["page"] == "quiz":
    st.title("Take the Quiz")
    if not st.session_state.get("quiz_data"):
        st.error("No quiz data available. Please generate a quiz first.")
    else:
        quiz_data = st.session_state.quiz_data
        i = 0
        for quiz in quiz_data:
            st.subheader(f"Question {i+1}")
            st.write(quiz["question"])
            options = quiz.get("options", {})
            # Use a tuple (letter, text) so that we can display full text while keeping the answer letter.
            selected_option = st.radio(
                f"Select your answer for question {i+1}:",
                options=list(options.items()),
                format_func=format_option,
                key=f"q{i}"
            )
            st.session_state.user_answers[i] = selected_option[0]
            i += 1

        if st.button("Submit Answers"):
            st.session_state["page"] = "final"
            st.rerun()
else:
    # Quiz generation view
    st.title("Quiz Generator")
    prompt = st.text_input("Enter the quiz prompt", "quiz me about digital transformation")
    num_quizzes = st.number_input("Number of questions", min_value=1, max_value=10, value=3, step=1)
    
    # File uploader for student questions
    questions = st.file_uploader("Upload student questions")

    # File uploader for an optional file upload
    file = st.file_uploader("Upload a file (optional)")
    
    if st.button("Generate Quiz"):
        if prompt and num_quizzes:
            questions = upload_student_questions(questions)
            quiz_data = get_quiz_data(prompt, num_quizzes, questions, file)
            if quiz_data:
                st.session_state.quiz_data = quiz_data
                st.session_state["page"] = "quiz"
                st.rerun()
            else:
                st.error("Error generating quizzes. Please check the backend.")
        else:
            st.error("Please provide both a prompt and a number of quizzes.")