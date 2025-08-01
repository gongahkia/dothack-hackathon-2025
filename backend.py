from flask import Flask, jsonify, request
import json
import os
from flask_cors import CORS
from google import genai
from google.genai import types
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
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "classroom-ai.json"
        client = genai.Client(
            vertexai=True,
            project="classroom-ai-454103",
            location="us-central1"
        )
        
        # Initialize Gemini Pro Model
        model = "gemini-2.0-flash-lite-001"
        
        si_text1 = """You a classroom quiz generator for a particular lecture. 
        Given a prompt, which will specify the content of the lecture, the questions asked by students during the lecture and the answer given, 
        the number of quizzes to generate, generate the question in JSON format in the following order for each quiz: Question, Options, Correct, Explanation"""

        # Prepare content parts
        prompt_text = f"\nGenerate {num_quizzes} quizzes for the lecture content, and {prompt}"
        if questions:
            prompt_text += "\nEnsure to generate questions that cover the concepts from these questions: " + questions
        parts = [types.Part.from_text(text=prompt_text)]
        
        # Add PDF content if provided
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as pdf_file:
                pdf_content = pdf_file.read()
                pdf_part = types.Part(
                    inline_data=types.Blob(
                        mime_type="application/pdf",
                        data=pdf_content
                    )
                )
                parts.append(pdf_part)
        
        contents = [
            types.Content(
                role="user",
                parts=parts
            )
        ]

        with open('format.JSON','r') as file:
            format = json.load(file)

        generate_content_config = types.GenerateContentConfig(
            temperature = 0.5,
            top_p = 0.95,
            max_output_tokens = 8192,
            response_modalities = ["TEXT"],
            response_mime_type = "application/json",
            response_schema = format,
            system_instruction=[types.Part.from_text(text=si_text1)],
        )
        
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config
        )

        return response.text

    except Exception as e:
        raise Exception(f"Error in generate function: {str(e)}")

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
        
        print(pdf_path)
        print(prompt)
        print(num_quizzes)
        result = generate(prompt, num_quizzes, questions, pdf_path)
        
        # Clean up uploaded file if it exists
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)
            
        return jsonify(json.loads(result))
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5011)
