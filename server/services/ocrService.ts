// OCR Service using Tesseract.js to extract text from lab result images
import Tesseract from 'tesseract.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OCRResult {
  text: string;
  confidence: number;
  parsedValues: Record<string, string | number>;
}

export async function extractTextFromImage(imageBuffer: Buffer, labType?: string): Promise<OCRResult> {
  try {
    // Validate image buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Invalid or empty image file');
    }

    // Check file size (max 10MB)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      throw new Error('Image file too large (max 10MB)');
    }

    // Check for minimum file size (corrupted/truncated files)
    if (imageBuffer.length < 100) {
      throw new Error('Image file appears to be corrupted or truncated');
    }

    console.log(`Processing image: ${imageBuffer.length} bytes`);

    // Run OCR with timeout protection (20s for faster processing)
    const { data } = await Promise.race([
      Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('OCR processing timeout (20s)')), 20000)
      )
    ]);

    // Extract text and confidence
    const text = data.text;
    const confidence = data.confidence;

    console.log(`OCR completed: ${text.length} characters, ${confidence}% confidence`);

    // Parse common lab values from text using OpenAI
    const parsedValues = await parseLabValues(text, labType);

    return {
      text,
      confidence,
      parsedValues,
    };
  } catch (error: any) {
    console.error('OCR extraction error:', error);
    
    // Return more specific error messages
    if (error.message?.includes('truncated') || error.message?.includes('corrupted')) {
      throw new Error('Image file is corrupted or incomplete. Please upload a valid image.');
    }
    if (error.message?.includes('timeout')) {
      throw new Error('OCR processing took too long. Please try a smaller or clearer image.');
    }
    if (error.message?.includes('format')) {
      throw new Error('Invalid image format. Please upload a PNG, JPG, or JPEG file.');
    }
    
    throw new Error(`Failed to extract text from image: ${error.message || 'Unknown error'}`);
  }
}

async function parseLabValues(text: string, labType?: string): Promise<Record<string, string | number>> {
  try {
    // Define parameters based on lab type
    let parametersGuide = '';
    
    switch (labType?.toLowerCase()) {
      case 'urinalysis':
        parametersGuide = `
Urinalysis parameters (use these exact keys if found):
- ph (pH level)
- specific_gravity (Specific Gravity)
- protein (Protein level)
- glucose (Glucose in urine)
- ketones (Ketone bodies)
- blood (Blood/Hemoglobin)
- bilirubin (Bilirubin)
- urobilinogen (Urobilinogen)
- nitrites (Nitrites)
- leukocyte_esterase (Leukocyte Esterase)
- wbc_urine (White Blood Cells in urine)
- rbc_urine (Red Blood Cells in urine)
- bacteria (Bacteria presence)
- crystals (Crystals)
- color (Urine color as string)
- clarity (Clarity/Appearance as string)`;
        break;
        
      case 'lipid':
        parametersGuide = `
Lipid panel parameters (use these exact keys if found):
- cholesterol (Total Cholesterol)
- hdl (HDL Cholesterol - "good" cholesterol)
- ldl (LDL Cholesterol - "bad" cholesterol)
- triglycerides (Triglycerides)
- vldl (VLDL Cholesterol)
- chol_hdl_ratio (Cholesterol/HDL Ratio)`;
        break;
        
      case 'glucose':
        parametersGuide = `
Glucose test parameters (use these exact keys if found):
- glucose (Blood Glucose/Sugar)
- a1c (HbA1c - Hemoglobin A1c)
- fasting_glucose (Fasting Blood Glucose)
- random_glucose (Random Blood Glucose)`;
        break;
        
      case 'cbc':
      default:
        parametersGuide = `
CBC (Complete Blood Count) parameters (use these exact keys if found):
- wbc (White Blood Cell count)
- rbc (Red Blood Cell count)
- hemoglobin (Hemoglobin)
- hematocrit (Hematocrit)
- platelets (Platelet count)
- mcv (Mean Corpuscular Volume)
- mch (Mean Corpuscular Hemoglobin)
- mchc (Mean Corpuscular Hemoglobin Concentration)
- neutrophils (Neutrophil count or percentage)
- lymphocytes (Lymphocyte count or percentage)
- monocytes (Monocyte count or percentage)
- eosinophils (Eosinophil count or percentage)
- basophils (Basophil count or percentage)`;
        break;
    }
    
    // Use OpenAI to intelligently extract lab values from any format
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a medical lab report parser. Extract lab values from the provided text and return ONLY a JSON object.

${parametersGuide}

Important rules:
- Return numeric values only (no units) except for color and clarity which should be strings
- If a value is not found, omit that key
- Be flexible with value names - match variations like "WBC", "White Blood Cells", "Leukocytes" to the same key
- Extract actual numerical values, not reference ranges
- If you see ranges like "5.0-10.0", extract the patient's actual value, not the range

Example for CBC: {"wbc": 7.5, "hemoglobin": 12.5, "platelets": 250}
Example for Urinalysis: {"ph": 6.5, "protein": 0, "glucose": 0, "wbc_urine": 2, "color": "yellow", "clarity": "clear"}

Return ONLY the JSON object, no other text.`
        },
        {
          role: 'user',
          content: `Extract lab values from this ${labType || 'lab'} report text:\n\n${text}`
        }
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    console.log('OpenAI lab parsing response:', responseText);
    
    // Parse the JSON response
    const parsedValues = JSON.parse(responseText);
    console.log('Parsed lab values:', parsedValues);
    
    return parsedValues;
  } catch (error) {
    console.error('Error parsing lab values with OpenAI:', error);
    // Fallback to empty object if OpenAI fails
    return {};
  }
}
