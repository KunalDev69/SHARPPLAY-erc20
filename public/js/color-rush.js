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
    const today = new Date().toISOString().split('T')[0];
    const sharpReward = Math.min(5, Math.max(1, Math.floor(score / 1500)));
    
    console.log('Calculated reward:', sharpReward, 'for score:', score);
    
    // Save directly to Firestore
    const scoreData = {
      uid: currentUser.uid,
      score: score,
      playDuration: elapsed,
      gameType: 'color-rush',
      level: level,
      streak: bestStreak,
      date: today,
      sharpEarned: sharpReward,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('gamescores').add(scoreData);
    console.log('Color rush score saved successfully');
    
    // Update user balance
    const userRef = db.collection('users').doc(currentUser.uid);
    await userRef.update({
      tokensBalance: firebase.firestore.FieldValue.increment(sharpReward),
      totalEarned: firebase.firestore.FieldValue.increment(sharpReward),
      lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    alert(`🎉 Score Submitted Successfully!\n\n🌈 Color Rush\n🎯 Score: ${score}\n⏱️ Time: ${elapsed}s\n🏆 Level: ${level}\n🔥 Best Streak: ${bestStreak}x\n💰 Earned: ${sharpReward} SHARP\n\nAwesome reflexes! 🚀`);
    
    setTimeout(() => {
      window.location.href = 'games.html';
    }, 2000);
    
  } catch (error) {
    console.error('Error submitting color rush score:', error);
    
    if (error.code === 'permission-denied') {
      alert('❌ Permission Error!\n\nFirebase permissions not set up correctly.\nPlease try again in a few moments.');
    } else if (error.code === 'unauthenticated') {
      alert('❌ Not logged in!\n\nPlease log in again and try submitting.');
      window.location.href = 'index.html';
    } else if (error.code === 'unavailable' || error.message.includes('offline')) {
      alert('📶 Connection Issue!\n\nYou appear to be offline or have a slow connection.\nYour score will be saved when you reconnect.');
      
      setTimeout(() => {
        window.location.href = 'games.html';
      }, 3000);
    } else {
      alert(`❌ Error submitting score: ${error.message}\n\nPlease try again or contact support.`);
    }
  }
}
