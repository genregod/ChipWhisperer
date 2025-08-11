import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ChipIdentificationRequest {
  manufacturerId?: string;
  deviceId?: string;
  description?: string;
  context?: string;
}

export interface ChipIdentificationResult {
  manufacturer: string;
  partNumber: string;
  capacity: string;
  interface: string;
  packageType: string;
  voltage: string;
  features: string[];
  confidence: number;
  datasheet?: string;
  pinout?: Record<string, string>;
  programmingNotes?: string;
}

export async function identifyChip(request: ChipIdentificationRequest): Promise<ChipIdentificationResult> {
  try {
    const prompt = buildIdentificationPrompt(request);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in semiconductor identification and hardware debugging. Analyze the provided chip information and return detailed specifications in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      manufacturer: result.manufacturer || "Unknown",
      partNumber: result.partNumber || "Unknown",
      capacity: result.capacity || "Unknown",
      interface: result.interface || "Unknown",
      packageType: result.packageType || "Unknown",
      voltage: result.voltage || "Unknown",
      features: result.features || [],
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      datasheet: result.datasheet,
      pinout: result.pinout,
      programmingNotes: result.programmingNotes,
    };
  } catch (error) {
    throw new Error("Failed to identify chip: " + (error as Error).message);
  }
}

export async function generateChipAnalysis(query: string, chipContext?: any): Promise<string> {
  try {
    let prompt = `As a hardware debugging expert, please provide detailed analysis for this query: "${query}"`;
    
    if (chipContext) {
      prompt += `\n\nChip context: ${JSON.stringify(chipContext)}`;
    }
    
    prompt += "\n\nProvide practical, actionable advice for hardware debugging and firmware management.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert hardware engineer specializing in firmware debugging, SPI/UART communication, and embedded systems. Provide detailed, practical advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Unable to generate analysis.";
  } catch (error) {
    throw new Error("Failed to generate analysis: " + (error as Error).message);
  }
}

function buildIdentificationPrompt(request: ChipIdentificationRequest): string {
  let prompt = "Please identify this semiconductor chip and provide detailed specifications in JSON format with these fields: manufacturer, partNumber, capacity, interface, packageType, voltage, features (array), confidence (0-1), datasheet (URL if known), pinout (object with pin descriptions), programmingNotes.\n\n";
  
  if (request.manufacturerId) {
    prompt += `Manufacturer ID: 0x${request.manufacturerId}\n`;
  }
  
  if (request.deviceId) {
    prompt += `Device ID: 0x${request.deviceId}\n`;
  }
  
  if (request.description) {
    prompt += `Description: ${request.description}\n`;
  }
  
  if (request.context) {
    prompt += `Additional context: ${request.context}\n`;
  }
  
  return prompt;
}

export async function generateProgrammingGuide(chipInfo: any, operation: string): Promise<string> {
  try {
    const prompt = `Generate a detailed programming guide for ${operation} operation on this chip:
    
Chip: ${chipInfo.manufacturer} ${chipInfo.partNumber}
Interface: ${chipInfo.interface}
Package: ${chipInfo.packageType}

Please provide:
1. Required connections and wiring
2. Programming steps
3. Common issues and solutions
4. Safety considerations
5. Verification procedures`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in chip programming and hardware debugging. Provide detailed, step-by-step guides."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1200,
    });

    return response.choices[0].message.content || "Unable to generate programming guide.";
  } catch (error) {
    throw new Error("Failed to generate programming guide: " + (error as Error).message);
  }
}
