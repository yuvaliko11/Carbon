const variations = [
    "Lease No 4160.pdf",
    "lease no 4160.pdf",
    "Lease_No_4160.pdf",
    "LeaseNo4160.pdf",
    "4160.pdf",
    "Lease 4160.pdf"
];

variations.forEach(v => {
    const filename = v.toLowerCase();
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
        hash = filename.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hashLeaseNumber = `L-${Math.abs(hash) % 10000}`;

    // Improved Regex
    const leaseNumberMatch = filename.match(/lease[._\-\s]*(?:no\.?|number)?[._\-\s]*(\d+)/i);
    const extractedLeaseNumber = leaseNumberMatch ? leaseNumberMatch[1] : null;

    console.log(`"${v}" -> Hash: ${hashLeaseNumber}, Extracted: ${extractedLeaseNumber}`);
});
