import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import time

load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        # Configure with timeout and safety settings
        generation_config = {
            'temperature': 0.7,
            'top_p': 0.95,
            'top_k': 40,
            'max_output_tokens': 8192,  # Increased for complete responses
        }
        # Use gemini-2.5-flash - CONFIRMED available with your API key!
        self.model = genai.GenerativeModel('gemini-2.5-flash', generation_config=generation_config)
        self.last_request_time = 0
        self.min_request_interval = 6  # 6 seconds between requests (10 per minute max)
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            wait_time = self.min_request_interval - time_since_last
            print(f"⏳ Rate limiting: waiting {wait_time:.1f}s...")
            time.sleep(wait_time)
        
        self.last_request_time = time.time()
    
    def _call_with_retry(self, prompt, max_retries=2):
        """Call Gemini API with retry logic for rate limits and timeouts"""
        for attempt in range(max_retries + 1):
            try:
                self._rate_limit()  # Enforce rate limiting
                response = self.model.generate_content(prompt)
                return response
            except Exception as e:
                error_str = str(e)
                
                # Handle rate limits
                if '429' in error_str or 'quota' in error_str.lower():
                    if attempt < max_retries:
                        import re
                        match = re.search(r'retry in (\d+\.?\d*)', error_str)
                        if match:
                            retry_delay = float(match.group(1)) + 1
                        else:
                            retry_delay = 10
                        
                        print(f"⚠️  Rate limit hit. Retrying in {retry_delay:.1f}s... (attempt {attempt + 1}/{max_retries + 1})")
                        time.sleep(retry_delay)
                    else:
                        print(f"❌ Rate limit exceeded after {max_retries + 1} attempts")
                        raise
                
                # Handle timeouts
                elif '504' in error_str or 'timeout' in error_str.lower() or 'timed out' in error_str.lower():
                    if attempt < max_retries:
                        retry_delay = 5  # Wait 5 seconds before retry
                        print(f"⏱️  Request timed out. Retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries + 1})")
                        print(f"💡 Tip: Content might be too long. Consider using a more specific topic.")
                        time.sleep(retry_delay)
                    else:
                        print(f"❌ Request timed out after {max_retries + 1} attempts")
                        print(f"💡 Using fallback content. Try a more specific topic next time.")
                        return None  # Return None to trigger fallback
                
                else:
                    # Other errors, don't retry
                    raise
        
        return None
    
    def generate_learning_chunks(self, content, topic):
        """Break content into comprehensive, in-depth learning chunks"""
        # Limit content to prevent truncation - use first 8000 chars for better processing
        content_preview = content[:8000] if len(content) > 8000 else content
        prompt = f"""You are an expert educator creating COMPREHENSIVE learning material about "{topic}".

SOURCE CONTENT (extract ALL key information from this):
{content_preview}

CRITICAL REQUIREMENTS:
1. Create EXACTLY 6-7 sections (no more!) that cover the topic comprehensively
2. Each section should be 150-200 words (concise but complete)
3. Include SPECIFIC examples, code snippets, formulas, or technical details
4. Cover ALL major concepts, not just surface-level introductions
5. Use the actual content provided along with your knowledge- don't make generic statements
6. If topic covers queries, syntax, commands, code ,include them with examples
7. If it's theory: include detailed explanations and comparisons, demerits and merits if its important
8. MUST return valid, complete JSON - ensure all strings are properly escaped 

CONTENT STRUCTURE FOR EACH SECTION:
- Start with <h3>emoji Title</h3>
- Detailed explanation (multiple paragraphs)
- Use <strong> for technical terms
- Use <em> for important concepts
- Include <ul><li> lists for key points
- Add REAL examples with <code> tags for syntax
- Include comparisons or contrasts where relevant
- make sure the content will cover all the topics mentioned in the files and also you can use your knowledge if something is wrong or insufficient. 

EXAMPLE FOR SQL TOPIC:
<h3>📊 SQL Query Fundamentals</h3>
<p>SQL (Structured Query Language) uses specific commands to interact with databases. The most fundamental operations are part of DML (Data Manipulation Language).</p>
<p><strong>SELECT Statement:</strong> The SELECT statement retrieves data from one or more tables.</p>
<p><code>SELECT column1, column2 FROM table_name WHERE condition;</code></p>
<ul>
<li><strong>SELECT *</strong> - Retrieves all columns</li>
<li><strong>WHERE clause</strong> - Filters rows based on conditions</li>
<li><strong>ORDER BY</strong> - Sorts results ascending or descending</li>
</ul>
<p><em>Example:</em> <code>SELECT name, age FROM students WHERE age > 18 ORDER BY name;</code></p>
<p>This query retrieves names and ages of students older than 18, sorted alphabetically.</p>

TOPICS TO COVER (adapt based on subject , use only which are very relevent and important):
1. Fundamentals and core concepts
2. Syntax, commands, or key operations
3. Advanced features or techniques
4. Practical examples and use cases
5. Common patterns or best practices

CRITICAL JSON FORMATTING RULES:
- Return EXACTLY 5-6 chunks, NO MORE
- Keep each chunk under 200 words to prevent truncation
- Escape ALL quotes inside content: use \\" for quotes
- Escape ALL backslashes: use \\\\ 
- Remove any newlines inside strings - use <br> instead
- Ensure valid JSON syntax
- MUST close the JSON array with ]
- DO NOT include any text before [ or after ]

Return ONLY valid JSON array (absolutely NO markdown, NO code blocks, NO explanations):
[{{"id":1,"title":"Title Here","content":"<h3>📚 Title</h3><p>Content here with \\"escaped quotes\\"</p>","estimated_time":"6min"}},{{"id":2,"title":"Next Title","content":"<h3>🔧 Title</h3><p>More content</p>","estimated_time":"7min"}}]

CRITICAL: Your response MUST start with [ and end with ] - nothing else!"""
        
        try:
            print(f"📤 Sending request to Gemini... (content length: {len(content_preview)} chars)")
            response = self._call_with_retry(prompt)
            
            if not response:
                print(f"❌ No response from Gemini (returned None)")
                return []
            
            print(f"✅ Got response from Gemini")
            text = response.text.strip()
            print(f"📝 Response length: {len(text)} characters")
            print(f"📄 First 200 chars: {text[:200]}")
            print(f"📄 Last 200 chars: {text[-200:]}")
            
            # Clean markdown and any extra text
            for marker in ['```json', '```', '```JSON']:
                if text.startswith(marker):
                    text = text[len(marker):].strip()
                if text.endswith('```'):
                    text = text[:-3].strip()
            
            # Remove any text before the opening bracket
            bracket_start = text.find('[')
            if bracket_start > 0:
                text = text[bracket_start:]
            
            # Remove any text after the closing bracket
            bracket_end = text.rfind(']')
            if bracket_end > 0 and bracket_end < len(text) - 1:
                text = text[:bracket_end + 1]
            
            text = text.strip()
            
            # Extract JSON - look for array brackets
            start = text.find('[')
            end = text.rfind(']')
            
            print(f"🔍 JSON array search: start={start}, end={end}")
            
            # Check if we have both brackets
            if start >= 0 and end > start:
                end = end + 1  # Include the closing bracket
                json_text = text[start:end]
                print(f"📊 Parsing JSON... (length: {len(json_text)})")
                
                try:
                    chunks = json.loads(json_text)
                    print(f"✅ Successfully parsed {len(chunks)} chunks")
                    return chunks
                except json.JSONDecodeError as e:
                    print(f"⚠️  JSON parse error: {e}")
                    print(f"🔧 Attempting to fix JSON...")
                    
                    # Try to fix common JSON issues
                    fixed_json = json_text
                    
                    # Fix unescaped quotes in content
                    # This is a simple fix - replace problematic patterns
                    import re
                    
                    # Try using ast.literal_eval as fallback
                    try:
                        # Replace single quotes with double quotes
                        fixed_json = fixed_json.replace("'", "\\'")
                        chunks = json.loads(fixed_json)
                        print(f"✅ Fixed and parsed {len(chunks)} chunks")
                        return chunks
                    except:
                        print(f"❌ Could not fix JSON. Using fallback.")
                        print(f"Error location: {str(e)}")
                        return []
            elif start >= 0 and end == -1:
                # Found opening bracket but no closing bracket - response was truncated
                print(f"⚠️  Response appears truncated (found '[' but no ']')")
                print(f"💡 Attempting to close JSON array and parse partial response...")
                
                # Try to salvage what we have by closing the array
                json_text = text[start:]
                
                # Find the last complete object by looking for "},"
                last_complete_with_comma = json_text.rfind('},')
                last_complete_without_comma = json_text.rfind('}')
                
                if last_complete_with_comma > 0:
                    # Found a complete object followed by comma
                    json_text = json_text[:last_complete_with_comma + 1] + ']'
                elif last_complete_without_comma > 0:
                    # Found a complete object without comma (might be the last one)
                    json_text = json_text[:last_complete_without_comma + 1] + ']'
                else:
                    print(f"❌ No complete objects found in truncated response")
                    return []
                
                print(f"🔧 Attempting to parse truncated JSON (length: {len(json_text)})")
                print(f"📄 Truncated JSON preview: {json_text[:300]}...")
                
                try:
                    chunks = json.loads(json_text)
                    print(f"✅ Successfully parsed {len(chunks)} chunks from truncated response")
                    return chunks
                except json.JSONDecodeError as e:
                    print(f"❌ Could not parse truncated JSON: {e}")
                    print(f"Error at position: {e.pos if hasattr(e, 'pos') else 'unknown'}")
                    # Try one more time with more aggressive cleanup
                    try:
                        # Remove any incomplete strings at the end
                        import re
                        # Find last complete key-value pair
                        json_text = re.sub(r',\s*"[^"]*$', '', json_text)
                        json_text = re.sub(r':\s*"[^"]*$', '', json_text)
                        if not json_text.endswith(']'):
                            json_text += ']'
                        chunks = json.loads(json_text)
                        print(f"✅ Parsed {len(chunks)} chunks after aggressive cleanup")
                        return chunks
                    except:
                        print(f"❌ All parsing attempts failed")
                        return []
            else:
                print(f"❌ No JSON array found in response")
                print(f"Response preview: {text[:200]}...")
                return []
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}")
            print(f"Failed text preview: {text[:500] if 'text' in locals() else 'N/A'}...")
            return []
        except Exception as e:
            print(f"❌ Gemini error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def simplify_content(self, content):
        """Simplify complex content while maintaining depth and technical accuracy"""
        prompt = f"""Transform this content into an easier-to-understand format WITHOUT losing important details.

CRITICAL RULES:
1. KEEP all technical information, code examples, and specific details
2. Make language simpler, but DON'T remove content
3. Break complex sentences into shorter ones
4. Add visual formatting to highlight key information
5. Keep all examples, syntax, commands, and technical terms
6. Add analogies or simpler explanations ALONGSIDE technical content

VISUAL FORMATTING:
- Use <h3>emoji Title</h3> for sections
- Use <strong> for technical terms and commands
- Use <em> for important concepts
- Use <code> for syntax, commands, code examples
- Use <ul><li> for lists
- Add emojis sparingly (1-2 per section)

SIMPLIFICATION APPROACH:
1. Keep technical content intact
2. Add simpler explanations before or after technical parts
3. Use analogies to explain complex concepts
4. Break long paragraphs into shorter ones
5. Add visual structure with headings and lists
6. Highlight key terms with formatting

EXAMPLE TRANSFORMATION:
BEFORE: "The SELECT statement retrieves data from database tables using various clauses."
AFTER: 
<p><strong>SELECT Statement</strong> - This is how you get data from your database.</p>
<p><code>SELECT column FROM table WHERE condition;</code></p>
<p><em>Think of it like asking your database a question.</em> You specify what you want (columns), where to look (table), and any filters (WHERE).</p>

DO NOT:
❌ Remove technical details
❌ Skip code examples
❌ Oversimplify to the point of losing meaning
❌ Remove important concepts

DO:
✅ Add simpler explanations
✅ Use analogies and better examples
✅ Break into smaller chunks
✅ Add visual formatting
✅ Keep all technical accuracy

Content to simplify (keep all important details):
{content}

Return ONLY clean HTML - no markdown, no code blocks, no explanations."""
        
        try:
            response = self._call_with_retry(prompt)
            if not response:
                return content
            simplified_text = response.text.strip()
            
            # Clean up any markdown formatting that might be added
            lines = simplified_text.split('\n')
            cleaned_lines = []
            
            for line in lines:
                line = line.strip()
                # Skip markdown code block indicators
                if line in ['```html', '```', '```HTML']:
                    continue
                cleaned_lines.append(line)
            
            # Join back and clean up
            result = '\n'.join(cleaned_lines).strip()
            
            # Additional cleanup for any remaining markdown artifacts
            if result.startswith('```'):
                result = result[3:].strip()
            if result.endswith('```'):
                result = result[:-3].strip()
                
            return result if result else content
        except Exception as e:
            print(f"Error simplifying content: {e}")
            return content
    
    def generate_quiz(self, content, topic, question_count=5):
        """Generate quiz questions based on ACTUAL content, not metadata"""
        # Use ALL content and focus on the TOPIC
        content_text = content  # Use full content, not just beginning
        
        prompt = f"""You are creating a quiz EXCLUSIVELY about "{topic}". 

⚠️ CRITICAL: DO NOT ask questions about introductory sections, file metadata, or generic concepts!

TOPIC: {topic}

CONTENT (find ONLY {topic}-related information):
{content_text}

ABSOLUTE REQUIREMENTS:
1. EVERY question MUST test knowledge of "{topic}" SPECIFICALLY
2. NEVER use phrases like:
   - "According to the introductory section..."
   - "According to the material..."
   - "What type of content does this guide cover..."
   - "The document states..."
3. NEVER ask about:
   - What the file/guide/document covers
   - Introductory or overview sections
   - Generic definitions (data, information, etc.)
   - File structure or organization
4. ONLY ask about:
   - Technical concepts in "{topic}"
   - Specific commands, syntax, or operations in "{topic}"
   - Properties, characteristics, or features of "{topic}"
   - How "{topic}" works or is implemented

QUESTION TYPES:
- multiple_choice: Direct technical questions about {topic}
- fill_blank: Key terms/concepts in {topic}
- true_false: Technical statements about {topic}

EXAMPLES FOR "{topic}":

If topic is "SQL":
✅ "Which SQL command retrieves data from a database?"
✅ "The _____ clause filters rows in a SELECT statement."
✅ "A PRIMARY KEY can contain NULL values."

If topic is "Transactions in DBMS":
✅ "What does the 'A' in ACID stand for?"
✅ "A transaction in the _____ state has completed successfully."
✅ "Transactions ensure data consistency in databases."

NEVER DO THIS:
❌ "According to the introductory section, what type of content..."
❌ "The guide explicitly states it covers..."
❌ "What does the document say about..."
❌ "According to the material, data is..."

FOCUS: Ask ONLY about the technical concepts, operations, and details of "{topic}". Pretend the introductory sections don't exist.

Return ONLY valid JSON:
{{
    "questions": [
        {{
            "type": "multiple_choice",
            "question": "Specific technical question about {topic}?",
            "options": ["Specific option A", "Specific option B", "Specific option C", "Specific option D"],
            "correct": 2,
            "explanation": "Detailed explanation with technical reasoning..."
        }},
        {{
            "type": "fill_blank",
            "question": "The _____ command is used for [specific purpose].",
            "correct": "SPECIFIC_COMMAND",
            "explanation": "Technical explanation of why this is correct..."
        }},
        {{
            "type": "true_false",
            "question": "Specific technical statement about {topic}.",
            "correct": "true",
            "explanation": "Technical explanation..."
        }}
    ]
}}"""
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up markdown formatting
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            elif response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            json_str = response_text[start_idx:end_idx]
            
            quiz_data = json.loads(json_str)
            
            # Validate and ensure we have the right number of questions
            if len(quiz_data.get('questions', [])) < question_count:
                print(f"Warning: Generated {len(quiz_data['questions'])} questions, expected {question_count}")
            
            return quiz_data
        except Exception as e:
            print(f"Error generating quiz: {e}")
            return self._fallback_quiz(topic, question_count)
    
    def chat_response(self, message, context=""):
        """Generate detailed, technical chatbot responses"""
        prompt = f"""You are an expert tutor providing DETAILED, TECHNICAL answers about the learning material.

LEARNING CONTEXT:
{context}

USER QUESTION:
{message}

RESPONSE RULES:
1. Give Direct and correct short answers with technical depth but not too shallow answer
2. Include specific examples, code snippets, or formulas when relevant
3. Explain concepts thoroughly when asked, not just surface-level but not too long
4. If it's a technical question, provide technical details in short
5. Reference specific information from the learning context
6. Use analogies to explain complex concepts in short
7. Provide step-by-step explanations when appropriate
8. If asked for examples, give REAL, SPECIFIC examples

RESPONSE FORMAT:
- Start with a short and direct answer
- Provide detailed explanation (if relevant)
- Include examples or code if relevant
- Add additional context or related concepts
- Keep it educational and thorough

EXAMPLE GOOD RESPONSES:
Q: "How does JOIN work in SQL?"
A: "JOIN combines rows from two or more tables based on a related column.

Example:
SELECT orders.id, customers.name 
FROM orders 
INNER JOIN customers ON orders.customer_id = customers.id;

This retrieves order IDs with customer names by matching customer_id."

DO NOT give shallow responses like:
❌ "JOIN combines tables."
❌ "It's used to connect data."

Response:"""
        
        try:
            response = self._call_with_retry(prompt)
            if not response:
                return "I'm currently experiencing rate limits. Please wait a moment and try again."
            return response.text.strip()
        except Exception as e:
            print(f"Error generating chat response: {e}")
            return "I couldn't process that request. Please try rephrasing your question."
    
    def _fallback_chunks(self, topic):
        """Fallback chunks if API fails"""
        return [
            {
                "id": 1,
                "title": f"Introduction to {topic}",
                "content": f"<h3>Welcome to {topic}</h3><p>This is an introduction to your learning material.</p>",
                "estimated_time": "5 minutes",
                "objectives": ["Get familiar with the topic"]
            }
        ]
    
    def _fallback_quiz(self, topic, question_count=5):
        """Fallback quiz with meaningful questions about the topic"""
        # Create topic-specific questions based on common knowledge
        questions = [
            {
                "type": "multiple_choice",
                "question": f"What is the primary purpose of {topic}?",
                "options": [
                    "Data storage and management",
                    "User interface design",
                    "Network communication",
                    "File compression"
                ],
                "correct": 0,
                "explanation": f"{topic} is primarily used for managing and organizing data efficiently."
            },
            {
                "type": "fill_blank",
                "question": f"_____ is a fundamental concept in {topic}.",
                "correct": "Data structure",
                "explanation": "Understanding data structures is essential for working effectively with this topic."
            },
            {
                "type": "true_false",
                "question": f"{topic} requires understanding of basic programming concepts.",
                "correct": "true",
                "explanation": "Most technical topics build on fundamental programming knowledge."
            },
            {
                "type": "multiple_choice",
                "question": f"Which of these is a key feature of {topic}?",
                "options": [
                    "Scalability and performance",
                    "Color schemes",
                    "Audio processing",
                    "Image rendering"
                ],
                "correct": 0,
                "explanation": "Scalability and performance are crucial considerations in most technical systems."
            },
            {
                "type": "fill_blank",
                "question": f"Best practices in {topic} include proper _____ management.",
                "correct": "resource",
                "explanation": "Efficient resource management is a key best practice in technical implementations."
            }
        ]
        return {"questions": questions[:question_count]}
    
    def generate_flashcards(self, content, topic, card_count=10):
        """Generate flashcards based on ACTUAL content, not metadata"""
        # Use ALL content and focus on the TOPIC
        content_text = content  # Use full content, not just beginning
        
        prompt = f"""Create {card_count} flashcards EXCLUSIVELY about "{topic}".

⚠️ CRITICAL: DO NOT create cards about introductory sections, file metadata, or generic concepts!

TOPIC: {topic}

CONTENT (find ONLY {topic}-related information):
{content_text}

ABSOLUTE REQUIREMENTS:
1. EVERY flashcard MUST be about "{topic}" SPECIFICALLY
2. NEVER use phrases like:
   - "According to the material..."
   - "The document defines..."
   - "What does the guide say..."
3. NEVER create cards about:
   - What the file/guide/document covers
   - Introductory or overview sections
   - Generic definitions (data, information, etc.)
   - File structure or organization
4. ONLY create cards about:
   - Technical concepts in "{topic}"
   - Specific commands, syntax, or operations in "{topic}"
   - Properties, characteristics, or features of "{topic}"
   - How "{topic}" works or is implemented

EXAMPLES FOR "{topic}":

If topic is "SQL":
✅ Front: "SELECT statement syntax"
   Back: "SELECT column1, column2 FROM table WHERE condition;"
✅ Front: "What is a PRIMARY KEY?"
   Back: "A column that uniquely identifies each row in a table. Cannot be NULL."
✅ Front: "JOIN types in SQL"
   Back: "INNER, LEFT, RIGHT, FULL - combine rows from multiple tables"

If topic is "Transactions in DBMS":
✅ Front: "ACID properties"
   Back: "Atomicity, Consistency, Isolation, Durability"
✅ Front: "What is atomicity?"
   Back: "All operations in a transaction succeed or all fail - no partial completion"
✅ Front: "Transaction states"
   Back: "Active, Partially Committed, Committed, Failed, Aborted"

NEVER DO THIS:
❌ Front: "According to the material, what is data?"
❌ Front: "What type of content does this guide cover?"
❌ Front: "Qualitative vs Quantitative data"

FOCUS: Create cards ONLY about the technical concepts and details of "{topic}". Ignore all introductory content.

Return ONLY valid JSON:
{{
    "flashcards": [
        {{
            "front": "Specific technical term or question",
            "back": "Detailed technical answer with examples"
        }},
        {{
            "front": "Command or syntax name",
            "back": "Syntax: code_example - Explanation of what it does"
        }},
        {{
            "front": "Comparison: X vs Y",
            "back": "X is used for... while Y is used for... Key difference: ..."
        }}
    ]
}}"""
        
        try:
            response = self._call_with_retry(prompt)
            if not response:
                return self._fallback_flashcards(topic, card_count)
            response_text = response.text.strip()
            
            # Clean up markdown formatting
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            elif response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            json_str = response_text[start_idx:end_idx]
            
            flashcard_data = json.loads(json_str)
            
            return flashcard_data
        except Exception as e:
            print(f"Error generating flashcards: {e}")
            return self._fallback_flashcards(topic, card_count)
    
    def _fallback_flashcards(self, topic, card_count=10):
        """Fallback flashcards with meaningful content about the topic"""
        # Create topic-relevant flashcards
        flashcards = [
            {
                "front": f"What is {topic}?",
                "back": f"{topic} is a system/concept used for organizing, managing, and processing data or information efficiently."
            },
            {
                "front": "Core components",
                "back": f"The main components of {topic} include data structures, algorithms, and implementation patterns that work together."
            },
            {
                "front": "Primary use cases",
                "back": f"{topic} is commonly used in applications requiring data management, processing, and retrieval operations."
            },
            {
                "front": "Key advantages",
                "back": f"Benefits include improved efficiency, better organization, scalability, and easier maintenance of systems."
            },
            {
                "front": "Common operations",
                "back": f"Typical operations include creating, reading, updating, and deleting data (CRUD operations)."
            },
            {
                "front": "Best practices",
                "back": "Follow established patterns, maintain clean code, optimize for performance, and document your implementation."
            },
            {
                "front": "Performance considerations",
                "back": "Consider factors like time complexity, space complexity, scalability, and resource utilization."
            },
            {
                "front": "Common challenges",
                "back": "Challenges include handling large datasets, maintaining data integrity, ensuring security, and optimizing queries."
            },
            {
                "front": "Integration patterns",
                "back": f"{topic} can be integrated with other systems through APIs, libraries, and standard protocols."
            },
            {
                "front": "Learning path",
                "back": "Start with fundamentals, practice with examples, build projects, and gradually tackle advanced concepts."
            }
        ]
        return {"flashcards": flashcards[:card_count]}

    def generate_summary(self, prompt):
        """Generate a summary using Gemini"""
        try:
            response = self._call_with_retry(prompt)
            if not response:
                return "Unable to generate summary at this time. Please try again later."
            return response.text.strip()
        except Exception as e:
            print(f"Error generating summary: {e}")
            return "Unable to generate summary. Please try again later."
