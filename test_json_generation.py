import json
import google.generativeai as genai

def test_json_generation():
    try:
        # Load API key from configuration file
        with open('classroom-ai.json', 'r') as f:
            config = json.load(f)
        
        print("✓ Configuration file loaded successfully")
        
        # Configure Gemini API
        genai.configure(api_key=config['gemini_api_key'])
        print("✓ Gemini API configured successfully")
        
        # Initialize Gemini Pro Model
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("✓ Model initialized successfully")
        
        # Test JSON generation
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

        prompt_text = "Generate 1 quiz for the lecture content: basic math operations"
        full_prompt = f"{system_prompt}\n\n{prompt_text}"
        
        generation_config = genai.types.GenerationConfig(
            temperature=0.5,
            top_p=0.95,
            max_output_tokens=8192,
        )
        
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
        print("✓ Test generation successful")
        print(f"Raw response: {response.text}")
        
        # Try to parse JSON
        try:
            parsed = json.loads(response.text)
            print("✓ JSON parsing successful")
            print(f"Parsed result: {json.dumps(parsed, indent=2)}")
            return True
        except json.JSONDecodeError as e:
            print(f"✗ JSON parsing failed: {str(e)}")
            # Try to extract JSON
            import re
            json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
            if json_match:
                extracted_json = json_match.group(0)
                try:
                    parsed = json.loads(extracted_json)
                    print("✓ JSON extraction successful")
                    print(f"Extracted result: {json.dumps(parsed, indent=2)}")
                    return True
                except json.JSONDecodeError:
                    print("✗ JSON extraction also failed")
                    return False
            return False
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing JSON generation...")
    success = test_json_generation()
    if success:
        print("\n✓ JSON generation test passed!")
    else:
        print("\n✗ JSON generation test failed.") 