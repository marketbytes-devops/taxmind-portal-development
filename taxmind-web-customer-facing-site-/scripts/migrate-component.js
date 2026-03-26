#!/usr/bin/env node

/**
 * Component Migration Helper Script
 * Provides interactive migration assistance for Vue components
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

class ComponentMigrator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start() {
    console.log("🚀 TaxMind Component Migration Helper");
    console.log("=====================================\n");

    const filePath = await this.askQuestion(
      "Enter component file path (relative to src/): "
    );
    const fullPath = path.join(__dirname, "..", "src", filePath);

    if (!fs.existsSync(fullPath)) {
      console.log("❌ File not found:", fullPath);
      this.rl.close();
      return;
    }

    await this.migrateComponent(fullPath, filePath);
    this.rl.close();
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  async migrateComponent(fullPath, relativePath) {
    try {
      const content = fs.readFileSync(fullPath, "utf8");
      const analysis = this.analyzeComponent(content);

      console.log(`\n📄 Analyzing: ${relativePath}`);
      console.log(`   Axios calls found: ${analysis.axiosCalls}`);
      console.log(`   Migration complexity: ${analysis.complexity}`);
      console.log(`   Estimated time: ${analysis.estimatedTime}`);

      if (analysis.axiosCalls === 0) {
        console.log(
          "✅ No axios calls found - component may already be migrated or not need migration."
        );
        return;
      }

      console.log("\n🔍 Migration suggestions:");
      analysis.suggestions.forEach((suggestion) => {
        console.log(`   • ${suggestion}`);
      });

      const proceed = await this.askQuestion(
        "\nProceed with automatic migration? (y/n): "
      );

      if (proceed.toLowerCase() === "y") {
        await this.performMigration(fullPath, content, analysis);
      } else {
        console.log(
          "Migration cancelled. Use manual migration steps from the guide."
        );
      }
    } catch (error) {
      console.error("❌ Error processing component:", error.message);
    }
  }

  analyzeComponent(content) {
    const analysis = {
      axiosCalls: 0,
      complexity: "simple",
      estimatedTime: "15-30 minutes",
      suggestions: [],
      patterns: [],
    };

    // Count axios calls
    const axiosMatches = content.match(/axios\s*\(/g) || [];
    analysis.axiosCalls = axiosMatches.length;

    // Analyze patterns
    if (content.includes("import axios from")) {
      analysis.patterns.push("direct_import");
      analysis.suggestions.push("Replace axios import with ApiMigrationMixin");
    }

    if (content.includes("FormData")) {
      analysis.patterns.push("file_upload");
      analysis.suggestions.push("Use $api.uploadFile() for file uploads");
      analysis.complexity = "medium";
      analysis.estimatedTime = "30-45 minutes";
    }

    if (content.includes(".catch(") && content.includes("err.response")) {
      analysis.patterns.push("manual_error_handling");
      analysis.suggestions.push(
        "Remove manual error handling - use ApiMigrationMixin.handleApiError()"
      );
    }

    if (content.includes("token: localStorage.getItem")) {
      analysis.patterns.push("manual_token");
      analysis.suggestions.push(
        "Remove manual token headers - handled automatically"
      );
    }

    if (analysis.axiosCalls > 5) {
      analysis.complexity = "complex";
      analysis.estimatedTime = "1-2 hours";
      analysis.suggestions.push(
        "Consider breaking component into smaller parts"
      );
    }

    return analysis;
  }

  async performMigration(fullPath, content, analysis) {
    console.log("\n🔧 Performing automatic migration...");

    let migratedContent = content;

    // Step 1: Add import and mixin
    if (!content.includes("ApiMigrationMixin")) {
      migratedContent = this.addMigrationMixin(migratedContent);
      console.log("   ✅ Added ApiMigrationMixin import and mixin");
    }

    // Step 2: Replace simple axios calls
    migratedContent = this.replaceSimpleAxiosCalls(migratedContent);
    console.log("   ✅ Replaced simple axios calls");

    // Step 3: Simplify error handling
    migratedContent = this.simplifyErrorHandling(migratedContent);
    console.log("   ✅ Simplified error handling");

    // Step 4: Remove manual token headers
    migratedContent = this.removeManualTokens(migratedContent);
    console.log("   ✅ Removed manual token headers");

    // Create backup
    const backupPath = fullPath + ".backup";
    fs.writeFileSync(backupPath, content);
    console.log(`   📄 Created backup: ${backupPath}`);

    // Write migrated content
    fs.writeFileSync(fullPath, migratedContent);
    console.log(`   ✅ Migration completed!`);

    console.log(
      "\n⚠️  Important: Please review the migrated code and test thoroughly!"
    );
    console.log("   • Check that all API calls work correctly");
    console.log("   • Verify error handling is appropriate");
    console.log("   • Test loading states");
    console.log("   • Remove backup file after verification");
  }

  addMigrationMixin(content) {
    // Add import if not present
    if (!content.includes("import { ApiMigrationMixin }")) {
      const importMatch = content.match(/import.*from.*['"]/);
      if (importMatch) {
        const importIndex = content.indexOf(importMatch[0]);
        const insertIndex = content.indexOf("\n", importIndex) + 1;
        content =
          content.slice(0, insertIndex) +
          "import { ApiMigrationMixin } from '@/utils/apiMigration'\n" +
          content.slice(insertIndex);
      }
    }

    // Add mixin if not present
    if (
      !content.includes("mixins:") &&
      !content.includes("ApiMigrationMixin")
    ) {
      const exportMatch = content.match(/export default\s*{/);
      if (exportMatch) {
        const exportIndex =
          content.indexOf(exportMatch[0]) + exportMatch[0].length;
        content =
          content.slice(0, exportIndex) +
          "\n  mixins: [ApiMigrationMixin]," +
          content.slice(exportIndex);
      }
    }

    return content;
  }

  replaceSimpleAxiosCalls(content) {
    // Replace common patterns

    // Pattern: axios({ url: "...", method: "GET" })
    content = content.replace(
      /axios\s*\(\s*{\s*url:\s*["']([^"']+)["']\s*,\s*method:\s*["']GET["']\s*[^}]*}\s*\)/g,
      "this.fetchData('$1')"
    );

    // Pattern: axios({ url: "...", method: "POST", data: ... })
    content = content.replace(
      /axios\s*\(\s*{\s*url:\s*["']([^"']+)["']\s*,\s*method:\s*["']POST["']\s*,\s*data:\s*([^,}]+)[^}]*}\s*\)/g,
      "this.submitData('$1', $2)"
    );

    return content;
  }

  simplifyErrorHandling(content) {
    // Replace complex catch blocks with simple error handling
    content = content.replace(
      /\.catch\s*\(\s*\([^)]*\)\s*=>\s*{\s*[^}]*this\.appLoading\s*=\s*false[^}]*}\s*\)/g,
      "// Error handling done automatically by ApiMigrationMixin"
    );

    return content;
  }

  removeManualTokens(content) {
    // Remove token headers
    content = content.replace(
      /headers:\s*{\s*token:\s*localStorage\.getItem\(["']token["']\)[^}]*}/g,
      "// Token headers added automatically"
    );

    return content;
  }
}

// Run the migrator
if (require.main === module) {
  const migrator = new ComponentMigrator();
  migrator.start().catch(console.error);
}

module.exports = ComponentMigrator;
