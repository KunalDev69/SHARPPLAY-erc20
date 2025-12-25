// Memory Match Game

// Mobile menu toggle
function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  
  if (navLinks && mobileMenuBtn) {
    navLinks.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
  }
}

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let score = 0;
let startTime = null;
let timerInterval = null;
let difficulty = 'medium';
let gameActive = false;

const emojis = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎹', 
               '🎺', '🎸', '🎻', '🎼', '🏆', '💎', '⚡', '🔥', '💰', '🌟'];

function startGame(selectedDifficulty) {
  difficulty = selectedDifficulty;
  const cardCount = difficulty === 'easy' ? 12 : difficulty === 'medium' ? 16 : 20;
  const pairCount = cardCount / 2;
  
  // Reset game state
  cards = [];
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  score = 10000; // Start with high score, decrease with moves
  gameActive = true;
  
  // Select random emojis
  const selectedEmojis = emojis.slice(0, pairCount);
  const gameEmojis = [...selectedEmojis, ...selectedEmojis];
  
  // Shuffle cards
  cards = gameEmojis.sort(() => Math.random() - 0.5).map((emoji, index) => ({
    id: index,
    emoji: emoji,
    flipped: false,
    matched: false
  }));
  
  // Update grid columns based on difficulty
  const grid = document.getElementById('memoryGrid');
  grid.style.gridTemplateColumns = difficulty === 'easy' ? 'repeat(3, 1fr)' : 
                                    difficulty === 'medium' ? 'repeat(4, 1fr)' : 
                                    'repeat(5, 1fr)';
  
  renderCards();
  updateStats();
  startTimer();
}

function renderCards() {
  const grid = document.getElementById('memoryGrid');
  grid.innerHTML = '';
  
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'memory-card';
    cardElement.dataset.id = card.id;
    
    cardElement.innerHTML = `
      <div class="card-back">❓</div>
      <div class="card-front">${card.emoji}</div>
    `;
    
    cardElement.addEventListener('click', () => handleCardClick(card.id));
    grid.appendChild(cardElement);
  });
}

function handleCardClick(cardId) {
  if (!gameActive) return;
  
  const card = cards.find(c => c.id === cardId);
  if (card.flipped || card.matched || flippedCards.length >= 2) return;
  
  // Flip card
  card.flipped = true;
  flippedCards.push(card);
  updateCardVisual(cardId);
  
  if (flippedCards.length === 2) {
    moves++;
    score = Math.max(0, score - 50); // Lose points per move
    updateStats();
    checkMatch();
  }
}

function updateCardVisual(cardId) {
  const cardElement = document.querySelector(`[data-id="${cardId}"]`);
  const card = cards.find(c => c.id === cardId);
  
  if (card.matched) {
    cardElement.classList.add('matched');
  } else if (card.flipped) {
    cardElement.classList.add('flipped');
  } else {
    cardElement.classList.remove('flipped');
  }
}

function checkMatch() {
  setTimeout(() => {
    const [card1, card2] = flippedCards;
    
    if (card1.emoji === card2.emoji) {
      // Match found
      card1.matched = true;
      card2.matched = true;
      matchedPairs++;
      score += 500; // Bonus for match
      
      updateCardVisual(card1.id);
      updateCardVisual(card2.id);
      
      if (matchedPairs === cards.length / 2) {
        gameComplete();
      }
    } else {
      // No match
      card1.flipped = false;
      card2.flipped = false;
      
      updateCardVisual(card1.id);
      updateCardVisual(card2.id);
    }
    
    flippedCards = [];
    updateStats();
  }, 800);
}

function updateStats() {
  document.getElementById('moves').textContent = moves;
  document.getElementById('matches').textContent = matchedPairs;
  document.getElementById('score').textContent = score;
}

function startTimer() {
  startTime = Date.now();
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = elapsed + 's';
    
    // Lose points over time
    if (gameActive && elapsed > 0 && elapsed % 5 === 0) {
      score = Math.max(0, score - 10);
      updateStats();
    }
  }, 1000);
}

function gameComplete() {
  gameActive = false;
  clearInterval(timerInterval);
  
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  
  // Time bonus
  const timeBonus = Math.max(0, 1000 - (elapsed * 10));
  score += timeBonus;
  
  // Difficulty multiplier
  const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
  score = Math.floor(score * multiplier);
  
  // Calculate SHARP reward
  const sharpReward = Math.min(5, Math.max(1, Math.floor(score / 2000)));
  
  console.log('Game Complete:', { score, moves, elapsed, sharpReward });
  
  // Wait for DOM to be ready, then update modal
  setTimeout(() => {
    console.log('Updating modal elements...');
    
    // Get all modal elements
    const finalScoreElement = document.getElementById('finalScore');
    const finalMovesElement = document.getElementById('finalMoves');
    const finalTimeElement = document.getElementById('finalTime');
    const sharpRewardElement = document.getElementById('sharpReward');
    const gameOverPanel = document.getElementById('gameOverPanel');
    
    console.log('Elements check:', {
      finalScoreElement: !!finalScoreElement,
      finalMovesElement: !!finalMovesElement,
      finalTimeElement: !!finalTimeElement,
      sharpRewardElement: !!sharpRewardElement,
      gameOverPanel: !!gameOverPanel
    });
    
    // Update each element with forced refresh and visibility
    if (finalScoreElement) {
      finalScoreElement.textContent = score.toLocaleString();
      // Override the gradient text CSS that makes text transparent
      finalScoreElement.style.background = 'none';
      finalScoreElement.style.webkitTextFillColor = 'white';
      finalScoreElement.style.color = 'white';
      finalScoreElement.style.fontSize = '2rem';
      finalScoreElement.style.fontWeight = 'bold';
      console.log('Final score updated to:', score.toLocaleString());
    } else {
      console.error('finalScore element not found!');
    }
    
    if (finalMovesElement) {
      finalMovesElement.textContent = moves.toString();
      finalMovesElement.style.background = 'none';
      finalMovesElement.style.webkitTextFillColor = 'white';
      finalMovesElement.style.color = 'white';
      finalMovesElement.style.fontSize = '2rem';
      finalMovesElement.style.fontWeight = 'bold';
      console.log('Final moves updated to:', moves.toString());
    } else {
      console.error('finalMoves element not found!');
    }
    
    if (finalTimeElement) {
      finalTimeElement.textContent = elapsed + 's';
      finalTimeElement.style.background = 'none';
      finalTimeElement.style.webkitTextFillColor = 'white';
      finalTimeElement.style.color = 'white';
      finalTimeElement.style.fontSize = '2rem';
      finalTimeElement.style.fontWeight = 'bold';
      console.log('Final time updated to:', elapsed + 's');
    } else {
      console.error('finalTime element not found!');
    }
    
    if (sharpRewardElement) {
      sharpRewardElement.textContent = `${sharpReward} SHARP`;
      sharpRewardElement.style.background = 'none';
      sharpRewardElement.style.webkitTextFillColor = '#FFD700';
      sharpRewardElement.style.color = '#FFD700';
      sharpRewardElement.style.fontSize = '2rem';
      sharpRewardElement.style.fontWeight = 'bold';
      console.log('SHARP reward updated to:', `${sharpReward} SHARP`);
    } else {
      console.error('sharpReward element not found!');
    }
    
    // Show the modal with proper display and z-index
    if (gameOverPanel) {
      // DON'T clear className or cssText - that removes child styles!
      // Just set the display properties we need
      
      // Force modal to show with inline styles that override everything
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
      
      console.log('Game over panel forced to display');
      console.log('Modal computed styles:', window.getComputedStyle(gameOverPanel).display);
      
      // Also ensure modal content is visible with proper styles
      const modalContent = gameOverPanel.querySelector('.modal-content, .game-over-content');
      if (modalContent) {
        modalContent.style.position = 'relative';
        modalContent.style.zIndex = '1000000';
        modalContent.style.background = 'linear-gradient(135deg, rgba(36, 45, 66, 0.95) 0%, rgba(30, 37, 54, 0.95) 100%)';
        modalContent.style.padding = '2rem';
        modalContent.style.borderRadius = '1rem';
        modalContent.style.color = 'white';
        modalContent.style.maxWidth = '90%';
        modalContent.style.visibility = 'visible';
        modalContent.style.opacity = '1';
        console.log('Modal content also forced visible');
      }
      
      // Force focus and scroll to modal
      gameOverPanel.focus();
      gameOverPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
    } else {
      console.error('gameOverPanel not found!');
    }
  }, 200);
  
  // Backup method - if modal still not showing after 1 second, use alert as fallback
  setTimeout(() => {
    const modal = document.getElementById('gameOverPanel');
    if (modal && window.getComputedStyle(modal).display === 'none') {
      console.warn('Modal not displaying, using backup method');
      const finalScore = document.getElementById('finalScore')?.textContent || score;
      const finalMoves = document.getElementById('finalMoves')?.textContent || moves;
      const finalTime = document.getElementById('finalTime')?.textContent || '0s';
      const sharpReward = document.getElementById('sharpReward')?.textContent || '5 SHARP';
      
      alert(`🎉 GAME COMPLETE!\n\n🧠 Memory Match\n📊 Score: ${finalScore}\n🎯 Moves: ${finalMoves}\n⏱️ Time: ${finalTime}\n💰 Reward: ${sharpReward}\n\nClick Submit & Earn to save your score!`);
      
      // Force modal to show after alert
      modal.style.display = 'block';
      modal.style.position = 'fixed';
      modal.style.zIndex = '999999';
      modal.style.background = 'rgba(0,0,0,0.9)';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
    }
  }, 1000);
}

async function submitScore() {
  if (!currentUser) {
    alert('Please login to submit your score!');
    window.location.href = 'index.html';
    return;
  }
  
  console.log('Submitting score:', { score, moves, difficulty, currentUser: currentUser.uid });
  
  try {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    // Call Firebase Cloud Function to submit score and handle token transfer
    const submitScoreFunction = firebase.functions().httpsCallable('submitScore');
    const result = await submitScoreFunction({
      score: score,
      playDuration: elapsed,
      timestamp: Date.now(),
      gameType: 'memory',
      difficulty: difficulty
    });

    const data = result.data;
    
    // Build success message
    let message = `🎉 Score Submitted Successfully!\n\n🧠 Memory Game\n📊 Score: ${score.toLocaleString()}\n⏱️ Time: ${elapsed}s\n🎯 Moves: ${moves}\n💰 Earned: ${data.reward.toFixed(2)} SHARP`;
    
    if (data.newBestScore) {
      message += `\n\n🏆 New Best Score!`;
    }
    
    if (data.dailyStreak > 0) {
      message += `\n🔥 Daily Streak: ${data.dailyStreak} days`;
    }
    
    message += `\n\nGreat job! 🎮`;

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
    console.error('Detailed error submitting score:', error);
    
    // More specific error messages
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

// Auto-start on page load
window.addEventListener('load', () => {
  setTimeout(() => startGame('medium'), 500);
});
