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

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate(prompt, num_quizzes, questions=None, pdf_path=None):
    try:
        # Load API key from configuration file
        with open('classroom-ai.json', 'r') as f:
            config = json.load(f)
        
        # Configure Gemini API
        genai.configure(api_key=config['gemini_api_key'])
        
        # Initialize Gemini Pro Model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        system_prompt = """You are a classroom quiz generator for a particular lecture. 
        Given a prompt, which will specify the content of the lecture, the questions asked by students during the lecture and the answer given, 
        the number of quizzes to generate, generate the question in JSON format in the following order for each quiz: Question, Options, Correct, Explanation.
        
        IMPORTANT: You must return ONLY valid JSON. Do not include any text before or after the JSON. The JSON should be an array of quiz objects.
        Each quiz object should have: "question", "options" (with a, b, c, d keys), "correct" (a, b, c, or d), and "explanation".
        
        Example format:
        [
          {
            "question": "What is the main benefit of digital transformation?",
            "options": {
              "a": "Increased costs",
              "b": "Improved efficiency",
              "c": "Reduced security",
              "d": "Slower processes"
            },
            "correct": "b",
            "explanation": "Digital transformation primarily aims to improve efficiency through technology adoption."
          }
        ]"""

        # Prepare content parts
        prompt_text = f"Generate {num_quizzes} quizzes for the lecture content: {prompt}"
        if questions:
            prompt_text += f"\nEnsure to generate questions that cover the concepts from these questions: {questions}"
        
        # Create the full prompt with system instruction
        full_prompt = f"{system_prompt}\n\n{prompt_text}"
        
        # Add PDF content if provided
        generation_config = genai.types.GenerationConfig(
            temperature=0.5,
            top_p=0.95,
            max_output_tokens=8192,
        )
        
        # Generate content
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as pdf_file:
                pdf_content = pdf_file.read()
                response = model.generate_content(
                    [full_prompt, {"mime_type": "application/pdf", "data": pdf_content}],
                    generation_config=generation_config
                )
        else:
            response = model.generate_content(
                full_prompt,
                generation_config=generation_config
            )

        response_text = response.text
        
        # Try to extract JSON if the response contains extra text
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(0)
        
        return response_text

    except Exception as e:
        raise Exception(f"Error in generate function: {str(e)}")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'status': 'Backend is running', 'message': 'Server is healthy'})

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        # Handle text data
        data = request.form
        if not data or 'prompt' not in data or 'num_quizzes' not in data:
            return jsonify({'error': 'Missing prompt or num_quizzes in request'}), 400

        prompt = data['prompt']
        num_quizzes = int(data['num_quizzes'])
        
        # Read questions if provided (treating it as a simple string)
        questions = None
        if 'questions' in data:
            questions = data['questions']

        # Handle PDF file if uploaded
        pdf_path = None
        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(pdf_path)
            else:
                return jsonify({'error': 'Invalid file type.'}), 400
        
        print(f"PDF path: {pdf_path}")
        print(f"Prompt: {prompt}")
        print(f"Number of quizzes: {num_quizzes}")
        
        try:
            result = generate(prompt, num_quizzes, questions, pdf_path)
            # Clean up uploaded file if it exists
            if pdf_path and os.path.exists(pdf_path):
                os.remove(pdf_path)
            
            # Debug: Print the raw response
            print(f"Raw AI response: {result}")
            
            # Try to parse JSON
            try:
                parsed_result = json.loads(result)
                return jsonify(parsed_result)
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {str(e)}")
                print(f"Response content: {result}")
                return jsonify({'error': f'Invalid JSON response from AI. Raw response: {result[:200]}...'}), 500
        except Exception as e:
            return jsonify({'error': f'Error in generate function: {str(e)}'}), 500
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5011)
