#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure @mermaid-js/mermaid-cli is installed
try {
  execSync('mmdc --version', { stdio: 'ignore' });
} catch (error) {
  console.log('Installing @mermaid-js/mermaid-cli...');
  execSync('npm install -g @mermaid-js/mermaid-cli');
}

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const IMAGES_DIR = path.join(DOCS_DIR, 'images');

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Extract Mermaid diagrams from markdown files
function extractDiagrams(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const diagramRegex = /```mermaid\n([\s\S]*?)\n```/g;
  const diagrams = [];
  let match;

  while ((match = diagramRegex.exec(content)) !== null) {
    diagrams.push(match[1]);
  }

  return diagrams;
}

// Generate SVG from Mermaid diagram
function generateSVG(diagram, outputPath) {
  const tempFile = path.join(__dirname, 'temp.mmd');
  fs.writeFileSync(tempFile, diagram);

  try {
    execSync(`mmdc -i ${tempFile} -o ${outputPath} -t dark -b transparent`);
    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error('Error generating diagram:', error.message);
  } finally {
    fs.unlinkSync(tempFile);
  }
}

// Process all markdown files in docs directory
fs.readdirSync(DOCS_DIR)
  .filter(file => file.endsWith('.md'))
  .forEach(file => {
    const filePath = path.join(DOCS_DIR, file);
    const diagrams = extractDiagrams(filePath);
    const baseName = path.basename(file, '.md');

    diagrams.forEach((diagram, index) => {
      const outputPath = path.join(
        IMAGES_DIR,
        `${baseName}-diagram-${index + 1}.svg`
      );
      generateSVG(diagram, outputPath);
    });
  });

// Generate main architecture diagram
const mainArchitecture = `
graph TB
    subgraph Client ["Client Layer"]
        UI[Next.js Frontend]
        PWA[Progressive Web App]
        SW[Service Worker]
    end

    subgraph Application ["Application Layer"]
        API[API Routes]
        Auth[Authentication]
        Cache[Caching Layer]
        Queue[Job Queue]
    end

    subgraph Services ["Service Layer"]
        Projects[Project Management]
        UserMgmt[User Management]
        Search[Search Service]
        Analytics[Analytics Engine]
    end

    subgraph Data ["Data Layer"]
        Supabase[(Supabase)]
        Redis[(Redis Cache)]
        S3[(AWS S3)]
    end

    subgraph Infrastructure ["Infrastructure Layer"]
        ECS[AWS ECS]
        CloudFront[CloudFront CDN]
        WAF[AWS WAF]
        Route53[Route 53 DNS]
    end

    UI --> API
    PWA --> SW
    SW --> Cache
    API --> Auth
    API --> Cache
    Auth --> UserMgmt
    Cache --> Redis
    Projects --> Supabase
    UserMgmt --> Supabase
    Search --> Supabase
    Analytics --> S3
    
    CloudFront --> UI
    WAF --> CloudFront
    Route53 --> CloudFront
    ECS --> API
`;

generateSVG(mainArchitecture, path.join(IMAGES_DIR, 'architecture-overview.svg'));
