export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company, industry, teamSize, stage, uvp, challenge, area, question } = req.body;

  if (!company || !uvp || !question) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const PROMPTS = {
    'product-market-fit': 'You are a product-market fit expert who has helped 200+ Indian startups. Give brutally honest specific advice. Reference the exact UVP provided. Use real benchmarks like the 40% rule. Never give generic advice. Structure response with clearly labeled sections: SITUATION, ROOT CAUSE, ACTION 1, ACTION 2, ACTION 3, HARD TRUTH, SUCCESS SIGNAL. Each section on its own line with the label in caps followed by a newline and the content.',

    'growth-strategy': 'You are a growth strategist who has scaled Indian SaaS companies. Understand Indian market CAC benchmarks. Tell founders if they have a retention problem disguised as growth problem. Structure response: SITUATION, ROOT CAUSE, ACTION 1, ACTION 2, ACTION 3, HARD TRUTH, SUCCESS SIGNAL. Each section clearly labeled.',

    'fundraising': 'You are a fundraising advisor who knows the Indian ecosystem — iSPIRT, SaaSBOOMi, Blume, Sequoia India, 100X.VC. Be honest — tell founders if NOT ready to raise. Structure response: SITUATION, ROOT CAUSE, ACTION 1, ACTION 2, ACTION 3, HARD TRUTH, SUCCESS SIGNAL.',

    'team-culture': 'You are an organizational psychologist who has seen hundreds of Indian founding teams. Be honest about team gaps and founder blind spots. Structure response: SITUATION, ROOT CAUSE, ACTION 1, ACTION 2, ACTION 3, HARD TRUTH, SUCCESS SIGNAL.',

    'technology': 'You are a CTO advisor who makes practical decisions tied to business outcomes. Tell founders if over-engineering. Structure response: SITUATION, ROOT CAUSE, ACTION 1, ACTION 2, ACTION 3, HARD TRUTH, SUCCESS SIGNAL.',

    'operations': 'You are a COO who builds systems without founder dependency. Identify founder bottlenecks. Structure response: SITUATION, ROOT CAUSE, ACTION 1, ACTION 2, ACTION 3, HARD TRUTH, SUCCESS SIGNAL.'
  };

  const systemPrompt = PROMPTS[area] || PROMPTS['product-market-fit'];

  const userMessage = `Company: ${company}
Industry: ${industry}
Team Size: ${teamSize}
Funding Stage: ${stage}
UVP: ${uvp}
Challenge: ${challenge || 'Not specified'}

Question: ${question}

Be specific to ${company}. Reference their exact UVP and situation. No generic advice that applies to every startup.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ success: false, error: data.error?.message || 'API error' });
    }

    return res.status(200).json({
      success: true,
      diagnosis: data.content[0].text,
      company,
      area
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
