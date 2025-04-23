export async function analyzeIngredientsWithAI(ingredientsText) {
  const prompt = `
You are a nutrition expert.

Evaluate the healthiness of the following product ingredients based on:
- Type of oil used (e.g. avocado oil, olive oil, palm oil, canola oil)
- Use of enzymes or additives (e.g. emulsifiers, stabilizers, preservatives)
- Signs of ultra-processing
- Artificial colors, sweeteners, or flavors
- Any potentially harmful or controversial ingredients

Ingredients: ${ingredientsText}

Respond ONLY with the following JSON format:
{
  "positives": [],
  "warnings": []
}
`;

  try {
    let message = '{}';

    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
    });

    const result = await response.json();
    console.log('🧠 Raw AI response:', JSON.stringify(result, null, 2));
    message = result?.[0]?.generated_text || '{}';

    // Attempt to extract JSON from the generated text using RegExp
    const matches = message.match(/\{[\s\S]*?\}/g);
    if (!matches || matches.length === 0) {
      throw new Error("Response does not contain valid JSON.");
    }

    // Use the last match which contains "positives" and "warnings"
    const reversedMatches = matches.reverse();
    const validJSONMatch = reversedMatches.find(str => str.includes('"positives"') && str.includes('"warnings"'));

    if (!validJSONMatch) {
      throw new Error("No valid JSON block found in response.");
    }

    const jsonSubstring = validJSONMatch;

    let parsed;
    try {
      parsed = JSON.parse(jsonSubstring);
    } catch (parseErr) {
      console.error('Failed to parse extracted JSON:', jsonSubstring);
      throw parseErr;
    }

    // Optionally validate structure
    if (
      !Array.isArray(parsed.positives) ||
      !Array.isArray(parsed.warnings)
    ) {
      throw new Error("AI returned invalid format.");
    }

    return parsed;
  } catch (err) {
    console.error('AI analysis failed:', err, '\nRaw message:', message);
    return { positives: [], warnings: ['Failed to analyze ingredients.'] };
  }
}