const { JSDOM } = require('jsdom');
const { sendMessageToClaude } = require('./claudeService');

// In-memory store for resumes (keyed by conversationId)
const resumeStore = {};

/**
 * Handles the updateResumeContent tool
 * @param {Object} params
 * @param {string} params.conversationId - The conversation ID
 * @param {string} params.userInstruction - The user's natural language instruction
 * @param {object} [params.context] - Optional context (jobDescription, targetRole, writingStyle)
 * @returns {Object} Result of the operation
 */
async function handleUpdateResumeContent({ conversationId, userInstruction, context }) {
  if (!resumeStore[conversationId]) {
    return {
      success: false,
      summary: `No resume found for conversation ${conversationId}`,
      newHtml: ''
    };
  }

  // Integrate LLM logic here
  const currentHtml = resumeStore[conversationId];
  const analysisPrompt = `
Given this resume HTML: ${currentHtml}

The user wants to: "${userInstruction}"

Additional context:
${context ? JSON.stringify(context, null, 2) : 'No additional context provided'}

1. Identify what content they're referring to by:
* Looking for semantic matches (e.g., "skills" section)
* Considering the content type (e.g., lists, paragraphs)
* Using flexible matching to find similar content

2. Extract the current text of that content
3. Generate the revised version
4. Return the exact HTML element to replace and the new content

IMPORTANT: For the elementSelector, you MUST provide a valid CSS selector that uniquely identifies the element to be modified.

IMPORTANT: No hallucinations are allowed. The revision must NOT introduce new content that is not present in the original content.

IMPORTANT: The revision must be identical or as similar as possible in length to the original content.

Return JSON: {
  "targetElement": "exact HTML of element to replace",
  "newContent": "revised content",
  "explanation": "what you identified"
}`;

  // Call Claude LLM service
  const llmResponse = await sendMessageToClaude(
    [{ role: 'user', content: analysisPrompt }],
    'You are an expert resume editor. Analyze the user instruction and resume HTML, and return the JSON as specified.'
  );
  let analysis;
  if (llmResponse.content && llmResponse.content.length > 0 && llmResponse.content[0].type === 'text') {
    // Try to extract JSON from the response
    const responseText = llmResponse.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Claude LLM did not return valid JSON for analysis');
    }
  } else {
    throw new Error('Claude LLM did not return a valid response');
  }

  // Update the HTML based on LLM analysis
  const dom = new JSDOM(currentHtml);
  const document = dom.window.document;

  const findElementByContent = (doc, content) => {
    console.log('[ResumeUpdate] Looking for element with content:', content);

    // First try to understand what type of content we're looking for
    const contentType = content.toLowerCase();
    const isSkills = contentType.includes('skills') || 
                    contentType.includes('capabilities') || 
                    contentType.includes('expertise');

    // If we're looking for skills, try to find the skills section first
    if (isSkills) {
      const skillsSection = doc.querySelector('.skills');
      if (skillsSection) {
        console.log('[ResumeUpdate] Found skills section directly:', skillsSection.outerHTML);
        return skillsSection;
      }
    }

    // Try to extract class name from the content string (e.g., class="summary")
    const classMatch = content.match(/class=["']([^"']+)["']/);
    let className = classMatch ? classMatch[1] : null;
    let textMatch = content.replace(/<[^>]+>/g, '').trim(); // Remove tags for text comparison

    if (className) {
      // Try to find elements by class name
      const elements = doc.getElementsByClassName(className);
      for (let el of elements) {
        const elText = el.textContent.trim();
        console.log(`[ResumeUpdate] Checking .${className}:`, elText);
        // Make the matching more flexible
        if (elText === textMatch || 
            elText.includes(textMatch) || 
            textMatch.includes(elText)) {
          console.log('[ResumeUpdate] Found by class and flexible textContent match:', el.outerHTML);
          return el;
        }
      }
    }

    // Fallback: walker logic with more flexible matching
    const walker = doc.createTreeWalker(
      doc.body,
      dom.window.NodeFilter.SHOW_ELEMENT,
      null
    );
    let node;
    let candidates = [];
    while ((node = walker.nextNode())) {
      const nodeText = node.textContent?.trim() || '';
      // Try exact match first
      if (nodeText === textMatch) {
        console.log('[ResumeUpdate] Found by exact textContent match:', node.outerHTML);
        return node;
      }
      // Then try contains in either direction
      if (nodeText.includes(textMatch) || textMatch.includes(nodeText)) {
        candidates.push(node);
      }
      // Finally try semantic similarity for skills
      if (isSkills && nodeText.includes('skill')) {
        candidates.push(node);
      }
    }
    
    if (candidates.length > 0) {
      console.log('[ResumeUpdate] Found by flexible matching:', candidates[0].outerHTML);
      return candidates[0];
    }
    
    console.warn('[ResumeUpdate] No matching element found for:', content);
    return null;
  };

  const targetElement = findElementByContent(document, analysis.targetElement);
  if (!targetElement) {
    return {
      success: false,
      summary: `Target element not found in resume`,
      newHtml: currentHtml
    };
  }

  // Generate a unique selector for the target element
  const generateSelector = (element) => {
    // Helper function to get a unique identifier for an element
    const getUniqueIdentifier = (el) => {
      // If element has an id, use that
      if (el.id) {
        return `#${el.id}`;
      }
      
      // If element has a class, use that
      if (el.className) {
        const classes = el.className.split(' ').filter(c => c);
        if (classes.length > 0) {
          return `.${classes[0]}`;
        }
      }
      
      // Fallback to tag name
      return el.tagName.toLowerCase();
    };

    // Build selector path from element up to body
    const buildSelectorPath = (el) => {
      const path = [];
      let current = el;
      
      while (current && current !== document.body) {
        // Get unique identifier for current element
        const identifier = getUniqueIdentifier(current);
        
        // If it's a list item or similar element, add position information
        if (current.parentElement) {
          const siblings = Array.from(current.parentElement.children);
          const sameTypeSiblings = siblings.filter(s => s.tagName === current.tagName);
          const sameTypeIndex = sameTypeSiblings.indexOf(current) + 1;
          
          // Add position information to make selector more specific
          if (sameTypeSiblings.length > 1) {
            path.unshift(`${identifier}:nth-of-type(${sameTypeIndex})`);
          } else {
            path.unshift(identifier);
          }
        } else {
          path.unshift(identifier);
        }
        
        current = current.parentElement;
      }
      
      return path.join(' > ');
    };

    // Generate the full selector path
    const selector = buildSelectorPath(element);
    console.log('[ResumeUpdate] Generated selector:', selector);
    return selector;
  };

  // Remove <del>, <s> tags and text-decoration: line-through from the BODY ONLY
  function removeStrikethroughArtifactsFromBody(dom) {
    const document = dom.window.document;
    // Remove <del> and <s> tags but keep their content
    const removeTags = (tag) => {
      const elements = Array.from(document.body.getElementsByTagName(tag));
      elements.forEach(el => {
        const parent = el.parentNode;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      });
    };
    removeTags('del');
    removeTags('s');
    // Remove text-decoration: line-through from inline styles
    const allEls = document.body.querySelectorAll('[style]');
    allEls.forEach(el => {
      if (el.style.textDecoration && el.style.textDecoration.includes('line-through')) {
        el.style.textDecoration = el.style.textDecoration.replace('line-through', '').replace(';;', ';').trim();
        // Remove style attribute if empty
        if (!el.style.textDecoration) {
          el.style.removeProperty('text-decoration');
        }
      }
    });
  }

  // Replace the element's content with the new content
  const sanitizedContent = sanitizeToPlainText(analysis.newContent);
  targetElement.textContent = sanitizedContent;

  // Only remove strikethrough artifacts from the body, not the whole HTML
  removeStrikethroughArtifactsFromBody(dom);
  let newHtml = dom.serialize();
  resumeStore[conversationId] = newHtml;

  // Generate selector for the modified element
  const elementSelector = generateSelector(targetElement);
  console.log('[ResumeUpdate] Generated selector:', elementSelector);

  return {
    success: true,
    summary: analysis.explanation,
    changes: [
      {
        type: 'update',
        location: analysis.explanation,
        content: analysis.newContent,
        elementSelector
      }
    ],
    newHtml
  };
}

function sanitizeToPlainText(input) {
  return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

module.exports = {
  resumeStore,
  handleUpdateResumeContent
};

