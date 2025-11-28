"""
Smart Content Extractor
Extracts only topic-relevant content from large documents
"""

import re
from typing import List, Tuple

class ContentExtractor:
    def __init__(self):
        pass
    
    def extract_topic_content(self, full_content: str, topic: str, max_chars: int = 15000) -> str:
        """
        Extract only the sections relevant to the topic from full content.
        Uses keyword matching and section detection.
        
        Args:
            full_content: The complete document text
            topic: The specific topic to focus on (e.g., "Transactions in DBMS")
            max_chars: Maximum characters to extract (default 15000 for Gemini)
        
        Returns:
            Extracted relevant content
        """
        # Split topic into keywords
        topic_keywords = self._extract_keywords(topic)
        
        # Split content into sections
        sections = self._split_into_sections(full_content)
        
        # Score each section based on topic relevance
        scored_sections = []
        for section in sections:
            score = self._calculate_relevance_score(section, topic_keywords)
            if score > 0:
                scored_sections.append((score, section))
        
        # Sort by relevance score (highest first)
        scored_sections.sort(reverse=True, key=lambda x: x[0])
        
        # Take top relevant sections (limited by max_chars for Gemini)
        extracted_content = ""
        
        for score, section in scored_sections:
            # Check if adding this section would exceed limit
            if len(extracted_content) + len(section) <= max_chars:
                extracted_content += section + "\n\n"
            elif len(extracted_content) < max_chars * 0.8:
                # If we haven't reached 80% of limit, add partial section
                remaining = max_chars - len(extracted_content)
                extracted_content += section[:remaining] + "...\n\n"
                break
            else:
                break
        
        # If we got very little content, take from beginning
        if len(extracted_content) < 1000:
            extracted_content = full_content[:max_chars]
        
        return extracted_content.strip()
    
    def _extract_keywords(self, topic: str) -> List[str]:
        """Extract important keywords from topic"""
        # Remove common words
        stop_words = {'in', 'the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'with', 'on', 'at'}
        
        # Split and clean
        words = re.findall(r'\w+', topic.lower())
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        
        # Add the full topic as a phrase
        keywords.append(topic.lower())
        
        return keywords
    
    def _split_into_sections(self, content: str) -> List[str]:
        """Split content into logical sections"""
        # Try to split by headers (markdown style or numbered)
        sections = []
        
        # Split by common section markers
        patterns = [
            r'\n#{1,6}\s+.+\n',  # Markdown headers
            r'\n\d+\.\s+[A-Z].+\n',  # Numbered sections
            r'\n[A-Z][A-Z\s]+\n',  # ALL CAPS headers
            r'\n\n\n+',  # Multiple blank lines
        ]
        
        current_section = ""
        lines = content.split('\n')
        
        for line in lines:
            # Check if this line is a section header
            is_header = False
            for pattern in patterns[:3]:  # Check header patterns
                if re.match(pattern, '\n' + line + '\n'):
                    is_header = True
                    break
            
            if is_header and current_section.strip():
                # Save current section and start new one
                sections.append(current_section.strip())
                current_section = line + '\n'
            else:
                current_section += line + '\n'
        
        # Add last section
        if current_section.strip():
            sections.append(current_section.strip())
        
        # If no sections found, split by paragraphs
        if len(sections) <= 1:
            sections = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        return sections
    
    def _calculate_relevance_score(self, section: str, keywords: List[str]) -> float:
        """Calculate how relevant a section is to the topic"""
        section_lower = section.lower()
        score = 0.0
        
        for keyword in keywords:
            # Count occurrences
            count = section_lower.count(keyword)
            
            # Weight longer keywords more
            weight = len(keyword) / 5.0
            
            score += count * weight
        
        # Bonus for section headers containing keywords
        first_line = section.split('\n')[0].lower()
        for keyword in keywords:
            if keyword in first_line:
                score += 10.0
        
        return score
    
    def extract_chapter_content(self, full_content: str, chapter_keywords: List[str]) -> str:
        """
        Extract a specific chapter or unit from content.
        
        Args:
            full_content: The complete document text
            chapter_keywords: Keywords identifying the chapter (e.g., ["chapter 5", "transactions"])
        
        Returns:
            Extracted chapter content
        """
        sections = self._split_into_sections(full_content)
        
        # Find sections matching chapter keywords
        chapter_sections = []
        in_chapter = False
        
        for i, section in enumerate(sections):
            section_lower = section.lower()
            
            # Check if this section starts the chapter
            matches_start = any(keyword.lower() in section_lower[:200] for keyword in chapter_keywords)
            
            if matches_start:
                in_chapter = True
            
            # Check if we've moved to next chapter
            if in_chapter and i > 0:
                # Look for next chapter markers
                next_chapter_markers = ['chapter', 'unit', 'section', 'part']
                first_line = section.split('\n')[0].lower()
                
                # If we see a new chapter marker and it's not our chapter, stop
                if any(marker in first_line for marker in next_chapter_markers):
                    if not any(keyword.lower() in first_line for keyword in chapter_keywords):
                        break
            
            if in_chapter:
                chapter_sections.append(section)
        
        if chapter_sections:
            return '\n\n'.join(chapter_sections)
        else:
            # Fallback: use topic extraction
            topic = ' '.join(chapter_keywords)
            return self.extract_topic_content(full_content, topic)

# Global instance
content_extractor = ContentExtractor()
