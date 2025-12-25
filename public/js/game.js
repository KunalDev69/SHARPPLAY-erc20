// Tap Reaction Game Engine
class TapReactionGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 800;
    this.height = 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game state
    this.score = 0;
    this.bestScore = 0;
    this.gameActive = false;
    this.gameStartTime = null;
    this.gameEndTime = null;
    this.targets = [];
    this.targetSpawnRate = 1000; // ms
    this.targetLifetime = 2000; // ms
    this.lastSpawn = 0;
    this.missedTargets = 0;
    this.maxMissed = 10;

    // Colors
    this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

    // Event listeners
    this.canvas.addEventListener('click', this.handleClick.bind(this));

    // Load best score
    this.loadBestScore();
  }

  start() {
    this.score = 0;
    this.missedTargets = 0;
    this.targets = [];
    this.gameActive = true;
    this.gameStartTime = Date.now();
    this.lastSpawn = Date.now();
    this.targetSpawnRate = 1000;

    this.gameLoop();
  }

  gameLoop() {
    if (!this.gameActive) return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    const now = Date.now();

    // Spawn new targets
    if (now - this.lastSpawn > this.targetSpawnRate) {
      this.spawnTarget();
      this.lastSpawn = now;

      // Increase difficulty over time
      if (this.targetSpawnRate > 400) {
        this.targetSpawnRate -= 10;
      }
    }

    // Update targets
    this.targets = this.targets.filter(target => {
      target.age = now - target.spawnTime;

      // Remove expired targets
      if (target.age > this.targetLifetime) {
        this.missedTargets++;
        if (this.missedTargets >= this.maxMissed) {
          this.endGame();
        }
        return false;
      }
      return true;
    });

    // Update UI
    this.updateUI();
  }

  spawnTarget() {
    const radius = 30 + Math.random() * 20;
    const target = {
      x: radius + Math.random() * (this.width - radius * 2),
      y: radius + Math.random() * (this.height - radius * 2),
      radius: radius,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      spawnTime: Date.now(),
      age: 0
    };
    this.targets.push(target);
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw targets
    this.targets.forEach(target => {
      const alpha = 1 - (target.age / this.targetLifetime);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;

      // Draw circle
      this.ctx.fillStyle = target.color;
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw ring
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    });

    // Draw game over warning
    if (this.missedTargets > this.maxMissed / 2) {
      this.ctx.fillStyle = '#ff4444';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Missed: ${this.missedTargets}/${this.maxMissed}`, this.width / 2, 30);
    }
  }

  handleClick(event) {
    if (!this.gameActive) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on target
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      const distance = Math.sqrt(
        Math.pow(x - target.x, 2) + Math.pow(y - target.y, 2)
      );

      if (distance < target.radius) {
        // Hit!
        const points = Math.ceil(10 * (1 - target.age / this.targetLifetime));
        this.score += points;
        this.targets.splice(i, 1);
        this.playHitEffect(target.x, target.y);
        break;
      }
    }
  }

  playHitEffect(x, y) {
    // Visual feedback for hit
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.globalAlpha = 0.8;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 50, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  endGame() {
    this.gameActive = false;
    this.gameEndTime = Date.now();

    // Update best score
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBestScore();
    }

    // Show game over panel
    this.showGameOver();
  }

  updateUI() {
    document.getElementById('currentScore').textContent = this.score;
    document.getElementById('bestScore').textContent = this.bestScore;

    // Update timer
    if (this.gameStartTime) {
      const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
      document.getElementById('timer').textContent = elapsed + 's';
    }
  }

  showGameOver() {
    const panel = document.getElementById('gameOverPanel');
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalBestScore').textContent = this.bestScore;

    const playDuration = Math.floor((this.gameEndTime - this.gameStartTime) / 1000);
    document.getElementById('playDuration').textContent = playDuration + 's';

    panel.style.display = 'flex';
  }

  saveBestScore() {
    localStorage.setItem('bestScore', this.bestScore);
  }

  loadBestScore() {
    const saved = localStorage.getItem('bestScore');
    this.bestScore = saved ? parseInt(saved) : 0;
  }

  getPlayDuration() {
    if (this.gameStartTime && this.gameEndTime) {
      return Math.floor((this.gameEndTime - this.gameStartTime) / 1000);
    }
    return 0;
  }
}

// Initialize game when DOM is ready
let game = null;

function initGame() {
  game = new TapReactionGame('gameCanvas');
}

function startGame() {
  if (!requireAuth()) return;

  document.getElementById('gameOverPanel').style.display = 'none';
  game.start();
}

async function submitScore() {
  if (typeof currentUser === 'undefined' || !currentUser) {
    alert('Please sign in to submit your score');
    showLoginModal();
    return;
  }

  const submitBtn = document.getElementById('submitScoreBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const playDuration = game.getPlayDuration();

    // Call Firebase Cloud Function to submit score and handle token transfer
    const submitScoreFunction = firebase.functions().httpsCallable('submitScore');
    const result = await submitScoreFunction({
      score: game.score,
      playDuration: playDuration,
      timestamp: Date.now(),
      gameType: 'tap-reaction',
      difficulty: 'medium'
    });

    const data = result.data;
    
    // Show success message
    let message = `🎉 Score Submitted!\n\nScore: ${game.score}\nReward: ${data.reward.toFixed(2)} SHARP\n`;
    
    if (data.newBestScore) {
      message += `\n🏆 New Best Score!`;
    }
    
    if (data.dailyStreak > 0) {
      message += `\n🔥 Daily Streak: ${data.dailyStreak} days`;
    }

    // Check if wallet is connected and show transaction info
    if (data.txHash) {
      message += `\n\n✅ Tokens transferred to your wallet!`;
      
      // Show transaction popup with Etherscan link
      showTransactionPopup(data.txHash, data.reward, data.blockExplorer);
      
      alert(message);
    } else if (data.walletAddress) {
      message += `\n\n⏳ Token transfer pending...`;
      alert(message);
    } else {
      message += `\n\n💡 Connect your wallet to receive tokens automatically!`;
      alert(message);
    }

    // Close game over panel
    document.getElementById('gameOverPanel').style.display = 'none';

  } catch (error) {
    console.error('Error submitting score:', error);
    
    // Handle specific error messages
    if (error.message && error.message.includes('unauthenticated')) {
      alert('❌ Please sign in to submit your score.');
      showLoginModal();
    } else if (error.message && error.message.includes('failed-precondition')) {
      alert('❌ ' + error.message);
    } else {
      alert('❌ Failed to submit score. Please try again.\n\nError: ' + (error.message || 'Unknown error'));
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Score';
  }
}

function showTransactionPopup(txHash, reward, blockExplorer) {
  // Remove any existing transaction popup
  const existingPopup = document.querySelector('.transaction-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.className = 'transaction-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(36, 45, 66, 0.98) 0%, rgba(30, 37, 54, 0.98) 100%);
    backdrop-filter: blur(20px);
    border: 2px solid #F6851B;
    border-radius: 20px;
    padding: 2rem;
    z-index: 10000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
    min-width: 320px;
    max-width: 90%;
    text-align: center;
  `;
  
  const explorerUrl = blockExplorer || `https://sepolia.etherscan.io/tx/${txHash}`;
  const shortTxHash = `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`;
  
  popup.innerHTML = `
    <div class="popup-content">
      <h3 style="color: #28C76F; margin-bottom: 1rem; font-size: 1.5rem;">🎉 Tokens Sent!</h3>
      <p style="color: #fff; font-size: 1.2rem; margin-bottom: 1rem;">
        Earned: <strong style="color: #F6851B;">${reward.toFixed(2)} SHARP</strong>
      </p>
      <p style="color: #B8C0D4; font-size: 0.9rem; margin-bottom: 1rem;">
        Transaction: <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">${shortTxHash}</code>
      </p>
      <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" 
         style="display: inline-block; background: linear-gradient(135deg, #F6851B 0%, #E91E63 100%); 
                color: white; padding: 0.75rem 1.5rem; border-radius: 12px; text-decoration: none; 
                margin: 0.5rem; font-weight: 600; transition: all 0.3s;">
        View on Etherscan
      </a>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="display: inline-block; background: rgba(255,255,255,0.1); color: white; 
                     padding: 0.75rem 1.5rem; border: 1px solid rgba(255,255,255,0.2); 
                     border-radius: 12px; margin: 0.5rem; cursor: pointer; font-weight: 600;
                     transition: all 0.3s;">
        Close
      </button>
    </div>
  `;
  
  document.body.appendChild(popup);

  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (popup.parentElement) {
      popup.remove();
    }
  }, 15000);
}

function showRewardPopup(data) {
  const popup = document.getElementById('rewardPopup');
  document.getElementById('rewardAmount').textContent = data.reward.toFixed(2);
  document.getElementById('rewardStreak').textContent = data.dailyStreak;

  if (data.txHash) {
    document.getElementById('rewardTxHash').textContent = data.txHash;
    document.getElementById('rewardTxHash').href = `https://etherscan.io/tx/${data.txHash}`;
  } else {
    document.getElementById('rewardTxHash').textContent = 'Pending...';
  }

  popup.style.display = 'flex';
}

function closeRewardPopup() {
  document.getElementById('rewardPopup').style.display = 'none';
}
