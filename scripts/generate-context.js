const fs = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'public');
const outputFile = path.join(outputDir, 'repository-context.md');

const includedDirs = [
    'app',
    'components',
    'lib',
    'prisma',
    'types',
    'docs'
];

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.prisma', '.md', '.json'];

// Ensure public dir exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

let fileCount = 0;
let content = '# Repository Context\n\nThis file contains a consolidated view of the codebase for use with LLMs.\n\n';

function shouldIncludeFile(filePath) {
    const ext = path.extname(filePath);
    return extensions.includes(ext);
}

function processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && shouldIncludeFile(fullPath)) {
            // additional check to avoid reading large files or irrelevant ones
            if (entry.name === 'package-lock.json') continue;

            console.log(`Processing: ${relativePath}`);
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            // Normalize extension for code block
            let codeBlockExt = path.extname(fullPath).substring(1);
            if (codeBlockExt === 'ts' || codeBlockExt === 'tsx') codeBlockExt = 'typescript';
            if (codeBlockExt === 'js' || codeBlockExt === 'jsx') codeBlockExt = 'javascript';

            content += `\n\n# File: ${relativePath}\n\`\`\`${codeBlockExt}\n${fileContent}\n\`\`\`\n`;
            fileCount++;
        }
    }
}

console.log('Generating repository context...');

for (const dir of includedDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
        processDirectory(fullPath);
    } else {
        console.warn(`Warning: Directory not found: ${dir}`);
    }
}

// Also include root files like package.json, next.config.ts, README.md, middleware.ts
const rootFiles = ['package.json', 'next.config.ts', 'README.md', 'middleware.ts'];
for (const file of rootFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        console.log(`Processing: ${file}`);
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        let codeBlockExt = path.extname(file).substring(1);
        if (codeBlockExt === 'ts') codeBlockExt = 'typescript';

        content += `\n\n# File: ${file}\n\`\`\`${codeBlockExt}\n${fileContent}\n\`\`\`\n`;
        fileCount++;
    }
}

fs.writeFileSync(outputFile, content);
console.log(`\nSuccessfully generated ${outputFile}`);
console.log(`Total files included: ${fileCount}`);
