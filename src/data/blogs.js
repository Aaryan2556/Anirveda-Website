const blogData = [
  {
    id: 1,
    title: "The Era of Influencer Entrepreneurship: Gaurav Taneja vs Mayur Gedia",
    author: "C&D Research Team",
    authorNode: "NODE_CND_01",
    date: "February 9, 2025",
    readTime: "5 min read",
    category: "entrepreneurship",
    categoryLabel: "ENTREPRENEURSHIP & MEDIA",
    tags: ["SHARK_TANK", "INFLUENCER_ECONOMY", "STARTUPS"],
    isFeatured: true,
    excerpt:
      "Shark Tank India has transformed business conversations in India. From influencer-led ventures to product-first companies, the show highlights different paths to entrepreneurial success.",
    content: `
      <h2 class="text-3xl font-bold mt-10 mb-6 text-primary drop-shadow-[0_0_25px_rgba(var(--primary-rgb),0.35)]">
  Shark Tank India and the Rise of Influencer Businesses
</h2>
      <p>Shark Tank India has evolved beyond a business reality show into a platform that shapes public opinion about entrepreneurship. Each episode sparks discussions across social media, where audiences analyze pitches, investment decisions, and business models.</p>

      <p>The contrasting approaches of influencer-driven businesses and traditional product-first ventures have become a central theme. The comparison between Gaurav Taneja and Mayur Gedia highlights this shift in modern entrepreneurship.</p>

      <h2 class="text-3xl font-bold mt-10 mb-6 text-primary drop-shadow-[0_0_25px_rgba(var(--primary-rgb),0.35)]">
  The Rise of Influencer-Led Startups
</h2>
      <p>The digital economy has enabled influencers to build businesses using their personal brand credibility. Direct-to-consumer companies increasingly rely on audience trust and online engagement.</p>

      <p>However, sustainability remains a challenge. Long-term success depends on product quality, operational efficiency, and innovation rather than marketing influence alone.</p>

      <h2 class="text-3xl font-bold mt-10 mb-6 text-primary drop-shadow-[0_0_25px_rgba(var(--primary-rgb),0.35)]">
  Gaurav Taneja vs Mayur Gedia
</h2>
      <p>The pitches of Gaurav Taneja and Mayur Gedia demonstrated two different entrepreneurial philosophies. Taneja focused heavily on his online community and brand influence, while Gedia emphasized product development, scalability, and operational strength.</p>

      <ul class="list-disc ml-6">
        <li>Influencer-driven businesses rely on audience engagement.</li>
        <li>Product-first companies focus on innovation and long-term value.</li>
        <li>Sustainable growth requires strong fundamentals.</li>
      </ul>

      <h2 class="text-3xl font-bold mt-10 mb-6 text-primary drop-shadow-[0_0_25px_rgba(var(--primary-rgb),0.35)]">
  Influencers Who Built Sustainable Brands
</h2>
      <p>Several entrepreneurs have successfully combined influence with strong business fundamentals. Brands like Nish Hair and Paradyes demonstrate how social media presence can complement product innovation and strategic growth.</p>

      <p>These companies show that influence can accelerate growth, but business success ultimately depends on delivering consistent value to customers.</p>
    `,
    image: "/sharktankIMG.jpg",
  },
  /*{
    id: 2,
    title: "Macroeconomic Shocks and Central Bank Rate Regimes in 2025",
    author: "Anirveda Macro Research",
    authorNode: "NODE_MACRO_02",
    date: "January 28, 2025",
    readTime: "7 min read",
    category: "macroeconomics",
    categoryLabel: "MACROECONOMICS & POLICY",
    tags: ["CENTRAL_BANKS", "INFLATION_RAILS", "MONETARY_POLICY"],
    isFeatured: false,
    excerpt:
      "An analysis of global monetary policy shifts, inflationary persistence, and sovereign yield dynamics in response to supply chain restructuring.",
    content: `
      <h2 class="text-3xl font-bold mt-10 mb-6 bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">Global Yield Dynamics & Inflation Targets</h2>
      <p>Central banks around the globe are balancing rate cuts against persistent underlying inflation expectations. As sovereign bond yields fluctuate, institutional capital allocators are re-evaluating risk models.</p>

      <p>Understanding the interplay between fiscal deficits, interest rate differentials, and global trade velocity is essential for navigating modern financial markets.</p>
    `,
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Decentralized Compute & High-Frequency Risk Engines",
    author: "Tech & Quantitative Labs",
    authorNode: "NODE_QUANT_03",
    date: "January 14, 2025",
    readTime: "6 min read",
    category: "fintech",
    categoryLabel: "QUANT & FINTECH",
    tags: ["HPC_COMPUTE", "RISK_MODELING", "AI_ORCHESTRATION"],
    isFeatured: false,
    excerpt:
      "Exploring zero-knowledge proofs, decentralized GPU clusters, and real-time algorithmic risk engines shaping frontier asset settlement.",
    content: `
      <h2 class="text-3xl font-bold mt-10 mb-6 bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">High-Performance Infrastructure for Financial Telemetry</h2>
      <p>Real-time market modeling requires sub-millisecond execution and high-throughput data pipelines. The integration of AI multi-agent orchestration is redefining algorithmic liquidity routing.</p>

      <p>Zero-knowledge verifiability ensures institutional privacy without sacrificing cross-chain interoperability.</p>
    `,
    image: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1000&auto=format&fit=crop",
  },*/
];

export const BLOG_CATEGORIES = [
  { id: "all", label: "ALL PUBLICATIONS", code: "SYS_ALL" },
  { id: "entrepreneurship", label: "ENTREPRENEURSHIP & MEDIA", code: "CAT_ENT" },
  { id: "macroeconomics", label: "MACROECONOMICS & POLICY", code: "CAT_MACRO" },
  { id: "fintech", label: "QUANT & FINTECH", code: "CAT_QUANT" },
];

export default blogData;
