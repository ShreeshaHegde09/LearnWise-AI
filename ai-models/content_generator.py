import openai
import json
import re
from typing import Dict, List, Any
import random

class ContentGenerator:
    def __init__(self, api_key: str = None):
        """
        Initialize the content generator with OpenAI API
        """
        self.api_key = api_key
        if api_key:
            openai.api_key = api_key
        
        self.chunk_templates = {
            'introduction': {
                'title_pattern': 'Introduction to {topic}',
                'objective': 'Understand the basic concepts and importance of {topic}'
            },
            'fundamentals': {
                'title_pattern': 'Fundamentals of {topic}',
                'objective': 'Learn the core principles and building blocks'
            },
            'practical': {
                'title_pattern': 'Practical Applications of {topic}',
                'objective': 'Apply knowledge through examples and exercises'
            },
            'advanced': {
                'title_pattern': 'Advanced {topic} Concepts',
                'objective': 'Explore complex topics and edge cases'
            },
            'summary': {
                'title_pattern': '{topic} Summary and Review',
                'objective': 'Consolidate learning and prepare for assessment'
            }
        }
    
    def generate_study_content(self, raw_content: str, topic: str, user_style: Dict = None) -> Dict:
        """
        Generate structured study content from raw material
        """
        try:
            if self.api_key:
                return self._generate_with_openai(raw_content, topic, user_style)
            else:
                return self._generate_fallback_content(raw_content, topic, user_style)
        except Exception as e:
            print(f"Error generating content: {e}")
            return self._generate_fallback_content(raw_content, topic, user_style)
    
    def _generate_with_openai(self, raw_content: str, topic: str, user_style: Dict = None) -> Dict:
        """
        Generate content using OpenAI API
        """
        # Prepare the prompt based on user learning style
        style_preferences = self._get_style_preferences(user_style)
        
        prompt = f"""
        Create a comprehensive learning structure for the topic: "{topic}"
        
        User Learning Preferences:
        - Chunk Size: {style_preferences['chunk_size']}
        - Learning Pace: {style_preferences['pace']}
        - Content Difficulty: {style_preferences['difficulty']}
        - Preferred Format: {style_preferences['format']}
        
        Based on the following material:
        {raw_content[:4000]}...
        
        Generate a progressive learning structure with:
        1. Break content into {style_preferences['num_chunks']} digestible chunks
        2. Each chunk should have a clear title and learning objective
        3. Content should be formatted in HTML with proper styling using red and black theme
        4. Include interactive elements and examples where appropriate
        5. Ensure content flows logically from basic to advanced concepts
        
        Return as JSON with this exact structure:
        {{
            "topic": "{topic}",
            "total_chunks": {style_preferences['num_chunks']},
            "estimated_total_time": "X minutes",
            "chunks": [
                {{
                    "id": "chunk_1",
                    "title": "Clear, descriptive title",
                    "content": "<div class='learning-content' style='background: #000; color: #fff; padding: 20px; border-left: 4px solid #dc2626;'>HTML formatted content with red accents</div>",
                    "learning_objective": "What students will learn in this chunk",
                    "estimated_time": "X minutes",
                    "difficulty_level": "beginner|intermediate|advanced",
                    "key_concepts": ["concept1", "concept2", "concept3"]
                }}
            ]
        }}
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=3000,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON response
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Extract JSON from response if it's wrapped in other text
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("Could not parse JSON from OpenAI response")
    
    def _generate_fallback_content(self, raw_content: str, topic: str, user_style: Dict = None) -> Dict:
        """
        Generate content without external API (fallback method)
        """
        style_preferences = self._get_style_preferences(user_style)
        
        # Split content into chunks based on length and natural breaks
        chunks = self._split_content_intelligently(raw_content, style_preferences['num_chunks'])
        
        structured_chunks = []
        chunk_types = ['introduction', 'fundamentals', 'practical', 'advanced', 'summary']
        
        for i, chunk_content in enumerate(chunks):
            chunk_type = chunk_types[min(i, len(chunk_types) - 1)]
            template = self.chunk_templates[chunk_type]
            
            chunk = {
                "id": f"chunk_{i + 1}",
                "title": template['title_pattern'].format(topic=topic),
                "content": self._format_chunk_content(chunk_content, topic),
                "learning_objective": template['objective'].format(topic=topic),
                "estimated_time": f"{random.randint(5, 15)} minutes",
                "difficulty_level": self._determine_difficulty_level(i, len(chunks)),
                "key_concepts": self._extract_key_concepts(chunk_content)
            }
            
            structured_chunks.append(chunk)
        
        return {
            "topic": topic,
            "total_chunks": len(structured_chunks),
            "estimated_total_time": f"{sum(int(chunk['estimated_time'].split()[0]) for chunk in structured_chunks)} minutes",
            "chunks": structured_chunks
        }
    
    def _get_style_preferences(self, user_style: Dict = None) -> Dict:
        """
        Extract user style preferences or use defaults
        """
        if not user_style:
            user_style = {}
        
        return {
            'chunk_size': user_style.get('preferred_chunk_size', 'medium'),
            'pace': user_style.get('learning_pace', 'normal'),
            'difficulty': user_style.get('content_difficulty', 'intermediate'),
            'format': user_style.get('preferred_format', 'mixed'),
            'num_chunks': self._get_chunk_count(user_style.get('preferred_chunk_size', 'medium'))
        }
    
    def _get_chunk_count(self, chunk_size: str) -> int:
        """
        Determine number of chunks based on preferred size
        """
        size_mapping = {
            'small': 8,
            'medium': 6,
            'large': 4
        }
        return size_mapping.get(chunk_size, 6)
    
    def _split_content_intelligently(self, content: str, num_chunks: int) -> List[str]:
        """
        Split content into chunks intelligently based on natural breaks
        """
        # Split by paragraphs first
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        if len(paragraphs) <= num_chunks:
            return paragraphs
        
        # Group paragraphs into chunks
        chunk_size = len(paragraphs) // num_chunks
        chunks = []
        
        for i in range(0, len(paragraphs), chunk_size):
            chunk_paragraphs = paragraphs[i:i + chunk_size]
            chunks.append('\n\n'.join(chunk_paragraphs))
        
        # Ensure we have exactly num_chunks
        while len(chunks) > num_chunks:
            # Merge the last two chunks
            last_chunk = chunks.pop()
            chunks[-1] += '\n\n' + last_chunk
        
        return chunks
    
    def _format_chunk_content(self, content: str, topic: str) -> str:
        """
        Format chunk content with HTML and red/black styling
        """
        # Basic HTML formatting with red and black theme
        formatted_content = f"""
        <div class="learning-content" style="
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: #ffffff;
            padding: 24px;
            border-radius: 8px;
            border-left: 4px solid #dc2626;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
        ">
            <h2 style="color: #dc2626; margin-bottom: 16px; font-size: 24px;">
                Learning Content
            </h2>
            
            <div style="margin-bottom: 20px;">
                {self._format_paragraphs(content)}
            </div>
            
            <div style="
                background: #1f1f1f;
                padding: 16px;
                border-radius: 6px;
                border: 1px solid #dc2626;
                margin-top: 20px;
            ">
                <h4 style="color: #dc2626; margin: 0 0 8px 0;">💡 Key Takeaway</h4>
                <p style="margin: 0; color: #e5e5e5; font-style: italic;">
                    {self._generate_key_takeaway(content, topic)}
                </p>
            </div>
        </div>
        """
        
        return formatted_content
    
    def _format_paragraphs(self, content: str) -> str:
        """
        Format paragraphs with proper HTML structure
        """
        paragraphs = content.split('\n\n')
        formatted_paragraphs = []
        
        for paragraph in paragraphs:
            if paragraph.strip():
                # Check if it looks like a heading
                if len(paragraph) < 100 and paragraph.isupper():
                    formatted_paragraphs.append(f'<h3 style="color: #dc2626; margin: 20px 0 10px 0;">{paragraph}</h3>')
                else:
                    formatted_paragraphs.append(f'<p style="margin-bottom: 16px; color: #e5e5e5;">{paragraph}</p>')
        
        return '\n'.join(formatted_paragraphs)
    
    def _generate_key_takeaway(self, content: str, topic: str) -> str:
        """
        Generate a key takeaway from the content
        """
        # Simple extraction of first sentence or create a generic takeaway
        sentences = content.split('.')
        if sentences and len(sentences[0]) > 20:
            return sentences[0].strip() + '.'
        else:
            return f"Understanding this concept is crucial for mastering {topic}."
    
    def _determine_difficulty_level(self, chunk_index: int, total_chunks: int) -> str:
        """
        Determine difficulty level based on chunk position
        """
        if chunk_index < total_chunks * 0.3:
            return 'beginner'
        elif chunk_index < total_chunks * 0.7:
            return 'intermediate'
        else:
            return 'advanced'
    
    def _extract_key_concepts(self, content: str) -> List[str]:
        """
        Extract key concepts from content
        """
        # Simple keyword extraction (in a real implementation, you might use NLP)
        words = content.split()
        
        # Filter for potential key concepts (longer words, capitalized, etc.)
        concepts = []
        for word in words:
            word = word.strip('.,!?;:"()[]{}')
            if (len(word) > 4 and 
                (word[0].isupper() or word.isupper()) and 
                word.isalpha()):
                concepts.append(word.lower())
        
        # Remove duplicates and return top concepts
        unique_concepts = list(set(concepts))
        return unique_concepts[:5]
    
    def simplify_content(self, content: str, current_level: str = 'intermediate') -> str:
        """
        Simplify content based on user's emotional state or request
        """
        if self.api_key:
            return self._simplify_with_openai(content, current_level)
        else:
            return self._simplify_fallback(content, current_level)
    
    def _simplify_with_openai(self, content: str, current_level: str) -> str:
        """
        Simplify content using OpenAI API
        """
        prompt = f"""
        Simplify the following learning content to make it easier to understand.
        Current difficulty level: {current_level}
        Target: Make it one level easier (advanced -> intermediate -> beginner)
        
        Requirements:
        1. Use simpler vocabulary
        2. Break down complex concepts into smaller parts
        3. Add more examples and analogies
        4. Maintain the red and black HTML styling
        5. Keep the same overall structure but make it more digestible
        
        Content to simplify:
        {content}
        
        Return the simplified HTML content:
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.5
        )
        
        return response.choices[0].message.content
    
    def _simplify_fallback(self, content: str, current_level: str) -> str:
        """
        Simplify content without external API
        """
        # Basic simplification: shorter sentences, simpler words
        simplified = content.replace('utilize', 'use')
        simplified = simplified.replace('demonstrate', 'show')
        simplified = simplified.replace('implement', 'do')
        simplified = simplified.replace('comprehensive', 'complete')
        
        # Add encouraging notes
        encouragement = """
        <div style="
            background: #dc2626;
            color: white;
            padding: 12px;
            border-radius: 6px;
            margin: 16px 0;
            text-align: center;
        ">
            📚 Don't worry! We've simplified this content to make it easier to understand. Take your time!
        </div>
        """
        
        # Insert encouragement after the first paragraph
        parts = simplified.split('</p>', 1)
        if len(parts) == 2:
            simplified = parts[0] + '</p>' + encouragement + parts[1]
        
        return simplified

# Example usage
if __name__ == "__main__":
    generator = ContentGenerator()
    
    # Test content generation
    sample_content = """
    Machine learning is a subset of artificial intelligence that focuses on algorithms 
    that can learn and make decisions from data. It involves training models on datasets 
    to recognize patterns and make predictions about new, unseen data.
    
    There are three main types of machine learning: supervised learning, unsupervised 
    learning, and reinforcement learning. Each type has its own applications and use cases.
    """
    
    result = generator.generate_study_content(sample_content, "Machine Learning")
    print("Generated content structure:")
    print(json.dumps(result, indent=2))