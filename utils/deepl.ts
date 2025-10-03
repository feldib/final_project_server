import * as deepl from "deepl-node";

class DeepLService {
  private translator: deepl.Translator | null = null;

  constructor() {
    const apiKey = process.env.DEEPL_API_KEY;

    if (!apiKey) {
      console.log("DeepL API key not provided - translation service disabled");
      return;
    }

    this.translator = new deepl.Translator(apiKey);
    console.log("DeepL translation service initialized");
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!this.translator) {
      throw new Error("DeepL translation service is not available");
    }

    try {
      const result = await this.translator.translateText(
        text,
        null, // Auto-detect source language
        targetLanguage as deepl.TargetLanguageCode
      );

      return result.text;
    } catch (error) {
      console.error("DeepL translation error:", error);
      throw new Error("Translation failed");
    }
  }

  async getSupportedLanguages(): Promise<{
    source: readonly deepl.Language[];
    target: readonly deepl.Language[];
  }> {
    if (!this.translator) {
      throw new Error("DeepL translation service is not available");
    }

    try {
      const [sourceLanguages, targetLanguages] = await Promise.all([
        this.translator.getSourceLanguages(),
        this.translator.getTargetLanguages(),
      ]);

      return {
        source: sourceLanguages,
        target: targetLanguages,
      };
    } catch (error) {
      console.error("Error fetching supported languages:", error);
      throw new Error("Failed to fetch supported languages");
    }
  }

  async getUsage(): Promise<deepl.Usage> {
    if (!this.translator) {
      throw new Error("DeepL translation service is not available");
    }

    try {
      return await this.translator.getUsage();
    } catch (error) {
      console.error("Error fetching usage:", error);
      throw new Error("Failed to fetch usage statistics");
    }
  }
}

// Create a singleton instance
const deepLService = new DeepLService();

export default deepLService;
