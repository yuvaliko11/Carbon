const text = `
owned by the YAVUSA NABUKEBUKE(hereinafter called "the Landowning unit") be the area a little
more or less and contained within the boundaries more particularly delineated and marked on the plan
hereto annexed and edge YELLOW (hereinafter called "the Land") EXCEPTING AND RESERVING all
the matters contained in the First Schedule hereto TO HOLD the same unto the lessee from the first
day of July, 2024 for the term of Fifty (50) years YIELDING AND PAYING therefore unto the lessor
the yearly rent of $2,000.00 (Two Thousand Dollars - VEP) and shall be due on the execution
hereof]* subject to reassessment as hereinafter provided.
`;

const rentPatterns = [
    /yearly\s+rent\s+of\s+[\s\S]*?\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /annual\s+rent\s+of\s+[\s\S]*?\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /Yielding\s+and\s+Paying[\s\S]*?\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)\s*per\s*annum/i,
    // New pattern to be added
    /YIELDING\s+AND\s+PAYING[\s\S]*?yearly\s+rent\s+of\s+[\s\S]*?\$?\s*([\d,]+(?:\.\d{2})?)/i
];

console.log("Testing regex patterns...");

for (const pattern of rentPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
        console.log(`Match found with pattern ${pattern}: ${match[1]}`);
    } else {
        console.log(`No match for pattern ${pattern}`);
    }
}
