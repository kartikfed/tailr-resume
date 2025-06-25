# Tailr Score Generation

The **Overall Resume-Job Fit Score** is a comprehensive metric designed to evaluate a resume against a job description. It is calculated by combining two key sub-scores: the **Requirement Fit Score** and the **Resume Focus Score**.

## Overall Scoring Architecture

```mermaid
graph TD
    subgraph "Input Data"
        A[Job Requirements (Sorted by Importance)]
        B[Requirement Coverage Scores]
        C[Resume Coverage Scores]
    end

    subgraph "Part 1: Requirement Fit Score (How well you match the job)"
        D[Calculate Weighted Score for Required Skills]
        E[Calculate Weighted Score for Preferred Qualifications]
        F[Calculate Weighted Score for Key Responsibilities]
        G[Combine Categories with weights (50%, 30%, 20%)]
        H[Add Bonus for Exact Phrases]
        I((Requirement Fit Score))
    end

    subgraph "Part 2: Resume Focus Score (How relevant your resume is)"
        J[Analyze Resume Coverage Scores] --> K{Calculate Percentage of Relevant Bullets};
        K --> L((Resume Focus Score));
    end

    subgraph "Part 3: Final Combined Score"
        M{Combine Scores (80/20 split)}
        I --> M
        L --> M
        M --> N((**Overall Resume-Job Fit Score**))
    end

    A --> D & E & F
    B --> D & E & F
    C --> J
    D & E & F --> G
    G --> H
    H --> I
```

---

## Part 1: Calculating the "Requirement Fit Score"

This score measures how well the resume addresses the job's specific requirements.

*   **Step 1: Intra-Category Weighting.** We take the lists of `required_skills`, `preferred_qualifications`, and `key_responsibilities`, which are already sorted by importance. We assign a descending weight to each item. For a list of 5 items, the weights would be `1.0, 0.9, 0.8, 0.7, 0.6`. This ensures that matching the top-ranked requirement in a list has more impact than matching the last one.

*   **Step 2: Calculate Weighted Category Scores.** For each of the three categories, we calculate a weighted average of the resume's similarity scores for those items. This gives us a specific score for `required_skills`, `preferred_qualifications`, and `key_responsibilities`.

*   **Step 3: Combine Category Scores.** We combine these three scores into a single number using high-level weights that reflect their importance:
    *   Required Skills: **50%**
    *   Key Responsibilities: **30%**
    *   Preferred Qualifications: **20%**

*   **Step 4: Add Bonus.** We add a small bonus for any `exact_phrases` from the job description that are found verbatim in the resume.

The result of these steps is the **Requirement Fit Score**.

## Part 2: Calculating the "Resume Focus Score"

This score measures how much of the resume is relevant to this specific job, penalizing for irrelevant information.

*   **Step 1: Identify Relevant Content.** We look at the `resumeCoverage` scores. We'll set a "relevance threshold" (e.g., a similarity score of 0.5). Any bullet point in the resume that scores above this threshold is considered "relevant".

*   **Step 2: Calculate Focus Score.** The score is simply the percentage of the resume's bullet points that are deemed relevant. If 8 out of 10 bullets are relevant, the Focus Score is 80%.

## Part 3: Calculating the Final "Overall Fit Score"

Finally, we combine the two scores into one. We give more weight to how well the requirements are met, but we also reward a focused resume.

*   **Final Calculation:**
    `Overall Score = (Requirement Fit Score * 0.8) + (Resume Focus Score * 0.2)`

This gives us a final, comprehensive **Overall Resume-Job Fit Score** as a percentage. This model is designed to be iterative, and the weights and thresholds can be adjusted based on feedback and further analysis.