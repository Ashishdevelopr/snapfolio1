import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = await readFile(envPath, 'utf-8');
    const envVars = envContent
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'))
      .reduce((acc, line) => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) {
          acc[key.trim()] = value.join('=').trim();
        }
        return acc;
      }, {});
    
    return envVars;
  } catch (error) {
    console.error('Error loading .env file:', error);
    return {};
  }
}

async function testApis() {
  const env = await loadEnv();
  const POLYGON_API_KEY = env.POLYGON_API_KEY;
  const FINNHUB_API_KEY = env.FINNHUB_API_KEY;
  const SYMBOL = 'AAPL';

  console.log('=== API Key Status ===');
  console.log(`Polygon API Key: ${POLYGON_API_KEY ? 'Found' : 'Not Found'}`);
  console.log(`Finnhub API Key: ${FINNHUB_API_KEY ? 'Found' : 'Not Found'}`);

  if (!POLYGON_API_KEY && !FINNHUB_API_KEY) {
    console.error('No API keys found. Please check your .env file.');
    return;
  }

  if (POLYGON_API_KEY) {
    console.log('\n=== Testing Polygon API ===');
    try {
      const tickerUrl = `https://api.polygon.io/v3/reference/tickers/${SYMBOL}?apiKey=${POLYGON_API_KEY}`;
      console.log('Testing ticker endpoint...');
      const tickerResponse = await fetch(tickerUrl);
      console.log(`Status: ${tickerResponse.status} ${tickerResponse.statusText}`);
      if (tickerResponse.ok) {
        const data = await tickerResponse.json();
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Polygon API error:', error.message);
    }
  }

  if (FINNHUB_API_KEY) {
    console.log('\n=== Testing Finnhub API ===');
    try {
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${SYMBOL}&token=${FINNHUB_API_KEY}`;
      console.log('Testing quote endpoint...');
      const quoteResponse = await fetch(quoteUrl);
      console.log(`Status: ${quoteResponse.status} ${quoteResponse.statusText}`);
      if (quoteResponse.ok) {
        const data = await quoteResponse.json();
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Finnhub API error:', error.message);
    }
  }
}

testApis().catch(console.error);
