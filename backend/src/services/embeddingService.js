/**
 * @fileoverview Service for generating sentence embeddings using a pre-trained model.
 * This service implements a singleton pattern to ensure that the model is loaded only once.
 */

// Do not use a top-level require for an ES module.
// We will use a dynamic import() instead.

/**
 * A singleton class to manage the embedding pipeline.
 * This ensures that the model is loaded only once, improving performance.
 */
class EmbeddingPipeline {
  static task = 'feature-extraction';
  static model = 'sentence-transformers/all-MiniLM-L6-v2';
  static instance = null;

  /**
   * Returns a singleton instance of the embedding pipeline.
   * @returns {Promise<Function>} A promise that resolves to the embedding pipeline function.
   */
  static async getInstance() {
    if (this.instance === null) {
      // Dynamically import the pipeline function from the ES Module.
      const { pipeline } = await import('@xenova/transformers');
      this.instance = pipeline(this.task, this.model, { quantized: false });
    }
    return this.instance;
  }
}

/**
 * Generates embeddings for a given array of text strings.
 *
 * @param {string[]} texts - An array of strings to be embedded.
 * @returns {Promise<number[][]>} A promise that resolves to an array of embeddings.
 * @throws {Error} If the input is not a non-empty array of strings.
 */
const generateEmbeddings = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0 || !texts.every(t => typeof t === 'string')) {
    throw new Error('Input must be a non-empty array of strings.');
  }

  const extractor = await EmbeddingPipeline.getInstance();
  const embeddings = await extractor(texts, {
    pooling: 'mean',
    normalize: true,
  });

  return embeddings.tolist();
};

module.exports = { generateEmbeddings };