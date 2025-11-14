// OpenAI Service for AI Chat Assistant
// Based on javascript_openai blueprint
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatResponse {
  message: string;
  model: string;
}

export async function getChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ChatResponse> {
  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: `You are a knowledgeable and empathetic health assistant for MEDiscan, a health analysis platform. 
Your role is to help users understand their lab results, answer general health questions, and provide educational information about medical terms and conditions.

Important guidelines:
- Always emphasize that you provide informational content only, not medical advice
- Encourage users to consult healthcare professionals for diagnosis and treatment
- Be clear, concise, and use simple language
- When discussing lab values, explain what they measure and general healthy ranges
- Provide context and education, not just facts
- Be supportive and reassuring while maintaining medical accuracy
- If asked about specific treatments or medications, redirect to healthcare providers

Remember: You are an educational assistant, not a replacement for professional medical advice.`,
      },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_completion_tokens: 500,
    });

    return {
      message: response.choices[0].message.content || 'I apologize, but I was unable to generate a response. Please try again.',
      model: response.model,
    };
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to get AI response: ' + error.message);
  }
}
