/* ===========================
   Ravencoin Browser Miner - Main Controller
   =========================== */

class RavenMiner {
    constructor() {
        this.pool = {
            host: 'rvn.2miners.com',
            port: 6060,
            protocol: 'stratum+tcp'
        };
        
        this.config = {
            threads: 2,
            intensity: 'medium',
            walletAddress: '',
            workerName: 'browser-miner'
        };

        this.stats = {
            hashRate: 0,
            avgHashRate: 0,
            totalHashes: 0,
            totalShares: 0,
            validShares: 0,
            rejectedShares: 0,
            difficulty: 1,
            miningDuration: 0,
            sessionStartTime: 0,
            hashRates: []
        };

        this.mining = false;
        this.workers = [];
        this.updateInterval = null;
        
        this.loadConfiguration();
        this.initializeUI();
        this.setupEventListeners();
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

    // Initialize UI with saved values
    initializeUI() {
        const walletInput = document.getElementById('walletAddress');
        const workerInput = document.getElementById('workerName');
        const threadCount = document.getElementById('threadCount');
        const threadSlider = document.getElementById('threadSlider');
        const autoStart = document.getElementById('autoStart');

        walletInput.value = this.config.walletAddress || '';
        workerInput.value = this.config.workerName || 'browser-miner';
        threadCount.value = this.config.threads;
        threadSlider.value = this.config.threads;

        // Set intensity
        document.querySelectorAll('.intensity-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.intensity === this.config.intensity);
        });

        this.updateThreadInfo();

        // Auto-start if enabled
        if (autoStart.checked && this.config.walletAddress) {
            setTimeout(() => this.startMining(), 500);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startMining());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopMining());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());

        // Configuration
        document.getElementById('walletAddress').addEventListener('change', (e) => {
            this.config.walletAddress = e.target.value;
            this.saveConfiguration();
        });

        document.getElementById('workerName').addEventListener('change', (e) => {
            this.config.workerName = e.target.value;
            this.saveConfiguration();
        });

        // Thread count
        const threadCount = document.getElementById('threadCount');
        const threadSlider = document.getElementById('threadSlider');

        threadSlider.addEventListener('input', (e) => {
            threadCount.value = e.target.value;
            this.config.threads = parseInt(e.target.value);
            this.updateThreadInfo();
            this.saveConfiguration();
        });

        threadCount.addEventListener('change', (e) => {
            const value = Math.max(1, Math.min(8, parseInt(e.target.value) || 1));
            e.target.value = value;
            threadSlider.value = value;
            this.config.threads = value;
            this.updateThreadInfo();
            this.saveConfiguration();
        });

        // Intensity
        document.querySelectorAll('.intensity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.intensity = btn.dataset.intensity;
                this.updateIntensityInfo();
                this.saveConfiguration();
            });
        });

        // Auto-start
        document.getElementById('autoStart').addEventListener('change', (e) => {
            const config = JSON.parse(localStorage.getItem('ravenMinerConfig') || '{}');
            config.autoStart = e.target.checked;
            localStorage.setItem('ravenMinerConfig', JSON.stringify(config));
        });
    }

    // Update thread info
    updateThreadInfo() {
        const threads = this.config.threads;
        const threadInfo = document.getElementById('threadInfo');
        threadInfo.textContent = `Using ${threads} CPU thread${threads !== 1 ? 's' : ''}`;
    }

    // Update intensity info
    updateIntensityInfo() {
        const intensities = {
            low: 'Minimal CPU usage, laptop friendly',
            medium: 'Balanced performance and efficiency',
            high: 'Maximum performance, high CPU usage'
        };
        document.getElementById('intensityInfo').textContent = intensities[this.config.intensity];
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
        this.stats.hashRates = [];

        this.updateButton();
        this.addLog(`✅ Mining started with ${this.config.threads} thread${this.config.threads !== 1 ? 's' : ''}`, 'success');
        this.addLog(`🎯 Pool: ${this.pool.host}:${this.pool.port}`, 'info');
        this.addLog(`💰 Wallet: ${walletAddress}`, 'info');

        // Update status
        const statusLight = document.getElementById('statusLight');
        const statusText = document.getElementById('statusText');
        statusLight.classList.remove('online');
        statusLight.classList.add('mining');
        statusText.textContent = 'Mining';

        // Create workers
        this.createWorkers();

        // Start stats update
        this.updateInterval = setInterval(() => this.updateStats(), 1000);
        setInterval(() => this.updateDuration(), 1000);

        // Simulate pool connection
        setTimeout(() => {
            const poolIndicator = document.querySelector('.pool-indicator');
            poolIndicator.classList.remove('offline');
            poolIndicator.classList.add('online');
            document.getElementById('poolStatus').innerHTML = '<span class="pool-indicator online">●</span> Connected';
            this.addLog('🔗 Connected to mining pool', 'success');
        }, 500);
    }

    // Create Web Workers
    createWorkers() {
        const intensityMap = { low: 1, medium: 2, high: 4 };
        const difficulty = intensityMap[this.config.intensity];

        for (let i = 0; i < this.config.threads; i++) {
            const worker = new Worker('worker.js');

            worker.onmessage = (event) => {
                if (event.data.type === 'hashrate') {
                    this.stats.totalHashes += event.data.totalHashes;
                    this.stats.hashRates.push(event.data.hashrate);
                } else if (event.data.type === 'share') {
                    this.submitShare(event.data);
                }
            };

            worker.onerror = (error) => {
                this.addLog(`❌ Worker error: ${error.message}`, 'error');
            };

            worker.postMessage({
                command: 'start',
                intensity: difficulty,
                difficulty: this.stats.difficulty
            });

            this.workers.push(worker);
        }
    }

    // Submit share to pool
    submitShare(share) {
        this.stats.totalShares++;
        
        // Simulate validation (90% success rate)
        if (Math.random() > 0.1) {
            this.stats.validShares++;
            this.addLog(`✅ Valid share accepted (${this.stats.validShares})`, 'success');
        } else {
            this.stats.rejectedShares++;
            this.addLog(`⚠️ Share rejected by pool`, 'warning');
        }
    }

    // Update statistics
    updateStats() {
        if (!this.mining || this.stats.hashRates.length === 0) return;

        // Calculate hash rate
        const avgRate = this.stats.hashRates.reduce((a, b) => a + b, 0) / this.stats.hashRates.length;
        this.stats.hashRate = avgRate;
        this.stats.hashRates = this.stats.hashRates.slice(-10); // Keep last 10 measurements

        // Update UI
        document.getElementById('hashRate').textContent = this.formatHashRate(this.stats.hashRate);
        document.getElementById('totalShares').textContent = this.stats.totalShares;
        document.getElementById('validShares').textContent = this.stats.validShares;
        
        const acceptRate = this.stats.totalShares > 0 
            ? ((this.stats.validShares / this.stats.totalShares) * 100).toFixed(1)
            : 0;
        document.getElementById('validSharesPercent').textContent = `${acceptRate}% accept rate`;

        document.getElementById('rejectedShares').textContent = this.stats.rejectedShares;
        const rejectionRate = this.stats.totalShares > 0
            ? ((this.stats.rejectedShares / this.stats.totalShares) * 100).toFixed(1)
            : 0;
        document.getElementById('rejectionRate').textContent = `${rejectionRate}% rejection rate`;

        document.getElementById('difficulty').textContent = this.stats.difficulty.toFixed(2);
        document.getElementById('activeThreads').textContent = this.config.threads;
        
        const cpuLoad = ((this.config.threads / 8) * 100).toFixed(0);
        document.getElementById('threadLoad').textContent = `${cpuLoad}% estimated CPU load`;
    }

    // Update mining duration
    updateDuration() {
        if (!this.mining) return;

        const elapsed = Date.now() - this.stats.sessionStartTime;
        const seconds = Math.floor((elapsed / 1000) % 60);
        const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
        const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);

        document.getElementById('duration').textContent = `${hours}h ${minutes}m ${seconds}s`;
    }

    // Stop mining
    stopMining() {
        if (!this.mining) return;

        this.mining = false;
        this.workers.forEach(worker => {
            worker.postMessage({ command: 'stop' });
            worker.terminate();
        });
        this.workers = [];

        clearInterval(this.updateInterval);

        this.updateButton();
        this.addLog('⏹️ Mining stopped', 'warning');

        const statusLight = document.getElementById('statusLight');
        const statusText = document.getElementById('statusText');
        statusLight.classList.remove('mining');
        statusLight.classList.add('online');
        statusText.textContent = 'Stopped';

        const poolIndicator = document.querySelector('.pool-indicator');
        poolIndicator.classList.remove('online');
        poolIndicator.classList.add('offline');
        document.getElementById('poolStatus').innerHTML = '<span class="pool-indicator offline">●</span> Disconnected';
    }

    // Reset statistics
    reset() {
        if (this.mining) {
            this.addLog('⚠️ Stop mining before resetting', 'warning');
            return;
        }

        this.stats = {
            hashRate: 0,
            avgHashRate: 0,
            totalHashes: 0,
            totalShares: 0,
            validShares: 0,
            rejectedShares: 0,
            difficulty: 1,
            miningDuration: 0,
            sessionStartTime: 0,
            hashRates: []
        };

        // Update UI
        document.getElementById('hashRate').textContent = '0 H/s';
        document.getElementById('totalShares').textContent = '0';
        document.getElementById('validShares').textContent = '0';
        document.getElementById('validSharesPercent').textContent = '0% accept rate';
        document.getElementById('rejectedShares').textContent = '0';
        document.getElementById('rejectionRate').textContent = '0% rejection rate';
        document.getElementById('difficulty').textContent = '0';
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

        // Keep only last 100 entries
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

    // Update button states
    updateButton() {
        document.getElementById('startBtn').disabled = this.mining;
        document.getElementById('stopBtn').disabled = !this.mining;
    }

    // Format hash rate with appropriate unit
    formatHashRate(hashRate) {
        if (hashRate >= 1000000) {
            return (hashRate / 1000000).toFixed(2) + ' MH/s';
        } else if (hashRate >= 1000) {
            return (hashRate / 1000).toFixed(2) + ' KH/s';
        } else {
            return hashRate.toFixed(2) + ' H/s';
        }
    }
}

// Initialize miner when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.miner = new RavenMiner();
});
