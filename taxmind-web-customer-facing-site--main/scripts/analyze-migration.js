#!/usr/bin/env node

/**
 * API Migration Analysis Script
 * Scans the codebase to identify components that need migration from direct axios usage
 */

const fs = require("fs");
const path = require("path");

class MigrationAnalyzer {
  constructor() {
    this.results = {
      components: [],
      totalFiles: 0,
      migratedFiles: 0,
      pendingFiles: 0,
      patterns: {
        directAxios: [],
        oldPatterns: [],
        fileUploads: [],
        errorHandling: [],
      },
    };
  }

  analyzeDirectory(dirPath, baseDir = "") {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const relativePath = path.join(baseDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith(".")) {
        this.analyzeDirectory(filePath, relativePath);
      } else if (file.endsWith(".vue") || file.endsWith(".js")) {
        this.analyzeFile(filePath, relativePath);
      }
    });
  }

  analyzeFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const analysis = this.analyzeContent(content, relativePath);

      if (analysis.needsMigration) {
        this.results.components.push(analysis);
        this.results.pendingFiles++;
      } else {
        this.results.migratedFiles++;
      }

      this.results.totalFiles++;
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  }

  analyzeContent(content, filePath) {
    const analysis = {
      file: filePath,
      needsMigration: false,
      patterns: [],
      priority: "low",
      complexity: "simple",
      issues: [],
    };

    // Check for direct axios usage
    const axiosPatterns = [
      /axios\s*\(/g,
      /axios\.get\(/g,
      /axios\.post\(/g,
      /axios\.put\(/g,
      /axios\.patch\(/g,
      /axios\.delete\(/g,
    ];

    axiosPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        analysis.needsMigration = true;
        analysis.patterns.push({
          type: "direct_axios",
          count: matches.length,
          pattern: pattern.toString(),
        });
      }
    });

    // Check for old token header patterns
    if (content.includes("headers: {") && content.includes("token:")) {
      analysis.patterns.push({
        type: "old_token_header",
        description: "Uses old token header format",
      });
    }

    // Check for manual error handling
    if (content.includes(".catch(") && content.includes("err.response")) {
      analysis.patterns.push({
        type: "manual_error_handling",
        description: "Has manual error handling that can be simplified",
      });
    }

    // Check for file uploads
    if (
      content.includes("FormData") ||
      content.includes("multipart/form-data")
    ) {
      analysis.patterns.push({
        type: "file_upload",
        description: "Contains file upload functionality",
      });
      analysis.complexity = "medium";
    }

    // Check if already migrated
    if (
      content.includes("ApiMigrationMixin") ||
      content.includes("$apiService")
    ) {
      analysis.needsMigration = false;
      analysis.patterns.push({
        type: "already_migrated",
        description: "Already uses new API client",
      });
    }

    // Determine priority based on file path
    if (
      filePath.includes("Profile/") ||
      filePath.includes("auth") ||
      filePath.includes("login")
    ) {
      analysis.priority = "high";
    } else if (
      filePath.includes("LandingPage/") ||
      filePath.includes("Application/")
    ) {
      analysis.priority = "medium";
    }

    // Determine complexity
    const axiosCallCount = (content.match(/axios/g) || []).length;
    if (axiosCallCount > 5) {
      analysis.complexity = "complex";
    } else if (axiosCallCount > 2) {
      analysis.complexity = "medium";
    }

    return analysis;
  }

  generateReport() {
    console.log("\n📊 TaxMind API Migration Analysis Report");
    console.log("=========================================\n");

    // Summary
    console.log("📈 Summary:");
    console.log(`   Total files analyzed: ${this.results.totalFiles}`);
    console.log(`   Files needing migration: ${this.results.pendingFiles}`);
    console.log(`   Files already migrated: ${this.results.migratedFiles}`);
    console.log(
      `   Migration progress: ${Math.round(
        (this.results.migratedFiles / this.results.totalFiles) * 100
      )}%\n`
    );

    // Priority breakdown
    const priorities = { high: 0, medium: 0, low: 0 };
    this.results.components.forEach((comp) => priorities[comp.priority]++);

    console.log("🎯 Priority Breakdown:");
    console.log(`   High priority: ${priorities.high} files`);
    console.log(`   Medium priority: ${priorities.medium} files`);
    console.log(`   Low priority: ${priorities.low} files\n`);

    // Complexity breakdown
    const complexity = { simple: 0, medium: 0, complex: 0 };
    this.results.components.forEach((comp) => complexity[comp.complexity]++);

    console.log("🔧 Complexity Breakdown:");
    console.log(`   Simple migrations: ${complexity.simple} files`);
    console.log(`   Medium complexity: ${complexity.medium} files`);
    console.log(`   Complex migrations: ${complexity.complex} files\n`);

    // High priority files
    const highPriorityFiles = this.results.components.filter(
      (c) => c.priority === "high"
    );
    if (highPriorityFiles.length > 0) {
      console.log("🚨 High Priority Files (Migrate First):");
      highPriorityFiles.forEach((file) => {
        console.log(`   📄 ${file.file}`);
        file.patterns.forEach((pattern) => {
          console.log(
            `      - ${pattern.type}: ${
              pattern.description || pattern.count + " occurrences"
            }`
          );
        });
      });
      console.log("");
    }

    // Complex files
    const complexFiles = this.results.components.filter(
      (c) => c.complexity === "complex"
    );
    if (complexFiles.length > 0) {
      console.log("⚠️  Complex Migrations (Need Extra Attention):");
      complexFiles.forEach((file) => {
        console.log(`   📄 ${file.file}`);
        file.patterns.forEach((pattern) => {
          if (pattern.count) {
            console.log(
              `      - ${pattern.type}: ${pattern.count} occurrences`
            );
          }
        });
      });
      console.log("");
    }

    // Migration recommendations
    console.log("💡 Migration Recommendations:");
    console.log(
      "   1. Start with high-priority files (auth, profile, application)"
    );
    console.log("   2. Use ApiMigrationMixin for standardized error handling");
    console.log("   3. Test thoroughly after each component migration");
    console.log("   4. Use feature flags for new API endpoints");
    console.log(
      "   5. Update environment variables for different deployments\n"
    );

    // Generate migration plan
    this.generateMigrationPlan();
  }

  generateMigrationPlan() {
    const plan = {
      phase1: this.results.components.filter(
        (c) => c.priority === "high" && c.complexity !== "complex"
      ),
      phase2: this.results.components.filter(
        (c) => c.priority === "high" && c.complexity === "complex"
      ),
      phase3: this.results.components.filter((c) => c.priority === "medium"),
      phase4: this.results.components.filter((c) => c.priority === "low"),
    };

    console.log("📋 Suggested Migration Plan:");
    console.log("\n   Phase 1 - Critical & Simple (Week 1):");
    plan.phase1.forEach((file) => console.log(`     • ${file.file}`));

    console.log("\n   Phase 2 - Critical & Complex (Week 2):");
    plan.phase2.forEach((file) => console.log(`     • ${file.file}`));

    console.log("\n   Phase 3 - Medium Priority (Week 3):");
    plan.phase3
      .slice(0, 10)
      .forEach((file) => console.log(`     • ${file.file}`));
    if (plan.phase3.length > 10) {
      console.log(`     ... and ${plan.phase3.length - 10} more files`);
    }

    console.log("\n   Phase 4 - Low Priority (Week 4):");
    plan.phase4
      .slice(0, 5)
      .forEach((file) => console.log(`     • ${file.file}`));
    if (plan.phase4.length > 5) {
      console.log(`     ... and ${plan.phase4.length - 5} more files`);
    }

    console.log("\n");
  }

  saveReport() {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalFiles: this.results.totalFiles,
        pendingFiles: this.results.pendingFiles,
        migratedFiles: this.results.migratedFiles,
        migrationProgress: Math.round(
          (this.results.migratedFiles / this.results.totalFiles) * 100
        ),
      },
      components: this.results.components,
    };

    fs.writeFileSync(
      path.join(__dirname, "..", "migration-analysis.json"),
      JSON.stringify(reportData, null, 2)
    );

    console.log("💾 Detailed report saved to: migration-analysis.json");
  }
}

// Run the analysis
const analyzer = new MigrationAnalyzer();
const srcPath = path.join(__dirname, "..", "src");

if (fs.existsSync(srcPath)) {
  analyzer.analyzeDirectory(srcPath);
  analyzer.generateReport();
  analyzer.saveReport();
} else {
  console.error(
    "❌ src directory not found. Please run this script from the project root."
  );
}

module.exports = MigrationAnalyzer;
