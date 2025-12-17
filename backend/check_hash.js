const filename = "Lease No 4160.pdf".toLowerCase();
let hash = 0;
for (let i = 0; i < filename.length; i++) {
    hash = filename.charCodeAt(i) + ((hash << 5) - hash);
}
const mockRent = 1000 + (Math.abs(hash) % 4000);
console.log(`Filename: ${filename}`);
console.log(`Hash: ${hash}`);
console.log(`Mock Rent: ${mockRent}`);
