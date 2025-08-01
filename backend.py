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

        system_prompt = """..."""  # Your existing system_prompt (omitted here for brevity)

        prompt_text = f"""Generate {num_quizzes} high-quality quiz questions for the lecture content: {prompt}

## QUESTION DESIGN PROCESS
For each question, ensure:
- Clear, focused question stem that tests one specific concept
- All distractors are plausible and address common misconceptions
- Correct answer is unambiguous and well-justified
- Explanation teaches the concept and connects to broader learning objectives
- Question difficulty is appropriate for the target audience

## CONTENT INTEGRATION
If student questions were provided, incorporate those concepts and address any knowledge gaps they reveal."""
        
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