/* ===========================
   Ravencoin Browser Miner - Web Worker
   Background mining computation
   =========================== */

let isRunning = false;
let difficulty = 1;
let hashRate = 0;
let totalHashes = 0;
let lastTime = Date.now();

// Handle messages from main thread
self.onmessage = function(event) {
    const data = event.data;

    if (data.command === 'start') {
        isRunning = true;
        difficulty = data.difficulty || 1;
        const intensity = data.intensity || 2;
        
        // Start mining loop
        mine(intensity);
    } 
    else if (data.command === 'stop') {
        isRunning = false;
    }
};

// Main mining function
function mine(intensity) {
    let batchSize = 10000 * intensity;
    let lastReport = Date.now();

    function mineLoop() {
        if (!isRunning) return;

        // Perform hashing work
        let batchHashes = 0;
        for (let i = 0; i < batchSize; i++) {
            // Simulated proof-of-work computation
            let nonce = Math.random() * 0xFFFFFFFF >>> 0;
            let hash = simpleHash(nonce.toString() + Math.random());
            
            batchHashes++;
            
            // Random share generation (simulated)
            if (Math.random() < 0.001) {
                self.postMessage({
                    type: 'share',
                    nonce: nonce,
                    hash: hash
                });
            }
        }

        totalHashes += batchHashes;
        const now = Date.now();
        const elapsed = now - lastReport;

        // Report hash rate every 100ms
        if (elapsed >= 100) {
            const hashrate = (batchHashes / (elapsed / 1000)) * (intensity / 2);
            
            self.postMessage({
                type: 'hashrate',
                hashrate: hashrate,
                totalHashes: batchHashes,
                difficulty: difficulty
            });

            lastReport = now;
        }

        // Continue mining asynchronously
        setTimeout(mineLoop, 0);
    }

    mineLoop();
}

// Simple hash function for demonstration
function simpleHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}

// Alternative: More realistic mining simulation
function performMiningWork(nonce, target) {
    let hash = simpleHash(nonce.toString());
    return parseInt(hash.substring(0, 8), 16) < target;
}
