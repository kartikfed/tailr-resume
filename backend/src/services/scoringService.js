/**
 * Scoring Service
 * 
 * This service calculates the "Overall Resume-Job Fit Score" based on resume analysis data.
 * The logic follows the plan documented in "Tailr Score Generation.md".
 */

/**
 * Calculates the weighted score for a single category (e.g., required_skills).
 * @param {string[]} items - An array of requirement strings, sorted by importance.
 * @param {Object} coverageScores - An object mapping requirement strings to their similarity scores.
 * @returns {number} The weighted score for the category.
 */
function calculateCategoryScore(items, coverageScores) {
  if (!items || items.length === 0) {
    return 0;
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  items.forEach((item, index) => {
    const score = coverageScores[item] || 0;
    // Descending weight based on position (e.g., 1.0, 0.9, 0.8...)
    const weight = 1.0 - (index * 0.1);
    
    if (weight > 0) {
      totalWeightedScore += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
}

/**
 * Calculates the "Requirement Fit Score".
 * @param {Object} jobRequirements - The job requirements object from Claude.
 * @param {Object} requirementCoverage - The requirement coverage scores.
 * @returns {number} The Requirement Fit Score.
 */
function calculateRequirementFitScore(jobRequirements, requirementCoverage) {
  const { required_skills, key_responsibilities, preferred_qualifications, exact_phrases } = jobRequirements;

  const weights = {
    required_skills: 0.5,
    key_responsibilities: 0.3,
    preferred_qualifications: 0.2,
  };

  const requiredSkillsScore = calculateCategoryScore(required_skills, requirementCoverage);
  const keyResponsibilitiesScore = calculateCategoryScore(key_responsibilities, requirementCoverage);
  const preferredQualificationsScore = calculateCategoryScore(preferred_qualifications, requirementCoverage);

  const baseScore = 
    (requiredSkillsScore * weights.required_skills) +
    (keyResponsibilitiesScore * weights.key_responsibilities) +
    (preferredQualificationsScore * weights.preferred_qualifications);

  // Note: Bonus for exact_phrases is not yet implemented as per the plan.
  // This can be added later.

  return baseScore;
}

/**
 * Calculates the "Resume Focus Score".
 * @param {Object} resumeCoverage - The resume coverage scores.
 * @returns {number} The Resume Focus Score.
 */
function calculateResumeFocusScore(resumeCoverage) {
  const relevanceThreshold = 0.5;
  const bulletPoints = Object.keys(resumeCoverage);

  if (bulletPoints.length === 0) {
    return 0;
  }

  const relevantBullets = bulletPoints.filter(bullet => resumeCoverage[bullet] >= relevanceThreshold);
  
  return relevantBullets.length / bulletPoints.length;
}

/**
 * Calculates the final "Overall Resume-Job Fit Score".
 * @param {Object} jobRequirements - The job requirements object from Claude.
 * @param {Object} requirementCoverage - The requirement coverage scores.
 * @param {Object} resumeCoverage - The resume coverage scores.
 * @returns {number} The final score, as a value between 0 and 1.
 */
export function calculateOverallFitScore(jobRequirements, requirementCoverage, resumeCoverage) {
  const requirementFitScore = calculateRequirementFitScore(jobRequirements, requirementCoverage);
  const resumeFocusScore = calculateResumeFocusScore(resumeCoverage);

  const finalScore = (requirementFitScore * 0.8) + (resumeFocusScore * 0.2);

  // Ensure the score is capped at 1.0
  return Math.min(finalScore, 1.0);
}