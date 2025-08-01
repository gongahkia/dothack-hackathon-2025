from flask import Flask, jsonify, request
import json
import os
import re
from flask_cors import CORS
import google.generativeai as genai
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx', 'doc', 'pptx', 'ppt', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'ico', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
print("[Startup] Upload folder ensured at:", UPLOAD_FOLDER)

def allowed_file(filename):
    allowed = '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    print(f"[allowed_file] Filename '{filename}' allowed: {allowed}")
    return allowed

def generate(prompt, num_quizzes, questions=None, pdf_path=None):
    try:
        print("[generate] Starting generation process...")
        # Load API key from configuration file
        with open('classroom-ai.json', 'r') as f:
            config = json.load(f)
        print("[generate] Loaded API key from configuration file.")

        # Configure Gemini API
        genai.configure(api_key=config['gemini_api_key'])
        print("[generate] Configured Gemini API with API key.")

        # Initialize Gemini Pro Model
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("[generate] Initialized Gemini Pro model 'gemini-1.5-flash'.")

        system_prompt = """You are Dr. Sarah Chen, an expert educational psychologist and assessment specialist with 15 years of experience in curriculum development and learning analytics. You specialize in creating engaging, pedagogically sound assessments that promote deep learning and critical thinking.

## TASK
Generate high-quality multiple-choice quiz questions that effectively assess student understanding of the given lecture content. Each question should test different cognitive levels (recall, comprehension, application, analysis) and provide meaningful learning opportunities through well-crafted explanations.

## CONTEXT
- You are creating assessments for higher education students
- Questions should align with learning objectives and promote active engagement
- The goal is to reinforce key concepts while identifying knowledge gaps
- Students should learn from both correct and incorrect answers through detailed explanations

## REFERENCE FRAMEWORK
Follow these pedagogical principles:
1. **Bloom's Taxonomy**: Include questions across different cognitive levels
2. **Constructivist Learning**: Explanations should help students build mental models
3. **Assessment for Learning**: Use explanations to teach, not just test
4. **Cognitive Load Theory**: Avoid overly complex question stems
5. **Retrieval Practice**: Questions should strengthen memory consolidation

## EVALUATION CRITERIA
Each question must meet these standards:
- **Clarity**: Unambiguous language, clear question stem
- **Validity**: Directly tests the intended learning objective
- **Distractors**: All incorrect options are plausible and educational
- **Difficulty**: Appropriate for the target audience
- **Educational Value**: Explanations provide learning opportunities

## ITERATION PROCESS
Think through each question systematically:
1. **Analyze the content**: What are the key concepts and learning objectives?
2. **Design the question**: What specific knowledge or skill am I testing?
3. **Create distractors**: What common misconceptions can I address?
4. **Write explanation**: How can I use this to teach the concept?
5. **Review and refine**: Does this question meet all evaluation criteria?

## CHAIN OF THOUGHT REASONING
Before generating each question, think through:
- What is the core concept being tested?
- What cognitive level am I targeting?
- What misconceptions do students commonly have?
- How can I make the explanation educational?
- Does this question contribute to deeper understanding?
"""

        # Prepare content parts with chain of thought reasoning
        prompt_text = f"""Generate {num_quizzes} high-quality quiz questions for the lecture content: {prompt}

## QUESTION DESIGN PROCESS
For each question, ensure:
- Clear, focused question stem that tests one specific concept
- All distractors are plausible and address common misconceptions
- Correct answer is unambiguous and well-justified
- Explanation teaches the concept and connects to broader learning objectives
- Question difficulty is appropriate for the target audience

## OUTPUT FORMAT
Return ONLY valid JSON array with this exact structure:
[
  {{
    "question": "Clear, focused question stem",
    "options": {{
      "a": "Plausible distractor that teaches",
      "b": "Correct answer",
      "c": "Plausible distractor that addresses misconception",
      "d": "Plausible distractor that reinforces concept"
    }},
    "correct": "a/b/c/d",
    "explanation": "Educational explanation that teaches the concept, addresses misconceptions, and connects to broader learning objectives"
  }}
]

IMPORTANT: Return ONLY the JSON array. No additional text, explanations, or commentary.

## CONTENT INTEGRATION
If student questions were provided, incorporate those concepts and address any knowledge gaps they reveal.
"""
        
        if questions:
            prompt_text += f"\n\n## STUDENT QUESTIONS TO ADDRESS\n{questions}\n\nEnsure your questions cover these concepts and address any misconceptions revealed in the student questions."
            print(f"[generate] Added student questions to prompt.")

        full_prompt = f"{system_prompt}\n\n{prompt_text}"
        print("[generate] Prepared full prompt for AI generation.")

        generation_config = genai.types.GenerationConfig(
            temperature=0.5,
            top_p=0.95,
            max_output_tokens=8192,
        )
        print("[generate] Defined generation configuration.")

        # Generate content
        if pdf_path and os.path.exists(pdf_path):
            print(f"[generate] PDF path provided: {pdf_path}. Reading file for upload...")
            with open(pdf_path, 'rb') as pdf_file:
                pdf_content = pdf_file.read()
                print(f"[generate] Read PDF file ({len(pdf_content)} bytes). Sending request to AI...")
                response = model.generate_content(
                    [full_prompt, {"mime_type": "application/pdf", "data": pdf_content}],
                    generation_config=generation_config
                )
        else:
            print("[generate] No PDF provided. Sending prompt text request to AI...")
            response = model.generate_content(
                full_prompt,
                generation_config=generation_config
            )

        response_text = response.text
        print("[generate] Received response from AI.")

        json_match = re.search(r'(\[.*\])', response_text, re.DOTALL)
        if json_match:
            # Try to parse the matched JSON section
            candidate_json = json_match.group(1)
            try:
                parsed = json.loads(candidate_json)
                response_text = candidate_json
            except json.JSONDecodeError:
                # If parse fails, keep original text to trigger error downstream
                pass

        if json_match:
            response_text = json_match.group(0)
            print("[generate] Extracted JSON array from AI response.")
        else:
            print("[generate] Warning: JSON array not found in AI response; using full response text.")

        return response_text

    except Exception as e:
        error_msg = f"Error in generate function: {str(e)}"
        print(f"[generate][Error] {error_msg}")
        raise Exception(error_msg)

@app.route('/', methods=['GET'])
def health_check():
    print("[health_check] Health check endpoint hit.")
    return jsonify({'status': 'Backend is running', 'message': 'Server is healthy'})

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        print("[generate_quiz] /generate-quiz endpoint called.")
        data = request.form
        if not data or 'prompt' not in data or 'num_quizzes' not in data:
            print("[generate_quiz][Error] Missing 'prompt' or 'num_quizzes' in request.")
            return jsonify({'error': 'Missing prompt or num_quizzes in request'}), 400

        prompt = data['prompt']
        print(f"[generate_quiz] Received prompt of length {len(prompt)} characters.")
        num_quizzes = int(data['num_quizzes'])
        print(f"[generate_quiz] Number of quizzes requested: {num_quizzes}")

        questions = None
        if 'questions' in data:
            questions = data['questions']
            print(f"[generate_quiz] Received additional questions for incorporation of length {len(questions)} characters.")

        pdf_path = None
        if 'file' in request.files:
            file = request.files['file']
            print(f"[generate_quiz] File upload detected: {file.filename if file else 'No file'}")
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(pdf_path)
                print(f"[generate_quiz] File saved to: {pdf_path}")
            else:
                print("[generate_quiz][Error] Invalid file type uploaded.")
                return jsonify({'error': 'Invalid file type.'}), 400

        print(f"[generate_quiz] Starting quiz generation with prompt and file: {pdf_path}")

        try:
            result = generate(prompt, num_quizzes, questions, pdf_path)

            if pdf_path and os.path.exists(pdf_path):
                os.remove(pdf_path)
                print(f"[generate_quiz] Uploaded file cleaned up from disk: {pdf_path}")

                print("[generate_quiz] Raw AI response received. Returning raw text without JSON parsing.")
                print(result)
                return jsonify({'raw_response': result})

        except Exception as e:
            print(f"[generate_quiz][Error] Exception in generate function: {str(e)}")
            return jsonify({'error': f'Error in generate function: {str(e)}'}), 500

    except ValueError as e:
        print(f"[generate_quiz][Error] Value error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"[generate_quiz][Error] Unexpected error: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    print("[Startup] Starting Flask server on port 5011...")
    app.run(debug=True, port=5011)
