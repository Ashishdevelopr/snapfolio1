import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Available Groq models (in order of preference)
const GROQ_MODELS = [
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant", 
  "mixtral-8x7b-32768", // Keep as backup in case it gets reactivated
  "llama3-70b-8192",
  "llama3-8b-8192"
];

export interface CompanyMatch {
  name: string;
  symbol?: string;
  sector?: string;
  reasoning?: string;
}

export interface AIResponse {
  indexName: string;
  description: string;
  companies: CompanyMatch[];
  analysis?: {
    investmentThesis: string;
    riskProfile: string;
    sectorBreakdown: string;
    keyStrengths: string[];
    potentialRisks: string[];
    expectedPerformance: string;
  };
}

export async function generateIndexFromPrompt(prompt: string): Promise<AIResponse> {
  console.log(`🔍 Processing prompt: "${prompt}"`);

  const parseAIResponse = (text: string, source: string): AIResponse => {
    try {
      console.log(`🔄 Parsing response from ${source}`);
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON object found in response');
      }
      
      const jsonStr = text.slice(jsonStart, jsonEnd);
      const data = JSON.parse(jsonStr);
      
      if (!data.indexName || !data.description || !Array.isArray(data.companies)) {
        throw new Error('Invalid response structure');
      }
      
      console.log(`✅ Successfully parsed response from ${source}`);
      return data as AIResponse;
    } catch (err) {
      console.error(`❌ Failed to parse ${source} response:`, err);
      throw new Error(`Invalid response format from ${source}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // 1️⃣ Try OpenAI
  if (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) {
    console.log('🔄 Attempting to use OpenAI...');
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a financial index generator and investment analyst. Return a JSON object with:
            - indexName: string (creative name for the index)
            - description: string (1-2 sentences)
            - companies: Array<{name: string, symbol: string, sector: string, reasoning: string}> (6-10 companies)
            - analysis: {
              investmentThesis: string (2-3 sentences explaining the investment rationale),
              riskProfile: string (low/medium/high risk assessment),
              sectorBreakdown: string (brief overview of sector distribution),
              keyStrengths: Array<string> (3-4 key advantages of this portfolio),
              potentialRisks: Array<string> (2-3 potential risks to consider),
              expectedPerformance: string (brief outlook on expected performance)
            }`
          },
          {
            role: "user",
            content: `Create a stock market index for: ${prompt}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const text = completion.choices[0]?.message?.content;
      if (text) {
        return parseAIResponse(text, 'OpenAI');
      }
      console.warn('⚠️ Empty response from OpenAI, trying next service...');
    } catch (errOpenAI) {
      if (errOpenAI instanceof Error) {
        console.warn('⚠️ OpenAI API error:', errOpenAI.message);
        // Check if it's a quota/billing issue
        if (errOpenAI.message.includes('429') || errOpenAI.message.includes('quota')) {
          console.warn('💰 OpenAI quota exceeded - consider upgrading your plan or adding billing');
        }
      } else {
        console.warn('⚠️ OpenAI API error: Unknown error');
      }
    }
  } else {
    console.log('ℹ️ OpenAI API key not found, skipping to next service...');
  }

  // 2️⃣ Try GROQ fallback with multiple models
  if (GROQ_API_KEY) {
    console.log('🔄 Attempting to use Groq...');
    
    for (const model of GROQ_MODELS) {
      try {
        console.log(`🔄 Trying Groq model: ${model}`);
        
        const groqResp = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: model,
            messages: [
              {
                role: "system",
                content: `You are a financial index generator and investment analyst. Return a JSON object with:
                - indexName: string (creative name for the index)
                - description: string (1-2 sentences)
                - companies: Array<{name: string, symbol: string, sector: string, reasoning: string}> (6-10 companies)
                - analysis: {
                  investmentThesis: string (2-3 sentences explaining the investment rationale),
                  riskProfile: string (low/medium/high risk assessment),
                  sectorBreakdown: string (brief overview of sector distribution),
                  keyStrengths: Array<string> (3-4 key advantages of this portfolio),
                  potentialRisks: Array<string> (2-3 potential risks to consider),
                  expectedPerformance: string (brief outlook on expected performance)
                }`
              },
              {
                role: "user",
                content: `Create a stock market index for: ${prompt}`
              }
            ],
            temperature: 0.7,
            // Only add response_format for models that support it
            ...(model.includes('llama-3.1') ? { response_format: { type: "json_object" } } : {})
          },
          {
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json"
            },
            timeout: 15000
          }
        );

        const groqText = groqResp.data.choices[0]?.message?.content;
        if (groqText) {
          console.log(`✅ Successfully got response from Groq model: ${model}`);
          return parseAIResponse(groqText, `Groq (${model})`);
        }
        console.warn(`⚠️ Empty response from Groq model ${model}, trying next model...`);
        
      } catch (errGroq) {
        if (axios.isAxiosError(errGroq)) {
          const status = errGroq.response?.status;
          const errorData = errGroq.response?.data;
          const errorMessage = errorData?.error?.message || errGroq.message;
          
          console.warn(`⚠️ Groq model ${model} failed (${status}): ${errorMessage}`);
          
          // If model is decommissioned or not found, try next model
          if (status === 400 && (errorMessage.includes('decommissioned') || errorMessage.includes('not found'))) {
            console.log(`⏭️ Model ${model} is no longer available, trying next model...`);
            continue;
          }
          
          // If it's a rate limit, wait briefly and try next model
          if (status === 429) {
            console.log(`⏳ Rate limited on model ${model}, trying next model...`);
            continue;
          }
          
          // For other errors, also try next model
          continue;
          
        } else {
          console.warn(`⚠️ Groq model ${model} error:`, errGroq instanceof Error ? errGroq.message : 'Unknown error');
          continue;
        }
      }
    }
    
    console.warn('⚠️ All Groq models failed, falling back to local data...');
  } else {
    console.log('ℹ️ GROQ API key not found, falling back to local data...');
  }

  // 3️⃣ Fallback to local data
  console.log('🔄 Using local fallback data...');
  return generateFallbackResponse(prompt);
}

function generateFallbackResponse(prompt: string): AIResponse {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for robotics & automation theme
  if (lowerPrompt.includes('robotics') || lowerPrompt.includes('automation') || lowerPrompt.includes('robots') || lowerPrompt.includes('automated')) {
    return {
      indexName: "Robotics & Automation Leaders Index",
      description: "Companies at the forefront of robotics, automation, and industrial innovation, transforming manufacturing, logistics, and service industries.",
      companies: [
        { name: "Intuitive Surgical", symbol: "ISRG", sector: "Healthcare", reasoning: "Leader in robotic-assisted surgical systems" },
        { name: "Zebra Technologies", symbol: "ZBRA", sector: "Technology", reasoning: "Enterprise asset intelligence and automation solutions" },
        { name: "Rockwell Automation", symbol: "ROK", sector: "Industrials", reasoning: "Industrial automation and digital transformation" },
        { name: "Teradyne", symbol: "TER", sector: "Technology", reasoning: "Automated test equipment and collaborative robots" },
        { name: "Cognex Corporation", symbol: "CGNX", sector: "Technology", reasoning: "Machine vision systems for factory automation" },
        { name: "Fanuc Corporation", symbol: "FANUY", sector: "Industrials", reasoning: "Industrial robots and factory automation" },
        { name: "ABB Ltd", symbol: "ABB", sector: "Industrials", reasoning: "Robotics, power, and automation technology" },
        { name: "NVIDIA Corporation", symbol: "NVDA", sector: "Technology", reasoning: "AI and computer vision for robotics" }
      ],
      analysis: {
        investmentThesis: "This index focuses on companies leading the automation revolution across industries. The investment thesis centers on the long-term trend of increasing automation adoption, driven by labor shortages, efficiency demands, and technological advancement.",
        riskProfile: "Medium-High",
        sectorBreakdown: "Technology (37.5%), Industrials (37.5%), Healthcare (12.5%), Other (12.5%)",
        keyStrengths: [
          "Strong secular growth trends in automation adoption",
          "Diversified exposure across multiple industries",
          "High barriers to entry and strong competitive moats",
          "Recurring revenue models with high customer retention"
        ],
        potentialRisks: [
          "Economic downturns may reduce capital expenditure on automation",
          "Rapid technological change could disrupt existing solutions",
          "Regulatory changes in healthcare robotics"
        ],
        expectedPerformance: "Expected to outperform the broader market over the next 3-5 years due to strong secular growth trends in automation adoption across industries."
      }
    };
  }

  // Check for sustainable energy theme
  if (lowerPrompt.includes('sustainable') || lowerPrompt.includes('energy') || lowerPrompt.includes('clean') || lowerPrompt.includes('renewable')) {
    return {
      indexName: "Clean Energy Innovation Index",
      description: "Leading companies driving the transition to sustainable and renewable energy sources, including solar, wind, battery technology, and electric vehicles.",
      companies: [
        { name: "Tesla Inc.", symbol: "TSLA", sector: "Automotive", reasoning: "Electric vehicle leader and energy storage pioneer" },
        { name: "NextEra Energy", symbol: "NEE", sector: "Utilities", reasoning: "Largest renewable energy generator in North America" },
        { name: "First Solar Inc.", symbol: "FSLR", sector: "Energy", reasoning: "Leading solar panel manufacturer and project developer" },
        { name: "Enphase Energy", symbol: "ENPH", sector: "Energy", reasoning: "Solar microinverter technology and energy management" },
        { name: "Plug Power Inc.", symbol: "PLUG", sector: "Energy", reasoning: "Hydrogen fuel cell solutions for clean energy" },
        { name: "Brookfield Renewable", symbol: "BEP", sector: "Utilities", reasoning: "Pure-play renewable power platform" },
        { name: "Vestas Wind Systems", symbol: "VWS.CO", sector: "Energy", reasoning: "Global wind turbine manufacturer" },
        { name: "Albemarle Corporation", symbol: "ALB", sector: "Materials", reasoning: "Lithium producer for battery technology" }
      ],
      analysis: {
        investmentThesis: "This index captures the global transition to clean energy, driven by climate change concerns, government policies, and declining renewable energy costs. The portfolio focuses on companies positioned to benefit from the multi-decade energy transition.",
        riskProfile: "Medium",
        sectorBreakdown: "Energy (50%), Utilities (25%), Automotive (12.5%), Materials (12.5%)",
        keyStrengths: [
          "Strong policy support and regulatory tailwinds",
          "Declining costs making renewables increasingly competitive",
          "Global scale with diversified geographic exposure",
          "Long-term secular growth story"
        ],
        potentialRisks: [
          "Policy changes could impact government support",
          "Commodity price volatility affecting manufacturing costs",
          "Competition from traditional energy sources during economic downturns"
        ],
        expectedPerformance: "Expected to deliver strong returns over the next decade as renewable energy adoption accelerates globally, though may experience volatility due to policy and commodity price fluctuations."
      }
    };
  }
  
  // Check for young CEOs theme
  if ((lowerPrompt.includes('ceo') && lowerPrompt.includes('40')) || (lowerPrompt.includes('young') && lowerPrompt.includes('ceo'))) {
    return {
      indexName: "Young CEO Innovation Index",
      description: "Companies led by visionary CEOs under 40 who are disrupting traditional industries and driving technological innovation.",
      companies: [
        { name: "Meta Platforms Inc.", symbol: "META", sector: "Technology", reasoning: "Mark Zuckerberg - Founded Facebook at 19, now leading metaverse innovation" },
        { name: "Snapchat Inc.", symbol: "SNAP", sector: "Technology", reasoning: "Evan Spiegel - Young CEO pioneering AR and social media innovation" },
        { name: "Airbnb Inc.", symbol: "ABNB", sector: "Consumer Services", reasoning: "Brian Chesky - Revolutionizing travel and hospitality" },
        { name: "DoorDash Inc.", symbol: "DASH", sector: "Consumer Services", reasoning: "Tony Xu - Leading food delivery transformation" },
        { name: "Zoom Video", symbol: "ZM", sector: "Technology", reasoning: "Eric Yuan - Transformed remote communication" },
        { name: "Shopify Inc.", symbol: "SHOP", sector: "Technology", reasoning: "Tobias Lütke - E-commerce platform innovation" },
        { name: "Block Inc.", symbol: "SQ", sector: "Financial Services", reasoning: "Jack Dorsey - Fintech and payment innovation" },
        { name: "Palantir Technologies", symbol: "PLTR", sector: "Technology", reasoning: "Alex Karp - Big data analytics and AI innovation" }
      ],
      analysis: {
        investmentThesis: "This index focuses on companies led by young, innovative CEOs who have demonstrated the ability to disrupt traditional industries and create new markets. The thesis centers on the advantage of having leaders who grew up in the digital age and understand modern consumer behavior.",
        riskProfile: "High",
        sectorBreakdown: "Technology (62.5%), Consumer Services (25%), Financial Services (12.5%)",
        keyStrengths: [
          "Innovative leadership with fresh perspectives",
          "Strong digital-first business models",
          "High growth potential in emerging markets",
          "Agile decision-making and rapid innovation cycles"
        ],
        potentialRisks: [
          "Inexperience in managing large-scale operations",
          "High valuation multiples and growth expectations",
          "Regulatory scrutiny of tech platforms",
          "Competition from established players"
        ],
        expectedPerformance: "High growth potential with significant volatility. Expected to outperform during innovation cycles but may underperform during market corrections due to high valuations."
      }
    };
  }
  
  // Check for AI theme
  if (lowerPrompt.includes('ai') || lowerPrompt.includes('artificial intelligence')) {
    return {
      indexName: "AI Revolution Index",
      description: "Companies at the forefront of artificial intelligence and machine learning innovation, transforming industries through advanced AI technologies.",
      companies: [
        { name: "NVIDIA Corporation", symbol: "NVDA", sector: "Technology", reasoning: "Leading AI chip manufacturer powering machine learning infrastructure" },
        { name: "Microsoft Corporation", symbol: "MSFT", sector: "Technology", reasoning: "Major AI investments through OpenAI partnership and Azure AI services" },
        { name: "Alphabet Inc.", symbol: "GOOGL", sector: "Technology", reasoning: "Google's AI research and DeepMind leading breakthrough AI models" },
        { name: "Amazon.com Inc.", symbol: "AMZN", sector: "Technology", reasoning: "AWS AI services and Alexa voice AI platform" },
        { name: "Meta Platforms Inc.", symbol: "META", sector: "Technology", reasoning: "Significant AI research in computer vision and natural language processing" },
        { name: "Tesla Inc.", symbol: "TSLA", sector: "Automotive", reasoning: "Autonomous driving AI and robotics development" },
        { name: "Palantir Technologies", symbol: "PLTR", sector: "Technology", reasoning: "Big data analytics and AI-powered decision making platforms" },
        { name: "Advanced Micro Devices", symbol: "AMD", sector: "Technology", reasoning: "High-performance computing chips for AI workloads" }
      ],
      analysis: {
        investmentThesis: "This index captures the AI revolution that is transforming every industry. The investment thesis centers on the massive productivity gains and new capabilities that AI will unlock, creating unprecedented value for companies that successfully integrate AI into their products and services.",
        riskProfile: "Medium-High",
        sectorBreakdown: "Technology (87.5%), Automotive (12.5%)",
        keyStrengths: [
          "Massive addressable market across all industries",
          "Strong competitive moats through data and compute advantages",
          "Recurring revenue models with high switching costs",
          "Continuous innovation and R&D investment"
        ],
        potentialRisks: [
          "Rapid technological change could disrupt current leaders",
          "Regulatory concerns about AI safety and privacy",
          "High capital requirements for AI infrastructure",
          "Concentration risk in technology sector"
        ],
        expectedPerformance: "Expected to be one of the highest-performing sectors over the next decade as AI becomes ubiquitous, though may experience periods of volatility due to regulatory and competitive dynamics."
      }
    };
  }
  
  // Check for healthcare theme
  if (lowerPrompt.includes('healthcare') || lowerPrompt.includes('health') || lowerPrompt.includes('medical')) {
    return {
      indexName: "Digital Health Innovation Index",
      description: "Leading healthcare technology companies revolutionizing patient care through digital innovation, telemedicine, and medical AI.",
      companies: [
        { name: "UnitedHealth Group", symbol: "UNH", sector: "Healthcare", reasoning: "Largest healthcare company with digital health initiatives" },
        { name: "Johnson & Johnson", symbol: "JNJ", sector: "Healthcare", reasoning: "Pharmaceutical giant investing in digital therapeutics" },
        { name: "Pfizer Inc.", symbol: "PFE", sector: "Healthcare", reasoning: "Leading pharmaceutical company with digital health programs" },
        { name: "Merck & Co.", symbol: "MRK", sector: "Healthcare", reasoning: "Major pharmaceutical with AI drug discovery initiatives" },
        { name: "Abbott Laboratories", symbol: "ABT", sector: "Healthcare", reasoning: "Medical devices and digital health monitoring solutions" },
        { name: "Dexcom Inc.", symbol: "DXCM", sector: "Healthcare", reasoning: "Continuous glucose monitoring and digital diabetes management" },
        { name: "Teladoc Health", symbol: "TDOC", sector: "Healthcare", reasoning: "Leading telemedicine and virtual care platform" },
        { name: "Veeva Systems", symbol: "VEEV", sector: "Healthcare", reasoning: "Cloud software for pharmaceutical and biotech industries" }
      ],
      analysis: {
        investmentThesis: "This index focuses on healthcare companies leveraging technology to improve patient outcomes and reduce costs. The investment thesis centers on the convergence of healthcare and technology, driven by aging populations, rising healthcare costs, and the need for more efficient care delivery.",
        riskProfile: "Medium",
        sectorBreakdown: "Healthcare (100%)",
        keyStrengths: [
          "Defensive sector with stable demand regardless of economic conditions",
          "High barriers to entry due to regulatory requirements",
          "Strong intellectual property protection",
          "Long-term demographic tailwinds"
        ],
        potentialRisks: [
          "Regulatory changes could impact drug pricing and approval processes",
          "Patent expirations leading to generic competition",
          "High R&D costs with uncertain outcomes",
          "Political pressure on healthcare costs"
        ],
        expectedPerformance: "Expected to provide stable, long-term growth with lower volatility than technology sectors, benefiting from demographic trends and technological innovation in healthcare delivery."
      }
    };
  }
  
  // Default fallback for any other theme
  return {
    indexName: "Innovation Leaders Index",
    description: `Companies driving innovation and growth in themes related to "${prompt}", representing the future of industry transformation.`,
    companies: [
      { name: "Apple Inc.", symbol: "AAPL", sector: "Technology", reasoning: "Innovation leader in consumer technology and services" },
      { name: "Microsoft Corporation", symbol: "MSFT", sector: "Technology", reasoning: "Cloud computing and enterprise software innovation" },
      { name: "Alphabet Inc.", symbol: "GOOGL", sector: "Technology", reasoning: "Search, cloud, and emerging technology leadership" },
      { name: "Amazon.com Inc.", symbol: "AMZN", sector: "Technology", reasoning: "E-commerce and cloud infrastructure pioneer" },
      { name: "Tesla Inc.", symbol: "TSLA", sector: "Automotive", reasoning: "Electric vehicle and clean energy innovation" },
      { name: "NVIDIA Corporation", symbol: "NVDA", sector: "Technology", reasoning: "Advanced computing and AI chip technology" },
      { name: "Meta Platforms Inc.", symbol: "META", sector: "Technology", reasoning: "Social media and metaverse technology development" },
      { name: "Netflix Inc.", symbol: "NFLX", sector: "Communication", reasoning: "Streaming technology and content innovation" }
    ],
    analysis: {
      investmentThesis: "This index captures companies at the forefront of innovation across multiple sectors. The investment thesis centers on the long-term value creation potential of companies that consistently innovate and adapt to changing market conditions.",
      riskProfile: "Medium-High",
      sectorBreakdown: "Technology (75%), Automotive (12.5%), Communication (12.5%)",
      keyStrengths: [
        "Diversified exposure to multiple innovation themes",
        "Strong competitive positions and market leadership",
        "High cash flow generation and financial strength",
        "Global scale and market reach"
      ],
      potentialRisks: [
        "High valuations relative to earnings",
        "Rapid technological change could disrupt current leaders",
        "Regulatory scrutiny of large tech companies",
        "Economic sensitivity of discretionary spending"
      ],
      expectedPerformance: "Expected to outperform the broader market over the long term due to innovation leadership, though may experience periods of volatility during market corrections."
    }
  };
}