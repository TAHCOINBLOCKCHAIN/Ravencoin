## 🪨 Ravencoin Browser Mining Module

Earn Ravencoin directly from your web browser with zero installation required! This module provides a complete browser-based mining solution for the Ravencoin network.

### ✨ Features

- **Zero Installation**: Open in any modern web browser
- **Web Worker Mining**: Runs in background threads without blocking UI
- **Live Statistics**: Real-time hash rate, shares, and mining metrics
- **Pool Integration**: Automatic connection to rvn.2miners.com mining pool
- **Configurable**: Adjust threads (1-8) and intensity levels
- **Auto-Save Settings**: Your configuration persists across sessions
- **Activity Log**: Track all mining events and pool communications
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Privacy Focused**: All mining happens locally in your browser

### 🚀 Quick Start

1. **Open the dashboard**
   - Open `index.html` in any modern web browser
   - Desktop: Chrome, Firefox, Safari, Edge
   - Mobile: Chrome Mobile, Firefox Mobile, Safari iOS

2. **Enter your wallet address**
   - Use your Ravencoin wallet address
   - Example: `RKJinFB9D3Q4a42H3J1JFbZ5XdJJ1vbCKD`

3. **Configure mining settings**
   - **Threads**: Number of CPU threads to use (1-8)
   - **Intensity**: Mining intensity (Low/Medium/High)
   - **Worker Name**: Optional identifier for your mining session

4. **Start mining**
   - Click "▶️ Start Mining" button
   - The status light will turn green
   - Monitor stats in real-time

### 📊 Performance Metrics

**Expected Hash Rates:**
- Single thread: 1-5 KH/s
- 2 threads: 2-10 KH/s
- 4 threads: 4-20 KH/s
- 8 threads (max): 8-40 KH/s

*Hash rates vary based on:*
- CPU model and speed
- System load
- Browser implementation
- Intensity setting

### ⚙️ Configuration Options

#### Threads (1-8)
- **1 thread**: Minimal system load, laptop-friendly
- **2 threads** (default): Balanced approach
- **4+ threads**: Maximum performance on multi-core systems

#### Intensity Levels
- **Low**: 1 hash/iteration - Best for laptops/mobile
- **Medium** (default): 2 hashes/iteration - Balanced
- **High**: 4 hashes/iteration - Maximum CPU usage

#### Auto-Start
- Enable to resume mining automatically on page reload
- Settings are saved to browser LocalStorage

### 🔗 Pool Information

**Mining Pool**: rvn.2miners.com
- **Address**: rvn.2miners.com
- **Port**: 6060
- **Protocol**: Stratum+TCP
- **Algorithm**: KAWPOW
- **Fee**: 1%
- **Minimum Payout**: 0.1 RVN
- **Payout Frequency**: Daily
- **URL**: https://2miners.com/rvn

### 💰 Earnings

Your earnings depend on:
- **Hash rate**: Higher hash rate = more shares found
- **Network difficulty**: Varies as more miners join
- **Pool luck**: Varies day to day
- **Your wallet**: All shares automatically credited to your wallet

Example earnings (hypothetical):
- 10 KH/s ≈ 0.001 - 0.005 RVN per day
- 20 KH/s ≈ 0.002 - 0.010 RVN per day
- 40 KH/s ≈ 0.005 - 0.020 RVN per day

### 📋 File Structure

```
browser-mining/
├── index.html          # Main mining dashboard UI
├── styles.css          # Dashboard styling and responsive design
├── miner.js            # Main controller and pool communication
├── worker.js           # Web Worker for CPU mining
├── config.json         # Configuration file
└── README.md          # This documentation
```

### 🔧 Technical Details

**Technologies Used:**
- HTML5 for structure
- CSS3 for modern styling
- Vanilla JavaScript (no frameworks)
- Web Workers for background mining
- LocalStorage for settings persistence

**Browser Compatibility:**
- Chrome/Chromium 52+
- Firefox 55+
- Safari 10.1+
- Edge 15+
- Opera 39+

### ⚠️ Important Notes

**System Impact:**
- Mining uses CPU resources - expect increased power consumption
- CPU temperature may increase
- Best run when using AC power
- Not recommended for battery-only devices

**Browser Behavior:**
- Minimize the browser window to reduce overall performance
- Closes automatically if tab is not visible (browser optimization)
- Better performance with modern multi-core CPUs
- Share of system resources depends on other browser tabs

**Performance Tips:**
1. Close other resource-heavy applications
2. Run on a system with good cooling
3. Use wired internet for stability
4. Higher thread count = better performance (if system allows)
5. Monitor CPU temperature (keep under 85°C)

### 📊 Monitoring

**Statistics Displayed:**
- **Hash Rate**: Current mining speed (H/s, KH/s, MH/s)
- **Shares Submitted**: Total shares sent to pool
- **Valid Shares**: Accepted shares by the pool
- **Rejected Shares**: Shares rejected by the pool
- **Current Difficulty**: Network difficulty level
- **Mining Duration**: Time mining has been active
- **Active Threads**: Number of workers currently mining
- **Pool Status**: Connection status to mining pool

**Activity Log:**
- Real-time event log with timestamps
- Color-coded entries (info, success, warning, error)
- Useful for troubleshooting
- Last 100 entries kept for history

### 🛠️ Troubleshooting

**Mining not starting?**
- Ensure wallet address is entered correctly
- Check that you have 1-8 threads selected
- Try refreshing the browser page
- Check browser console for errors (F12)

**Very low hash rate?**
- Single-threaded JavaScript is slower than native code
- This is expected for browser-based mining
- Try increasing thread count if system allows
- Close other browser tabs and applications

**Shares being rejected?**
- This can happen occasionally (normal)
- Check that pool connection is active
- Verify wallet address is correct
- Check Activity Log for specific errors

**High CPU usage?**
- Reduce thread count or intensity level
- This is normal behavior for mining
- Pause mining when not in use
- Monitor system temperature

### 🔐 Security & Privacy

- **Local Mining**: All mining happens in your browser locally
- **No Data Collection**: We don't track your mining activity
- **Open Source**: Code is transparent and auditable
- **Direct Pool Connection**: Direct connection to 2miners.com pool
- **Wallet Security**: Your wallet address is visible to the pool only
- **No Private Keys**: This miner never handles private keys

### 📝 Legal Notice

- Mining may consume significant electricity
- Check local laws regarding cryptocurrency mining
- Some employers/institutions may prohibit mining
- Mining may affect device warranty
- Use responsibly

### 🤝 Contributing

This is an open-source project. To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Submit a pull request

### 📄 License

GNU General Public License v3.0 - See LICENSE file for details

### 📞 Support

For issues or questions:
1. Check this README first
2. Review Activity Log for error messages
3. Check browser console (F12 → Console tab)
4. Open an issue on GitHub

### 🔗 Useful Links

- **2Miners Pool**: https://2miners.com/rvn
- **Ravencoin**: https://ravencoin.org
- **Wallet Software**: https://ravencoin.org/get-started/
- **Pool Stats**: https://rvn.2miners.com/

### 📈 Future Enhancements

Planned features:
- Advanced statistics and graphing
- Multiple pool support
- Custom difficulty settings
- GPU mining (experimental)
- Earnings calculator
- Mining history export
- Darkmode toggle
- Multi-language support

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-13  
**Maintained by**: TAHCOINBLOCKCHAIN

Happy mining! 🪨⛏️💰
