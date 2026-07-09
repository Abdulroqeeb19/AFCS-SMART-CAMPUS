const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'database.types.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Match Update block followed by closing brace of the table entry
// We need to match until the closing brace that ends the table entry
// Pattern: "Update: {" then any content (non-greedy) then "}\n      }\n      next_table_name_or_closing_bracket"
result = content.replace(
  /Update:\s*\{[\s\S]*?\}\n(\s*)\}(?=\s*\n\s+[a-z_]+\s*:)/g,
  (match) => {
    // Add Relationships: [] before the closing brace of the table
    return match.replace(/\}\n(\s*)\}(?=\s*\n\s+[a-z_]+\s*:)/, '}\n        Relationships: []\n      }');
  }
);

// Handle the last table (rate_limits) which is followed by closing of Tables/Views
result = result.replace(
  /Update:\s*\{[\s\S]*?\}\n(\s*)\}\s*\n\s*\}\s*\n\s*Views:/g,
  (match) => {
    return match.replace(/\}\n(\s*)\}\s*\n\s*\}\s*\n\s*Views:/, '}\n        Relationships: []\n      }\n    }\n    Views:');
  }
);

fs.writeFileSync(filePath, result, 'utf-8');
console.log('Done');