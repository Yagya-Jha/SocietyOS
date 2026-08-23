import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are downloading from HuggingFace
env.allowLocalModels = false;

// We use a singleton pattern for the pipeline to ensure it's only loaded once.
class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Supabase/gte-small';
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      this.instance = pipeline(this.task as any, this.model, { progress_callback });
    }
    return this.instance;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await PipelineSingleton.getInstance();
    
    // Generate embeddings
    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Extract the float array
    return Array.from(output.data);
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    throw error;
  }
}
