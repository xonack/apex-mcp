#!/usr/bin/env tsx

/**
 * Apex API Documentation Extractor
 * 
 * This script uses Puppeteer to extract the Swagger specification
 * from the dynamically rendered Apex API documentation page.
 * 
 * Usage: tsx utils/extract-api-docs.ts
 * Output: docs/apex-api-spec.json
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface APIInfo {
  title?: string;
  version?: string;
  description?: string;
}

interface APISpec {
  swagger?: string;
  openapi?: string;
  info?: APIInfo;
  paths?: Record<string, any>;
  [key: string]: any;
}

const API_URL = 'https://api.apexagents.ai/api#/';
const OUTPUT_PATH = path.join(__dirname, '..', 'docs', 'apex-api-spec.json');

async function extractApiDocs(): Promise<APISpec | null> {
  console.log('🚀 Starting Apex API documentation extraction...');
  console.log(`📄 Target URL: ${API_URL}`);
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  let apiSpec: APISpec | null = null;
  
  // Set up network interception to catch API spec requests
  page.on('response', async response => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';
    
    // Look for JSON responses that might contain the API spec
    if (contentType.includes('application/json')) {
      try {
        const json = await response.json() as any;
        
        // Check if this looks like a Swagger specification
        if (json && (json.swagger || json.openapi || (json.info && json.paths))) {
          console.log(`✅ Found API specification at: ${url}`);
          apiSpec = json as APISpec;
        }
      } catch (error) {
        // Not JSON or parsing failed, ignore
      }
    }
  });
  
  try {
    console.log('📱 Loading Swagger UI page...');
    await page.goto(API_URL, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for the page to fully load
    console.log('⏳ Waiting for Swagger UI to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // If we didn't catch the spec via network interception, try extracting from the page
    if (!apiSpec) {
      console.log('🔍 Attempting to extract spec from page JavaScript...');
      
      apiSpec = await page.evaluate((): APISpec | null => {
        // Try common Swagger UI global variables
        if ((window as any).ui && (window as any).ui.specSelectors) {
          try {
            const spec = (window as any).ui.specSelectors.specJsonWithResolvedSubtrees();
            return spec ? spec.toJSON() : null;
          } catch (e) {
            console.log('Failed to get spec from UI selectors:', e);
          }
        }
        
        // Try other common locations
        if ((window as any).swaggerSpec) return (window as any).swaggerSpec;
        if ((window as any).apiSpec) return (window as any).apiSpec;
        if ((window as any).spec) return (window as any).spec;
        
        // Look for script tags that might contain the spec
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          const content = script.textContent || script.innerHTML;
          if (content.includes('"openapi"') || content.includes('"swagger"')) {
            try {
              // Try to extract JSON from the script content
              const jsonMatch = content.match(/\{[^}]*"openapi"[^{]*\{.*\}/s) || 
                               content.match(/\{[^}]*"swagger"[^{]*\{.*\}/s);
              if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
              }
            } catch (e) {
              // Failed to parse, continue
            }
          }
        }
        
        return null;
      });
    }
    
    if (apiSpec) {
      // Ensure the docs directory exists
      const docsDir = path.dirname(OUTPUT_PATH);
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      // Save the extracted specification
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(apiSpec, null, 2));
      
      console.log('✅ API specification extracted successfully!');
      console.log(`📁 Saved to: ${OUTPUT_PATH}`);
      console.log(`📊 Found ${Object.keys(apiSpec.paths || {}).length} endpoints`);
      
      // Log some basic info about the API
      if (apiSpec.info) {
        console.log(`📋 API Title: ${apiSpec.info.title || 'Unknown'}`);
        console.log(`📌 API Version: ${apiSpec.info.version || 'Unknown'}`);
        if (apiSpec.info.description) {
          console.log(`📝 Description: ${apiSpec.info.description.substring(0, 100)}...`);
        }
      }
      
    } else {
      console.log('❌ Failed to extract API specification');
      console.log('💡 The page might use a different structure or require authentication');
      
      // Save the page HTML for debugging
      const html = await page.content();
      const debugPath = path.join(__dirname, '..', 'docs', 'debug-page.html');
      fs.writeFileSync(debugPath, html);
      console.log(`🐛 Page HTML saved to ${debugPath} for debugging`);
    }
    
  } catch (error) {
    console.error('❌ Error during extraction:', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await browser.close();
  }
  
  return apiSpec;
}

// Run the extraction if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  extractApiDocs()
    .then(spec => {
      if (spec) {
        console.log('🎉 Extraction completed successfully!');
        process.exit(0);
      } else {
        console.log('⚠️  No API specification found');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Extraction failed:', error);
      process.exit(1);
    });
}

export { extractApiDocs };