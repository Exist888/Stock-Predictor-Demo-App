import OpenAI from 'openai';

// 1st line allows any origin - modify to specific url when about to publish
// 2nd line specifies types of methods allowed
// 3rd line specifies types of headers allowed
// See index.js file in root for how this overlaps with our fetch request there 
const corsHeaders = {
	'Access-Control-Allow-Origin': 'https://stock-predictor-demo-app.pages.dev',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Content-Type': 'application/json'
}

export default {
	// request obj refers to the source of our request - coming from index.js - see messages in chatCompletion
	async fetch(request, env, ctx) {
		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders});
		}

		// Only process POST requests
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: `${request.method} method not allowed` }), 
			{ status: 405, headers: corsHeaders });
		}

		// Create an instance of the OpenAI object
		// Pass in api key from Cloudflare environment - created with commands in terminalcommands-md.
		// Set base url to Open AI url in Cloudflare AI Gateway
		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseUrl: 'https://gateway.ai.cloudflare.com/v1/9b2e69562e04416b31a26fe76d3a9587/stock-predictions/openai'
		});

		try {
			const messages = await request.json();
			const chatCompletion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 1,
                presence_penalty: 0,
                frequency_penalty: 0
            });
			const response = chatCompletion.choices[0].message;
			// Include corsHeaders in response - both in successful and error responses
			return new Response(JSON.stringify(response), { headers: corsHeaders });
		} catch (err) {
			// Use similar structure in error message as in regular response
			return new Response(JSON.stringify({ error: err.message + err.stack }), { status: 500, headers: corsHeaders });
		}
	},
};