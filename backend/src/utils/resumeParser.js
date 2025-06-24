/**
 * @fileoverview Utility for parsing resume HTML into meaningful, actionable text chunks.
 * This parser is designed to be generic and make no assumptions about the HTML structure.
 */

const cheerio = require('cheerio');
const Tokenizer = require('sentence-tokenizer');

/**
 * Checks if a given text is likely a date range.
 * @param {string} text - The text to check.
 * @returns {boolean} True if the text is likely a date range.
 */
const isDateRange = (text) => {
  // Matches patterns like "August 2023 – Present", "2019 - 2021", "09/24 - 09/25"
  const datePattern = /(\d{4}|\w+\s\d{4})\s*[-–—]\s*(\d{4}|\w+\s\d{4}|\w+)/i;
  return datePattern.test(text);
};

/**
 * Extracts all meaningful text chunks from resume HTML. It cleans the HTML of non-content
 * and heading tags, finds all "leaf" nodes within the body, filters out dates, and then
 * intelligently tokenizes the remaining content into sentences or skill lists.
 *
 * @param {string} html - The HTML content of the resume.
 * @returns {string[]} An array of unique, meaningful text chunks.
 * @throws {Error} If the input is not a non-empty string.
 */
const extractTextChunks = (html) => {
  if (typeof html !== 'string' || html.trim() === '') {
    throw new Error('Input must be a non-empty HTML string.');
  }

  const $ = cheerio.load(html);
  const textChunks = new Set();
  const tokenizer = new Tokenizer('Resume');

  // --- CRITICAL FIX: Pre-emptive, Semantic Cleanup ---
  // Remove tags that contain code, metadata, or are explicitly for headings.
  // This is the most robust way to filter titles without making assumptions.
  $('style, script, h1, h2, h3, h4, h5, h6').remove();

  const $body = $('body');

  const leafElements = $body.find('*').filter(function() {
    return $(this).children().length === 0;
  });

  leafElements.each((i, element) => {
    const text = $(element).text().trim();

    if (text && !isDateRange(text)) {
      const segments = text.split(',');
      const isLikelySkillList = text.includes(',') && segments.length > 2 && (text.length / segments.length < 35);

      if (isLikelySkillList) {
        segments.forEach(chunk => {
          const trimmedChunk = chunk.trim();
          if (trimmedChunk) {
            textChunks.add(trimmedChunk);
          }
        });
      } else {
        tokenizer.setEntry(text);
        const sentences = tokenizer.getSentences();
        sentences.forEach(sentence => {
          const trimmedSentence = sentence.trim();
          if (trimmedSentence) {
            textChunks.add(trimmedSentence);
          }
        });
      }
    }
  });

  return Array.from(textChunks);
};
/**
 * Extracts key resume content like bullet points and summary sentences from HTML.
 * This function is designed to be more selective than extractTextChunks.
 *
 * @param {string} html - The HTML content of the resume.
 * @returns {string[]} An array of unique, meaningful text chunks.
 */
const extractKeyResumeContent = (html) => {
  if (typeof html !== 'string' || html.trim() === '') {
    return [];
  }

  const $ = cheerio.load(html);
  const keyChunks = new Set();
  const tokenizer = new Tokenizer('Resume');

  // Remove non-content tags
  $('style, script, h1, h2, h3, h4, h5, h6').remove();

  // 1. Extract bullet points from <li> tags
  $('li').each((i, element) => {
    const text = $(element).text().trim();
    if (text) {
      keyChunks.add(text);
    }
  });

  // 2. Extract summary sentences from <p> tags with filtering
  $('p').each((i, element) => {
    const text = $(element).text().trim();

    // Filtering logic
    const isLikelyNoise =
      isDateRange(text) ||
      /(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(text) || // Email
      /(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/.test(text) || // Phone
      text.length < 15 ||
      text.length > 300 ||
      text.toUpperCase() === text; // ALL CAPS

    if (text && !isLikelyNoise) {
        tokenizer.setEntry(text);
        const sentences = tokenizer.getSentences();
        sentences.forEach(sentence => {
          const trimmedSentence = sentence.trim();
          if (trimmedSentence) {
            keyChunks.add(trimmedSentence);
          }
        });
    }
  });

  return Array.from(keyChunks);
};

module.exports = { extractTextChunks, extractKeyResumeContent };