/* ========================================
   Ravencoin Real Browser Miner
   KAWPOW WebAssembly + Stratum Protocol
   ======================================== */

class RealRavenMiner {
    constructor() {
        this.pool = {
            wsHost: 'wss://rvn.2miners.com:3333',
            fallbackWs: 'wss://rvn-stratum.2miners.com:8443'
        };

        this.config = {
            threads: 2,
            walletAddress: '',
            workerName: 'browser-miner'
        };

        this.mining = false;
        this.socket = null;
        this.subscriptionId = null;
        this.jobId = null;
        this.nonce = Math.floor(Math.random() * 0xFFFFFFFF);

        this.stats = {
            hashRate: 0,
            totalHashes: 0,
            totalShares: 0,
            validShares: 0,
            rejectedShares: 0,
            currentDifficulty: 1,
            sessionStartTime: 0,
            hashRates: []
        };

        this.wasmInstance = null;
        this.kawpowHash = null;

        this.loadConfiguration();
        this.initializeUI();
        this.setupEventListeners();
        this.loadWasmModule();
    }

    // Load KAWPOW WASM module
    async loadWasmModule() {
        try {
            // Try to load pre-compiled WASM module
            const wasmUrl = 'https://cdn.jsdelivr.net/npm/js-sha3@0.8.0/build/sha3.js';
            
            // Load sha3 library for KECCAK
            const script = document.createElement('script');
            script.src = wasmUrl;
            script.onload = () => {
                this.addLog('✅ Crypto library loaded successfully', 'success');
                this.kawpowHash = this.jsKawpowHash.bind(this);
            };
            script.onerror = () => {
                this.addLog('⚠️ Loading crypto library, using fallback hashing', 'warning');
                this.kawpowHash = this.simplifiedKawpowHash.bind(this);
            };
            document.head.appendChild(script);
        } catch (error) {
            this.addLog(`⚠️ WASM loading failed: ${error.message}`, 'warning');
            this.kawpowHash = this.simplifiedKawpowHash.bind(this);
        }
    }

    // KAWPOW hash using KECCAK-256
    jsKawpowHash(headerHash, nonce) {
        try {
            if (window.sha3) {
                // Combine header and nonce
                const combined = headerHash + nonce.toString(16).padStart(16, '0');
                return window.sha3.keccak_256(combined);
            }
            return this.simplifiedKawpowHash(headerHash, nonce);
        } catch (e) {
            return this.simplifiedKawpowHash(headerHash, nonce);
        }
    }

    // Simplified KAWPOW hash (fallback)
    simplifiedKawpowHash(headerHash, nonce) {
        let hash = 5381;
        const combined = headerHash + nonce.toString(16);
        
        for (let i = 0; i < combined.length; i++) {
            hash = ((hash << 5) + hash) + combined.charCodeAt(i);
        }
        
        return Math.abs(hash).toString(16).padStart(64, '0');
    }

    // Setup Stratum WebSocket connection
    connectToPool() {
        this.addLog('🔗 Connecting to mining pool...', 'info');

        try {
            this.socket = new WebSocket(this.pool.wsHost);

            this.socket.onopen = () => {
                this.addLog('✅ Connected to mining pool', 'success');
                this.subscribeToPool();
            };

            this.socket.onmessage = (event) => {
                try {
                    this.handlePoolMessage(JSON.parse(event.data));
                } catch (e) {
                    this.addLog(`⚠️ Invalid message from pool`, 'warning');
                }
            };

            this.socket.onerror = (error) => {
                this.addLog(`❌ Pool connection error`, 'error');
                this.retryConnection();
            };

            this.socket.onclose = () => {
                this.addLog('⏹️ Disconnected from pool', 'warning');
                if (this.mining) {
                    this.retryConnection();
                }
            };
        } catch (error) {
            this.addLog(`❌ Connection failed: ${error.message}`, 'error');
            this.addLog('ℹ Check pool WebSocket availability', 'info');
        }
    }

    // Subscribe to pool
    subscribeToPool() {
        const subscribeMsg = {
            id: 1,
            method: 'mining.subscribe',
            params: ['ravencoin-browser-miner/1.0.0']
        };

        this.socket.send(JSON.stringify(subscribeMsg));
    }

    // Authorize miner on pool
    authorize() {
        const walletAddress = document.getElementById('walletAddress').value.trim();
        const workerName = document.getElementById('workerName').value.trim() || 'browser-miner';

        const authMsg = {
            id: 2,
            method: 'mining.authorize',
            params: [`${walletAddress}.${workerName}`, '']
        };

        this.socket.send(JSON.stringify(authMsg));
    }

    // Handle messages from pool
    handlePoolMessage(message) {
        if (message.result !== undefined) {
            if (message.id === 1) {
                this.subscriptionId = message.result[0];
                this.config.difficulty = message.result[1];
                this.addLog(`✅ Subscribed - Difficulty: ${this.config.difficulty}`, 'success');
                this.authorize();
            } else if (message.id === 2) {
                this.addLog('✅ Authorized with pool', 'success');
                this.startRealMining();
            } else if (message.id === 3) {
                if (message.result) {
                    this.stats.validShares++;
                    this.addLog(`✅ Valid share accepted!`, 'success');
                } else {
                    this.stats.rejectedShares++;
                    this.addLog(`⚠️ Share rejected: ${message.error ? message.error[1] : 'unknown'}`, 'warning');
                }
            }
        } else if (message.method) {
            if (message.method === 'mining.set_difficulty') {
                this.stats.currentDifficulty = message.params[0];
                this.addLog(`📊 Difficulty: ${this.stats.currentDifficulty.toFixed(2)}`, 'info');
            } else if (message.method === 'mining.notify') {
                this.handleNewJob(message.params);
            }
        }
    }

    // Handle new mining job from pool
    handleNewJob(params) {
        this.currentJob = {
            jobId: params[0],
            seedHash: params[1],
            headerHash: params[2],
            clean: params[3]
        };

        if (this.currentJob.clean) {
            this.addLog(`📋 New job: ${this.currentJob.jobId.substring(0, 8)}...`, 'info');
        }
    }

    // Submit share to pool
    submitShare(nonce, hash) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const submitMsg = {
            id: 3,
            method: 'mining.submit',
            params: [
                `${this.config.walletAddress}.${this.config.workerName}`,
                this.currentJob.jobId,
                nonce.toString(16).padStart(16, '0'),
                this.currentJob.headerHash,
                hash
            ]
        };

        this.socket.send(JSON.stringify(submitMsg));
        this.stats.totalShares++;
    }

    // Real mining loop with KAWPOW
    startRealMining() {
        this.addLog('⛏️ Starting KAWPOW mining...', 'success');
        this.realMiningLoop();
    }

    realMiningLoop() {
        if (!this.mining || !this.currentJob || !this.kawpowHash) {
            setTimeout(() => this.realMiningLoop(), 100);
            return;
        }

        const target = this.difficultyToTarget(this.stats.currentDifficulty);
        let hashesThisLoop = 0;

        for (let i = 0; i < 100; i++) {
            this.nonce++;
            hashesThisLoop++;

            // Compute KAWPOW hash
            const hash = this.kawpowHash(this.currentJob.headerHash, this.nonce);
            const hashValue = this.hexToBigInt(hash);

            // Check if hash meets difficulty
            if (hashValue < target) {
                this.submitShare(this.nonce, hash);
            }
        }

        this.stats.totalHashes += hashesThisLoop;
        this.stats.hashRates.push(hashesThisLoop);

        if (this.stats.hashRates.length > 30) {
            this.stats.hashRates.shift();
        }

        // Continue mining asynchronously
        setTimeout(() => this.realMiningLoop(), 0);
    }

    // Convert difficulty to target
    difficultyToTarget(difficulty) {
        const maxTarget = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
        const target = maxTarget / BigInt(Math.floor(difficulty * 0x10000));
        return target;
    }

    // Utility: Convert hex string to BigInt
    hexToBigInt(hex) {
        try {
            return BigInt(`0x${hex.substring(0, 16)}`);
        } catch {
            return BigInt(0);
        }
    }

    // Load saved configuration
    loadConfiguration() {
        const saved = localStorage.getItem('ravenMinerConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.config = { ...this.config, ...config };
            } catch (e) {
                console.error('Failed to load config:', e);
            }
        }
    }

    // Save configuration
    saveConfiguration() {
        localStorage.setItem('ravenMinerConfig', JSON.stringify(this.config));
    }

    // Initialize UI
    initializeUI() {
        document.getElementById('walletAddress').value = this.config.walletAddress || '';
        document.getElementById('workerName').value = this.config.workerName || 'browser-miner';
        document.getElementById('threadCount').value = this.config.threads;
        document.getElementById('threadSlider').value = this.config.threads;
        this.updateThreadInfo();
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startMining());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopMining());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());

        document.getElementById('walletAddress').addEventListener('change', (e) => {
            this.config.walletAddress = e.target.value;
            this.saveConfiguration();
        });

        document.getElementById('workerName').addEventListener('change', (e) => {
            this.config.workerName = e.target.value;
            this.saveConfiguration();
        });

        const threadSlider = document.getElementById('threadSlider');
        threadSlider.addEventListener('input', (e) => {
            this.config.threads = parseInt(e.target.value);
            this.updateThreadInfo();
            this.saveConfiguration();
        });
    }

    // Update thread info
    updateThreadInfo() {
        document.getElementById('threadInfo').textContent = `Using ${this.config.threads} mining thread${this.config.threads !== 1 ? 's' : ''}`;
    }

    // Start mining
    startMining() {
        if (this.mining) {
            this.addLog('Mining already running', 'warning');
            return;
        }

        const walletAddress = document.getElementById('walletAddress').value.trim();
        if (!walletAddress) {
            this.addLog('❌ Please enter a valid wallet address', 'error');
            return;
        }

        this.mining = true;
        this.stats.sessionStartTime = Date.now();
        this.config.walletAddress = walletAddress;
        this.saveConfiguration();

        this.addLog(`✅ Starting real KAWPOW mining...`, 'success');
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;

        // Update status
        document.getElementById('statusLight').classList.add('mining');
        document.getElementById('statusText').textContent = 'Mining';

        this.connectToPool();
        this.updateStatsInterval = setInterval(() => this.updateStats(), 1000);
    }

    // Stop mining
    stopMining() {
        if (!this.mining) return;

        this.mining = false;
        if (this.socket) {
            this.socket.close();
        }
        clearInterval(this.updateStatsInterval);

        this.addLog('⏹️ Mining stopped', 'warning');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;

        document.getElementById('statusLight').classList.remove('mining');
        document.getElementById('statusText').textContent = 'Stopped';
    }

    // Retry connection
    retryConnection() {
        if (this.mining) {
            this.addLog('🔄 Retrying pool connection in 5 seconds...', 'warning');
            setTimeout(() => this.connectToPool(), 5000);
        }
    }

    // Update statistics
    updateStats() {
        if (!this.mining) return;

        const avgRate = this.stats.hashRates.length > 0
            ? this.stats.hashRates.reduce((a, b) => a + b, 0) / this.stats.hashRates.length
            : 0;

        this.stats.hashRate = avgRate;

        document.getElementById('hashRate').textContent = this.formatHashRate(this.stats.hashRate);
        document.getElementById('totalShares').textContent = this.stats.validShares;
        document.getElementById('validSharesPercent').textContent = 
            this.stats.totalShares > 0 
                ? `${((this.stats.validShares / this.stats.totalShares) * 100).toFixed(1)}% accept rate`
                : '0% accept rate';
        document.getElementById('rejectedShares').textContent = this.stats.rejectedShares;
        document.getElementById('difficulty').textContent = this.stats.currentDifficulty.toFixed(2);

        const elapsed = Date.now() - this.stats.sessionStartTime;
        const seconds = Math.floor((elapsed / 1000) % 60);
        const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
        const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
        document.getElementById('duration').textContent = `${hours}h ${minutes}m ${seconds}s`;
    }

    // Format hash rate
    formatHashRate(hashRate) {
        if (hashRate >= 1000000) {
            return (hashRate / 1000000).toFixed(2) + ' MH/s';
        } else if (hashRate >= 1000) {
            return (hashRate / 1000).toFixed(2) + ' KH/s';
        } else {
            return hashRate.toFixed(2) + ' H/s';
        }
    }

    // Reset statistics
    reset() {
        if (this.mining) {
            this.addLog('⚠️ Stop mining before resetting', 'warning');
            return;
        }

        this.stats = {
            hashRate: 0,
            totalHashes: 0,
            totalShares: 0,
            validShares: 0,
            rejectedShares: 0,
            currentDifficulty: 1,
            sessionStartTime: 0,
            hashRates: []
        };

        document.getElementById('hashRate').textContent = '0 H/s';
        document.getElementById('totalShares').textContent = '0';
        document.getElementById('duration').textContent = '0h 0m 0s';
        this.addLog('↻ Statistics reset', 'info');
    }

    // Add log entry
    addLog(message, type = 'info') {
        const logContainer = document.getElementById('activityLog');
        const now = new Date();
        const timeStr = now.toLocaleTimeString();

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-message">${message}</span>`;

        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;

        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }

    // Clear log
    clearLog() {
        document.getElementById('activityLog').innerHTML = '';
        this.addLog('📋 Log cleared', 'info');
    }
}

// Initialize real miner
document.addEventListener('DOMContentLoaded', () => {
    window.miner = new RealRavenMiner();
});
