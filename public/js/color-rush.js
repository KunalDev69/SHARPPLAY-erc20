// Color Rush Game
const colors = [
  { name: 'RED', hex: '#EF4444' },
  { name: 'BLUE', hex: '#3B82F6' },
  { name: 'GREEN', hex: '#10B981' },
  { name: 'YELLOW', hex: '#F59E0B' },
  { name: 'PURPLE', hex: '#8B5CF6' },
  { name: 'ORANGE', hex: '#F97316' },
  { name: 'PINK', hex: '#EC4899' },
  { name: 'CYAN', hex: '#06B6D4' }
];

let score = 0;
let level = 1;
let streak = 0;
let bestStreak = 0;
let lives = 3;
let timeLeft = 30;
let currentCorrectColor = null;
let gameActive = false;
let timerInterval = null;
let startTime = null;

function startGame() {
  score = 0;
  level = 1;
  streak = 0;
  bestStreak = 0;
  lives = 3;
  timeLeft = 30;
  gameActive = true;
  startTime = Date.now();
  
  document.getElementById('startBtn').style.display = 'none';
  updateStats();
  updateLives();
  nextRound();
  startTimer();
}

function nextRound() {
  if (!gameActive) return;
  
  // Select random colors
  const textColor = colors[Math.floor(Math.random() * colors.length)];
  const displayColor = colors[Math.floor(Math.random() * colors.length)];
  
  // The correct answer is the text, not the display color
  currentCorrectColor = textColor.name;
  
  // Display the text in a different color
  const colorDisplay = document.getElementById('colorText');
  colorDisplay.textContent = textColor.name;
  colorDisplay.style.color = displayColor.hex;
  
  // Create 4 options
  const options = [textColor];
  while (options.length < 4) {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    if (!options.find(c => c.name === randomColor.name)) {
      options.push(randomColor);
    }
  }
  
  // Shuffle options
  options.sort(() => Math.random() - 0.5);
  
  // Render options
  const optionsContainer = document.getElementById('colorOptions');
  optionsContainer.innerHTML = '';
  
  options.forEach(color => {
    const button = document.createElement('div');
    button.className = 'color-option';
    button.style.backgroundColor = color.hex;
    button.style.color = '#fff';
    button.textContent = color.name;
    button.onclick = () => selectColor(color.name, button);
    optionsContainer.appendChild(button);
  });
}

function selectColor(selectedColor, button) {
  if (!gameActive) return;
  
  const allButtons = document.querySelectorAll('.color-option');
  allButtons.forEach(btn => btn.style.pointerEvents = 'none');
  
  if (selectedColor === currentCorrectColor) {
    // Correct!
    button.classList.add('correct');
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    
    const points = 100 + (streak * 10) + (level * 50);
    score += points;
    timeLeft += 2; // Bonus time
    
    // Show combo
    if (streak > 2) {
      const comboDisplay = document.getElementById('comboDisplay');
      comboDisplay.textContent = `🔥 ${streak}x COMBO! +${points} pts`;
      setTimeout(() => comboDisplay.textContent = '', 1000);
    }
    
    // Level up every 5 correct answers
    if (streak % 5 === 0) {
      level++;
      timeLeft += 5; // Level bonus
    }
    
    updateStats();
    
    setTimeout(() => {
      allButtons.forEach(btn => btn.style.pointerEvents = 'auto');
      nextRound();
    }, 500);
    
  } else {
    // Wrong!
    button.classList.add('wrong');
    lives--;
    streak = 0;
    
    document.getElementById('comboDisplay').textContent = '❌ Wrong!';
    setTimeout(() => document.getElementById('comboDisplay').textContent = '', 1000);
    
    updateLives();
    
    if (lives <= 0) {
      gameOver();
    } else {
      setTimeout(() => {
        allButtons.forEach(btn => btn.style.pointerEvents = 'auto');
        nextRound();
      }, 1000);
    }
  }
}

function updateStats() {
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('streak').textContent = streak;
}

function updateLives() {
  const livesDisplay = document.getElementById('livesDisplay');
  livesDisplay.innerHTML = '';
  
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('span');
    heart.textContent = i < lives ? '❤️' : '🖤';
    livesDisplay.appendChild(heart);
  }
}

function startTimer() {
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft + 's';
    
    if (timeLeft <= 0) {
      gameOver();
    }
  }, 1000);
}

function gameOver() {
  gameActive = false;
  clearInterval(timerInterval);
  
  // Calculate SHARP reward
  const sharpReward = Math.min(5, Math.max(1, Math.floor(score / 1500)));
  
  console.log('Color Rush Game Over:', { score, bestStreak, level, sharpReward });
  
  // Wait for DOM then update modal elements
  setTimeout(() => {
    const finalScoreElement = document.getElementById('finalScore');
    const finalStreakElement = document.getElementById('finalStreak');
    const finalLevelElement = document.getElementById('finalLevel');
    const sharpRewardElement = document.getElementById('sharpReward');
    const gameOverPanel = document.getElementById('gameOverPanel');
    
    if (finalScoreElement) {
      finalScoreElement.textContent = score.toLocaleString();
      finalScoreElement.style.background = 'none';
      finalScoreElement.style.webkitTextFillColor = 'white';
      finalScoreElement.style.color = 'white';
      finalScoreElement.style.fontSize = '2rem';
      finalScoreElement.style.fontWeight = 'bold';
      console.log('Final score set to:', score.toLocaleString());
    }
    
    if (finalStreakElement) {
      finalStreakElement.textContent = bestStreak + 'x';
      finalStreakElement.style.background = 'none';
      finalStreakElement.style.webkitTextFillColor = 'white';
      finalStreakElement.style.color = 'white';
      finalStreakElement.style.fontSize = '2rem';
      finalStreakElement.style.fontWeight = 'bold';
      console.log('Final streak set to:', bestStreak + 'x');
    }
    
    if (finalLevelElement) {
      finalLevelElement.textContent = level.toString();
      finalLevelElement.style.background = 'none';
      finalLevelElement.style.webkitTextFillColor = 'white';
      finalLevelElement.style.color = 'white';
      finalLevelElement.style.fontSize = '2rem';
      finalLevelElement.style.fontWeight = 'bold';
      console.log('Final level set to:', level.toString());
    }
    
    if (sharpRewardElement) {
      sharpRewardElement.textContent = `${sharpReward} SHARP`;
      sharpRewardElement.style.background = 'none';
      sharpRewardElement.style.webkitTextFillColor = '#FFD700';
      sharpRewardElement.style.color = '#FFD700';
      sharpRewardElement.style.fontSize = '2rem';
      sharpRewardElement.style.fontWeight = 'bold';
      console.log('SHARP reward set to:', `${sharpReward} SHARP`);
    }
    
    if (gameOverPanel) {
      // DON'T clear className or cssText - that removes child styles!
      gameOverPanel.style.display = 'flex';
      gameOverPanel.style.position = 'fixed';
      gameOverPanel.style.top = '0';
      gameOverPanel.style.left = '0';
      gameOverPanel.style.width = '100%';
      gameOverPanel.style.height = '100%';
      gameOverPanel.style.zIndex = '999999';
      gameOverPanel.style.alignItems = 'center';
      gameOverPanel.style.justifyContent = 'center';
      gameOverPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      gameOverPanel.style.backdropFilter = 'blur(8px)';
      
      console.log('Color Rush modal displayed with values');
      
      // Also ensure modal content is visible
      const modalContent = gameOverPanel.querySelector('.modal-content, .game-over-content');
      if (modalContent) {
        modalContent.setAttribute('style', `
          position: relative !important;
          z-index: 1000000 !important;
          background: #1a1a2e !important;
          padding: 2rem !important;
          border-radius: 1rem !important;
          color: white !important;
          max-width: 90% !important;
        `);
      }
      
      gameOverPanel.focus();
      gameOverPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
}

async function submitScore() {
  if (!currentUser) {
    alert('Please login to submit your score!');
    window.location.href = 'index.html';
    return;
  }
  
  console.log('Submitting color rush score:', { score, level, bestStreak });
  
  try {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    // Call Firebase Cloud Function to submit score and handle token transfer
    const submitScoreFunction = firebase.functions().httpsCallable('submitScore');
    const result = await submitScoreFunction({
      score: score,
      playDuration: elapsed,
      timestamp: Date.now(),
      gameType: 'color-rush',
      difficulty: 'medium'
    });

    const data = result.data;
    
    // Build success message
    let message = `🎉 Score Submitted Successfully!\n\n🌈 Color Rush\n🎯 Score: ${score}\n⏱️ Time: ${elapsed}s\n🏆 Level: ${level}\n🔥 Best Streak: ${bestStreak}x\n💰 Earned: ${data.reward.toFixed(2)} SHARP`;
    
    if (data.newBestScore) {
      message += `\n\n🏆 New Best Score!`;
    }
    
    if (data.dailyStreak > 0) {
      message += `\n🔥 Daily Streak: ${data.dailyStreak} days`;
    }
    
    message += `\n\nAwesome reflexes! 🚀`;

    // Check if wallet is connected and show transaction info
    if (data.txHash) {
      message += `\n\n✅ Tokens transferred to your wallet!`;
      
      // Show transaction popup with Etherscan link
      showTransactionPopup(data.txHash, data.reward, data.blockExplorer);
    } else if (!data.walletAddress) {
      message += `\n\n💡 Connect your wallet to receive tokens automatically!`;
    }
    
    alert(message);
    
    setTimeout(() => {
      window.location.href = 'games.html';
    }, 2000);
    
  } catch (error) {
    console.error('Error submitting color rush score:', error);
    
    if (error.message && error.message.includes('unauthenticated')) {
      alert('❌ Not logged in!\n\nPlease log in again and try submitting.');
      window.location.href = 'index.html';
    } else if (error.message && error.message.includes('failed-precondition')) {
      alert('❌ ' + error.message);
    } else if (error.code === 'unavailable' || error.message.includes('offline')) {
      alert('📶 Connection Issue!\n\nYou appear to be offline or have a slow connection.\nPlease try again when you have a stable connection.');
    } else {
      alert(`❌ Error submitting score: ${error.message || 'Unknown error'}\n\nPlease try again or contact support.`);
    }
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
