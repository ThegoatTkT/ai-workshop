import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/workshop.db";

// Ensure data directory exists
const dataDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DATABASE_PATH);
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

console.log("Running migrations...\n");

try {
  // Create tables
  console.log("Creating tables...");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      industry TEXT,
      technologies TEXT,
      description TEXT,
      outcomes TEXT,
      link TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      content TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT,
      file_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      total_records INTEGER DEFAULT 0,
      processed_records INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS processing_records (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',

      -- Source data
      company_name TEXT NOT NULL,
      linkedin_link TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      job_title TEXT,
      raw_data TEXT,

      -- Research results
      research_data TEXT,
      company_region TEXT,
      company_industry TEXT,
      company_news TEXT,

      -- Generated LinkedIn messages
      message1 TEXT,
      message2 TEXT,
      message3 TEXT,

      -- Metadata
      matched_case_ids TEXT,
      processing_time_ms INTEGER,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log("Tables created\n");

  // Add new columns for tracking selected items (safe to run multiple times)
  console.log("Adding new columns (if not exist)...");

  const columnsToAdd = [
    { name: "selected_news_indices", type: "TEXT" },
    { name: "selected_case_indices", type: "TEXT" },
    { name: "applied_regional_tone", type: "TEXT" },
  ];

  for (const col of columnsToAdd) {
    try {
      sqlite.exec(
        `ALTER TABLE processing_records ADD COLUMN ${col.name} ${col.type}`,
      );
      console.log(`  + Added column: ${col.name}`);
    } catch (err: any) {
      // Column already exists - this is fine
      if (err.message?.includes("duplicate column")) {
        console.log(`  - Column already exists: ${col.name}`);
      } else {
        throw err;
      }
    }
  }

  console.log("New columns added\n");

  // Create indexes
  console.log("Creating indexes...");

  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_processing_records_job_id ON processing_records(job_id);
    CREATE INDEX IF NOT EXISTS idx_processing_records_status ON processing_records(status);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_cases_industry ON cases(industry);
    CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);
  `);

  console.log("Indexes created\n");

  // Seed admin user
  console.log("Seeding admin user...");

  const adminId = randomUUID();
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);

  sqlite.exec(`
    INSERT OR IGNORE INTO users (id, username, password_hash, role)
    VALUES ('${adminId}', 'admin', '${adminPasswordHash}', 'admin');
  `);

  console.log("Admin user created (username: admin, password: admin123)\n");

  // Seed sample cases - GENERIC FICTIONAL EXAMPLES
  console.log("Seeding sample cases...");

  const sampleCases = [
    {
      id: randomUUID(),
      title: "HealthPlus Patient Portal",
      industry: "Healthcare",
      technologies: JSON.stringify(["React", "Node.js", "FHIR", "Azure"]),
      description:
        "Built comprehensive patient portal enabling 50,000+ patients to access medical records, schedule appointments, and communicate with providers",
      outcomes:
        "Improved patient engagement by 45%, reduced administrative calls by 40%, achieved HIPAA compliance certification",
      link: "#",
    },
    {
      id: randomUUID(),
      title: "TradeTech Trading Platform",
      industry: "Financial Services",
      technologies: JSON.stringify(["Angular", "Java", "PostgreSQL", "AWS"]),
      description:
        "Developed real-time trading platform processing 100,000+ transactions daily with sub-100ms latency",
      outcomes:
        "Reduced latency by 60%, increased trading volume by 300%, achieved SOC 2 Type II compliance",
      link: "#",
    },
    {
      id: randomUUID(),
      title: "StyleMart E-commerce Platform",
      industry: "Retail",
      technologies: JSON.stringify(["Next.js", "Shopify", "Stripe", "GCP"]),
      description:
        "Created omnichannel retail platform connecting 500+ stores with 2M+ online customers",
      outcomes:
        "Increased conversions by 35%, generated $50M in online revenue first year, reduced cart abandonment by 30%",
      link: "#",
    },
    {
      id: randomUUID(),
      title: "SmartFactory IoT System",
      industry: "Manufacturing",
      technologies: JSON.stringify([
        "Python",
        "IoT Hub",
        "Time Series DB",
        "Azure",
      ]),
      description:
        "Implemented IoT monitoring system for 200+ production machines across 5 facilities",
      outcomes:
        "Automated 80% of quality checks, reduced equipment downtime by 55%, prevented 15 critical failures",
      link: "#",
    },
    {
      id: randomUUID(),
      title: "CloudFirst Migration",
      industry: "Technology",
      technologies: JSON.stringify([
        "Kubernetes",
        "Docker",
        "Terraform",
        "AWS",
      ]),
      description:
        "Migrated legacy monolith to microservices architecture serving 1M+ users",
      outcomes:
        "Cut infrastructure costs by 50%, improved scalability by 10x, achieved 99.99% uptime",
      link: "#",
    },
  ];

  for (const caseItem of sampleCases) {
    sqlite
      .prepare(
        `
      INSERT OR IGNORE INTO cases (id, title, industry, technologies, description, outcomes, link, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `,
      )
      .run(
        caseItem.id,
        caseItem.title,
        caseItem.industry,
        caseItem.technologies,
        caseItem.description,
        caseItem.outcomes,
        caseItem.link,
      );
  }

  console.log(`${sampleCases.length} sample cases created\n`);

  // Seed recommendations
  console.log("Seeding recommendations...");

  const recommendations = [
    {
      id: randomUUID(),
      name: "Brand Voice",
      type: "general",
      content:
        "This is a global software development company with deep expertise across industries. Emphasize client-centric approach, technical excellence, and proven track record. Tone should be professional, consultative, and results-oriented.",
    },
    {
      id: randomUUID(),
      name: "Keep It Brief",
      type: "message1",
      content:
        "Message 1 (Proposal) should be concise (100-150 words). Focus on introducing your company and establishing initial value proposition. Keep it conversational for LinkedIn. Mention one relevant capability or success metric.",
    },
    {
      id: randomUUID(),
      name: "Demonstrate Expertise",
      type: "message2",
      content:
        "Message 2 (Invitation) should provide more detail (150-250 words). Reference 1-2 cases briefly to demonstrate relevant experience. Connect your capabilities to the prospect's likely needs. Use a professional but approachable LinkedIn tone.",
    },
    {
      id: randomUUID(),
      name: "Prove It with Case Studies",
      type: "message3",
      content:
        "Message 3 (Case Study) should focus on a specific case study (150-250 words). Emphasize measurable results and draw clear connection to prospect's potential needs. Suitable for LinkedIn InMail.",
    },
  ];

  for (const rec of recommendations) {
    sqlite
      .prepare(
        `
      INSERT OR IGNORE INTO recommendations (id, name, type, content, is_active, priority)
      VALUES (?, ?, ?, ?, 1, 0)
    `,
      )
      .run(rec.id, rec.name, rec.type, rec.content);
  }

  console.log(`${recommendations.length} recommendations created\n`);

  // Seed system settings
  console.log("Seeding system settings...");

  const settings = [
    {
      key: "research_prompt",
      value: `You are a sales research assistant. Research {{companyName}} to gather information for a personalized sales outreach campaign.

Your research should focus on:
1. Recent company news (less than 1 year old) - this is REQUIRED
2. Company region/location
3. Company industry
4. Key business initiatives or challenges
5. Company profile information if available: {{linkedinLink}}

Perform 3-5 targeted web searches to gather comprehensive information. Focus especially on finding recent news articles and announcements.`,
      description:
        "User prompt for web research agent. Variables: {{companyName}}, {{linkedinLink}}",
      category: "prompts",
    },
    {
      key: "research_system_prompt",
      value: `You are a sales research assistant with access to current company information. Provide detailed, factual research about companies including recent news, industry, and business information.`,
      description: "System prompt for web research agent",
      category: "prompts",
    },
    {
      key: "classification_prompt",
      value: `Based on this research about {{companyName}}, extract:
1. The company's primary country (select from: {{COUNTRIES}}, or Unknown if not determinable)
2. The company's primary industry (select from: {{INDUSTRIES}}, or Other if not matching)
3. A list of recent news items (less than 1 year old). Each news item must have a title, date, source URL, and optional summary.

Research findings:
{{researchContent}}

IMPORTANT: Only include news items with actual dates less than 1 year old. If no recent news is found, return an empty array for news.`,
      description:
        "Prompt for extracting country/industry/news from research. Variables: {{companyName}}, {{COUNTRIES}}, {{INDUSTRIES}}, {{researchContent}}",
      category: "prompts",
    },
    {
      key: "classification_system_prompt",
      value: `You are a company research analyst. Extract structured information from the provided research data.`,
      description: "System prompt for classification agent",
      category: "prompts",
    },
    {
      key: "news_search_prompt",
      value: `Search for recent news about "{{companyName}}" company.

Company Details:
- Company Name: {{companyName}}
- Country: {{country}}
- Industry: {{industry}}

Focus on finding:
1. Press releases and official announcements (last 12 months)
2. Product launches, partnerships, or expansions
3. Financial news (funding rounds, earnings, acquisitions)
4. Leadership changes or strategic initiatives
5. Industry recognition or awards

IMPORTANT:
- Only include news from the last 12 months
- Include the actual publication date for each item
- Include the source URL when available
- Prioritize news from reputable business sources
- Focus on news relevant to the {{industry}} industry`,
      description:
        "Prompt for dedicated news search. Variables: {{companyName}}, {{country}}, {{industry}}",
      category: "prompts",
    },
    {
      key: "message1_prompt",
      value: `Generate LinkedIn Message 1 (Proposal - Brief introduction, EXACTLY 100-150 words).

Contact Information:
- First Name: {{firstName}}
- Last Name: {{lastName}}
- Company: {{companyName}}
- Country: {{country}}
- Industry: {{industry}}

Research Context:
{{researchContent}}

Recent News:
{{enrichedNews}}

{{matchedCasesText}}

Requirements:
- NO subject line (LinkedIn messages don't have subjects)
- Use "{{firstName}}" in greeting (NOT placeholders like [Name] or {First Name})
- Brief value proposition highlighting your company's expertise
- Incorporate recent company news if available
- Professional but conversational LinkedIn tone
- Ensure message is 100-150 words (count carefully)
- End with a soft call-to-action appropriate for LinkedIn (e.g., "Would love to connect and share more")
- NO signature placeholders like [Your Name] or [Your Position]

CRITICAL: This is a LinkedIn message, not an email. Keep it conversational and direct.
Do NOT include ANY placeholders such as [Your Name], [Your Position], {Name}, etc.`,
      description:
        "Prompt for LinkedIn Message 1 (Proposal - Brief Introduction). Variables: {{firstName}}, {{lastName}}, {{companyName}}, {{country}}, {{industry}}, {{researchContent}}, {{enrichedNews}}, {{matchedCasesText}}",
      category: "prompts",
    },
    {
      key: "message2_prompt",
      value: `Generate LinkedIn Message 2 (Invitation - Detailed service description, MUST BE 150-250 words).

Contact Information:
- First Name: {{firstName}}
- Last Name: {{lastName}}
- Company: {{companyName}}
- Country: {{country}}
- Industry: {{industry}}

Research Context:
{{researchContent}}

Recent News:
{{enrichedNews}}

{{matchedCasesText}}

Requirements:
- NO subject line (LinkedIn messages don't have subjects)
- Use "{{firstName}}" in greeting (NOT placeholders)
- Provide a detailed, comprehensive description of how your company can help with 2-3 specific services/capabilities
- Mention 1-2 relevant case studies by name with specific outcomes
- Reference news talking points if available to show relevance
- Include a soft call-to-action appropriate for LinkedIn
- Expand on the value proposition with concrete examples and benefits
- MANDATORY WORD COUNT: 150-250 words. This is substantially LONGER and more detailed than Message 1.
- Professional but conversational LinkedIn tone

CRITICAL: This is a LinkedIn message, not an email. Keep it conversational and direct.
Do NOT include ANY placeholders such as [Your Name], [Your Position], {Name}, etc.`,
      description:
        "Prompt for LinkedIn Message 2 (Invitation - Detailed Service). Variables: {{firstName}}, {{lastName}}, {{companyName}}, {{country}}, {{industry}}, {{researchContent}}, {{enrichedNews}}, {{matchedCasesText}}",
      category: "prompts",
    },
    {
      key: "message3_prompt",
      value: `Generate LinkedIn Message 3 (Case Study - MUST BE 150-250 words).

Contact Information:
- First Name: {{firstName}}
- Last Name: {{lastName}}
- Company: {{companyName}}
- Country: {{country}}
- Industry: {{industry}}

Research Context:
{{researchContent}}

Recent News:
{{enrichedNews}}

{{matchedCasesText}}

Requirements:
- NO subject line (LinkedIn messages don't have subjects)
- Use "{{firstName}}" in greeting (NOT placeholders)
- Present a specific matched case study
- Draw connection to prospect's needs based on the case
- Include specific, measurable outcomes from the case
- If no cases matched, present a general success story with outcomes
- IMPORTANT: Ensure message is 150-250 words (count carefully - provide detailed case presentation)
- Professional but conversational LinkedIn tone suitable for InMail
- End with soft call-to-action (NO signature placeholders)

CRITICAL: This is a LinkedIn message, not an email. Keep it conversational and direct.
Do NOT include ANY placeholders such as [Your Name], [Your Position], {Name}, etc.`,
      description:
        "Prompt for LinkedIn Message 3 (Case Study Presentation). Variables: {{firstName}}, {{lastName}}, {{companyName}}, {{country}}, {{industry}}, {{researchContent}}, {{enrichedNews}}, {{matchedCasesText}}",
      category: "prompts",
    },
    {
      key: "message_system_prompt",
      value: `You are an expert LinkedIn outreach specialist for a global software development company. Write professional, personalized LinkedIn messages that demonstrate expertise and build relationships. LinkedIn messages should be conversational yet professional - more personal than formal emails but still business-appropriate. When given word count requirements, you MUST meet them exactly. Count words carefully. Never use placeholder text like [Your Name] or [Your Position]. Remember: LinkedIn messages have NO subject lines.`,
      description: "System prompt for LinkedIn message generation agent",
      category: "prompts",
    },
    {
      key: "case_selection_prompt",
      value: `Select 1-2 most relevant case studies for this sales opportunity.

Selection criteria (in order of priority):
1. Industry relevance (highest priority)
2. Problem/solution alignment
3. Geographic relevance (lower priority)
4. Technology fit

Return array of selected case titles (maximum 2).`,
      description: "Instructions for selecting relevant cases",
      category: "prompts",
    },
    {
      key: "average_processing_time_ms",
      value: "30000",
      description:
        "Average time per record in milliseconds (dynamically updated)",
      category: "agent",
    },
    // Regional tone rules
    {
      key: "regional_tone_uk",
      value: `- LinkedIn message must be short, clear, with a clear value proposition from the first lines
- Style is more restrained, closer to European: first interest, then offer
- Personalization is critical: name, industry, trigger ("read your post", "saw news about the launch")
- Do not use template marketing phrases - better to show one specific fact, project, result
- Call-to-action should be soft, with the option to choose time or format
- A clear structure is valued: who you are, why you are writing, what you can offer, how it will help
- Ending with an open-ended tone: "Let me know if that's something worth exploring"
- Use of expressions "Let me be respectful of your time..." and "Happy to connect if this is relevant" is standard`,
      description: "Communication tone guidelines for UK region",
      category: "regional_tones",
    },
    {
      key: "regional_tone_usa",
      value: `- LinkedIn message must be short, clear, with value proposition in the first lines
- Direct benefits can be mentioned in the first message if clearly tied to recipient's pain/goal
- Personalization is critical: name, industry, trigger ("read your post", "saw news about launch")
- Avoid template marketing phrases - better to show one specific fact, project, or result
- "Would love to share more if this sounds relevant."
- Light and natural tone of voice, as if you're on equal footing with the recipient
- Call-to-action should be soft, with option to choose time or format
- Clear structure valued: who you are, why you're writing, what you can offer, how it helps
- Closing should be open-ended: "Let me know if that's something worth exploring."
- Message should not be long or overly formal`,
      description: "Communication tone guidelines for USA region",
      category: "regional_tones",
    },
    {
      key: "regional_tone_mena",
      value: `- LinkedIn message must be maximally polite, respectful, and structured
- Introduce yourself and respectfully state the purpose of contact immediately
- No informality, abbreviations, or attempts to joke - style must be formal and business-like
- Interest in the lead's business should not bypass the lead's personality
- Prefer references to shared context: trade show participation, company news, regional trends, knowledge of laws and regulations
- Appropriate to use phrases like "With your kind permission" / "It would be a great honor..."
- Do not use aggressive CTAs - prefer phrases like "Would you be open to exploring this further at your convenience?"
- Message length may be above average, main priority is clear structure and respectful tone
- Important to emphasize relevance of the offer for the recipient's region or industry
- Mentions of religion, politics, culture are excluded
- Closing should include emphasized gratitude for attention and wishes for well-being`,
      description:
        "Communication tone guidelines for MENA region (UAE, Saudi Arabia, Qatar)",
      category: "regional_tones",
    },
    {
      key: "regional_tone_eu",
      value: `- Initial message should be brief, logical, and friendly - not overly formal
- Recipient expects clear motivation for contact - "why are you writing to me specifically?"
- Avoid pathos and pompous phrasing - style should be Scandinavian-reserved
- Avoid hard selling - better to outline discussion topic and suggest exchanging thoughts
- Preference for specifics and clear points (numbers, examples, concrete cases)
- Hyperbole and marketing templates ("world-leading", "outstanding", "disruptive") cause rejection
- Don't use "copy-paste" style - personal adaptation to country or company is mandatory
- Modesty is important in business ethics, especially in Netherlands and Finland
- Light informal tone acceptable, especially in Scandinavia and Ireland
- Begin with brief context and "human note", end with respect but not excessive politeness
- Simple humor or mention of common background (industry, trend, conference) is acceptable
- Better to finish with invitation to exchange opinions than direct call proposal`,
      description: "Communication tone guidelines for EU region",
      category: "regional_tones",
    },
    {
      key: "regional_tone_dach",
      value: `- Initial message must be neutral - no excessive praise of company or recipient
- Germans value the person behind the message - show who is writing and why
- Avoid aggressive pitch in first contact - light interest in dialogue is acceptable, but not selling
- Germans value clarity and specifics: better to write more than too little
- Any "value proposition" must be concrete and supported (examples, facts, benefits)
- Germans are sensitive to empty promises and abstractions - phrases like "extensive expertise" cause distrust
- Value should be offered in context of recipient's interest, not imposed
- Konjunktiv II in moderation is appropriate - but don't overuse, otherwise text seems overly polite and detached
- Avoid literal translations of English phrases - they sound unnatural
- Style should be formal but lively - light small talk or polite joke about weather is acceptable
- No comma after "Best regards," in German
- Avoid calques and complex passive constructions
- Break up long sentences - otherwise meaning gets lost due to verb at the end
- Consider gender sensitivity and avoid direct mentions of nationality
- Message must start with introduction and explanation of reason for contact
- Justify relevance: why you are writing to this specific person
- Proposals for collaboration or calls must be as unobtrusive and respectful as possible
- Better to give one concrete example than list achievements
- End politely with soft CTA and farewell formula
- Always maintain formal tone of communication`,
      description:
        "Communication tone guidelines for DACH region (Germany, Austria, Switzerland)",
      category: "regional_tones",
    },
  ];

  for (const setting of settings) {
    sqlite
      .prepare(
        `
      INSERT OR IGNORE INTO system_settings (id, key, value, description, category)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(
        randomUUID(),
        setting.key,
        setting.value,
        setting.description,
        setting.category,
      );
  }

  console.log(`${settings.length} system settings created\n`);

  console.log("All migrations completed successfully!\n");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  sqlite.close();
}
