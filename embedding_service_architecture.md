# Resume Analytics Embedding Service Architecture

This document outlines the architecture for implementing a local embedding service to power resume analytics and semantic similarity matching.

## 1. Create a Centralized Embedding Service

A dedicated service will be created to handle the generation of embeddings, ensuring the model is loaded only once and can be reused across the application.

*   **File:** `backend/src/services/embeddingService.js`
*   **Functionality:**
    *   This service will use the `@xenova/transformers` library to load the `sentence-transformers/all-MiniLM-L6-v2` model.
    *   It will be implemented as a singleton to ensure the model is loaded only once when the server starts, which is crucial for performance.
    *   It will expose a primary function, `generateEmbeddings(texts: string[]): Promise<number[][]>`, which will take an array of text strings and return a corresponding array of vector embeddings.

## 2. Implement a Comprehensive Resume Parsing Utility

A utility will be created to parse the resume HTML and extract all relevant text content for analysis.

*   **File:** `backend/src/utils/resumeParser.js`
*   **Functionality:**
    *   This utility will use the `cheerio` library to parse the resume HTML.
    *   It will contain a function, `extractTextChunks(html: string): string[]`, designed to extract all meaningful text content.
    *   The function will specifically target and extract text from:
        1.  **Summary:** The content of the `<p>` tag within the `<div class="summary">`.
        2.  **Experience:** The text from each `<li>` element under the "EXPERIENCE" section.
        3.  **Skills:** The text from the `<p>` tag following the "SKILLS" `<h2>` heading. The comma-separated string will be split into an array of individual skills.
    *   The function will return a single, flat array of all these text chunks.

## 3. Develop a New API Endpoint for Similarity Analysis

A new API endpoint will be created to orchestrate the analysis, bringing together the job requirements and the resume content.

*   **File:** The existing router file, `backend/src/api/routes/specRoutes.js`, will be modified.
*   **Endpoint:** A new `POST` endpoint will be added at `/api/spec/analyze-similarity`.
*   **Request Body:** The endpoint will expect a JSON object with two properties:
    *   `jobRequirements`: The JSON object produced by the existing `/analyze-job-description` endpoint.
    *   `resumeHtml`: The full HTML content of the resume.
*   **Workflow:**
    1.  Extract individual skills and responsibilities from the `jobRequirements` object.
    2.  Use the `resumeParser.js` utility to extract all text chunks from the `resumeHtml`.
    3.  Call the `embeddingService.js` to generate embeddings for both the job requirements and the resume text chunks.
    4.  Implement a cosine similarity function to compare the embeddings.
    5.  Return a JSON response that maps each resume text chunk to the most similar job requirements, along with their similarity scores.

## Architecture Diagram

```mermaid
graph TD
    subgraph Frontend
        A[Application Details Page] -- "Run Analytics" button click --> B{API Request};
    end

    B -- "POST /api/spec/analyze-similarity\n(jobRequirements, resumeHtml)" --> C[specRoutes.js];

    subgraph Backend
        C -- Hands off to --> D[Analytics Controller Logic];
        D -- resumeHtml --> E[resumeParser.js];
        E -- "Uses cheerio to extract text from\n<p>, <li>, and other key tags" --> F[Array of ALL text chunks];
        F --> D;

        D -- jobRequirements --> G[Extracts skills/responsibilities];
        G -- "Array of requirement strings" --> D;

        D -- "text chunks & requirements" --> H[embeddingService.js];
        H -- "Uses @xenova/transformers to load\nsentence-transformers/all-MiniLM-L6-v2" --> I[Generates Embeddings];
        I -- "Returns two arrays of vectors" --> D;

        D -- "Embeddings" --> J[Cosine Similarity Calculation];
        J -- "Calculates similarity scores" --> K[Similarity Matrix];
        K -- "Maps resume chunks to top job requirements" --> L[Formatted JSON Response];
        L --> C;
    end

    C -- "Returns JSON to frontend" --> B;
    B -- "Displays analytics results" --> A;