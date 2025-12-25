// Shared Game Utilities for SharpPlay Web
// Daily limits: 30 SHARP total, 2 plays per game, 5 SHARP per game, 1-hour cooldown

// Game limits and cooldown checking
async function checkGameLimits(gameType) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's plays for this user
    const todayPlaysQuery = await db.collection('gamescores')
      .where('uid', '==', currentUser.uid)
      .where('date', '==', today)
      .get();
    
    const todayPlays = todayPlaysQuery.docs.map(doc => doc.data());
    
    // Check daily SHARP limit (30 max)
    const todaySharp = todayPlays.reduce((sum, play) => sum + (play.sharpEarned || 0), 0);
    if (todaySharp >= 30) {
      return {
        allowed: false,
        message: `🚫 Daily limit reached!\n\nYou've earned ${todaySharp}/30 SHARP today.\nCome back tomorrow for more rewards! 🌅`
      };
    }
    
    // Get game-specific plays
    const gamePlaysTodayQuery = await db.collection('gamescores')
      .where('uid', '==', currentUser.uid)
      .where('gameType', '==', gameType)
      .where('date', '==', today)
      .orderBy('timestamp', 'desc')
      .get();
    
    const gamePlaysToday = gamePlaysTodayQuery.docs.map(doc => doc.data());
    
    // Check max plays per game (2 max)
    if (gamePlaysToday.length >= 2) {
      return {
        allowed: false,
        message: `🎮 ${gameType} daily limit reached!\n\nYou've played ${gamePlaysToday.length}/2 times today.\nTry other games! 🎯`
      };
    }
    
    // Check game SHARP limit (5 max per game)
    const gameSharpToday = gamePlaysToday.reduce((sum, play) => sum + (play.sharpEarned || 0), 0);
    if (gameSharpToday >= 5) {
      return {
        allowed: false,
        message: `💰 ${gameType} SHARP limit reached!\n\nYou've earned ${gameSharpToday}/5 SHARP from this game today.\nTry other games! 🎲`
      };
    }
    
    // Check cooldown (1 hour between same game plays)
    if (gamePlaysToday.length > 0) {
      const lastPlay = gamePlaysToday[0];
      const lastPlayTime = lastPlay.timestamp.toMillis();
      const now = Date.now();
      const timeDiff = now - lastPlayTime;
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (timeDiff < oneHour) {
        const remainingMinutes = Math.ceil((oneHour - timeDiff) / (1000 * 60));
        return {
          allowed: false,
          message: `⏰ Cooldown active!\n\nWait ${remainingMinutes} minutes before playing ${gameType} again.\nTry other games while you wait! 🕐`
        };
      }
    }
    
    return { allowed: true };
    
  } catch (error) {
    console.error('Error checking game limits:', error);
    return { allowed: true }; // Allow play if check fails
  }
}

// Calculate SHARP reward based on score and game type
function calculateSharpReward(score, gameType, difficulty = 'medium') {
  let baseReward = 0;
  
  // Base reward calculation by game type
  switch (gameType) {
    case 'memory':
      baseReward = Math.min(5, Math.max(1, Math.floor(score / 2000))); // Max 5 SHARP
      break;
    case 'color-rush':
      baseReward = Math.min(5, Math.max(1, Math.floor(score / 1500))); // Max 5 SHARP
      break;
    case 'sharp-shooter':
      baseReward = Math.min(5, Math.max(1, Math.floor(score / 1000))); // Max 5 SHARP
      break;
    case 'stack-game':
      baseReward = Math.min(5, Math.max(1, Math.floor(score / 800))); // Max 5 SHARP
      break;
    default:
      baseReward = Math.min(5, Math.max(1, Math.floor(score / 1000)));
  }
  
  // Difficulty multiplier
  const multiplier = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.2 : 1.0;
  
  return Math.max(1, Math.floor(baseReward * multiplier));
}

// Unified score submission function
async function submitGameScore(gameType, score, playDuration, additionalData = {}) {
  if (!currentUser) {
    alert('Please login to submit your score!');
    window.location.href = 'index.html';
    return;
  }
  
  try {
    // Check daily limits and cooldowns
    const canPlay = await checkGameLimits(gameType);
    if (!canPlay.allowed) {
      alert(canPlay.message);
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate SHARP reward
    const sharpReward = calculateSharpReward(score, gameType, additionalData.difficulty);
    
    // Save score to Firestore
    const scoreData = {
      uid: currentUser.uid,
      score: score,
      playDuration: playDuration,
      gameType: gameType,
      date: today,
      sharpEarned: sharpReward,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      ...additionalData
    };
    
    await db.collection('gamescores').add(scoreData);
    
    // Update user stats and balance
    const userRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const currentBest = userData.bestScore || 0;
      const newBest = Math.max(currentBest, score);
      const newBalance = (userData.tokensBalance || 0) + sharpReward;
      const newTotalEarned = (userData.totalEarned || 0) + sharpReward;
      
      await userRef.update({
        bestScore: newBest,
        tokensBalance: newBalance,
        totalEarned: newTotalEarned,
        lastPlayed: firebase.firestore.FieldValue.serverTimestamp(),
        gamesPlayed: firebase.firestore.FieldValue.increment(1)
      });
    }
    
    // Update leaderboard
    await db.collection('leaderboard').doc(currentUser.uid).set({
      username: currentUser.displayName || currentUser.email?.split('@')[0] || 'Player',
      bestScore: Math.max(score, (await userRef.get()).data()?.bestScore || 0),
      totalEarned: (await userRef.get()).data()?.totalEarned || 0,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Success message
    const gameEmojis = {
      'memory': '🧠',
      'color-rush': '🌈',
      'sharp-shooter': '🎯',
      'stack-game': '🏗️'
    };
    
    const emoji = gameEmojis[gameType] || '🎮';
    alert(`🎉 Score Submitted!\n\n${emoji} Score: ${score}\n⏱️ Time: ${playDuration}s\n💰 Earned: ${sharpReward} SHARP\n\nGreat job! Keep playing! 🚀`);
    
    // Redirect to profile after 2 seconds
    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 2000);
    
  } catch (error) {
    console.error('Error submitting score:', error);
    alert('❌ Error submitting score. Please try again.');
  }
}

// Get user's daily game status
async function getDailyGameStatus() {
  if (!currentUser) return null;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const todayPlaysQuery = await db.collection('gamescores')
      .where('uid', '==', currentUser.uid)
      .where('date', '==', today)
      .get();
    
    const todayPlays = todayPlaysQuery.docs.map(doc => doc.data());
    const todaySharp = todayPlays.reduce((sum, play) => sum + (play.sharpEarned || 0), 0);
    
    const games = ['memory', 'color-rush', 'sharp-shooter', 'stack-game'];
    const gameStatus = {};
    
    for (const game of games) {
      const gamePlays = todayPlays.filter(play => play.gameType === game);
      const gameSharp = gamePlays.reduce((sum, play) => sum + (play.sharpEarned || 0), 0);
      
      let nextPlayTime = null;
      if (gamePlays.length > 0) {
        const lastPlay = gamePlays[gamePlays.length - 1];
        const lastPlayTime = lastPlay.timestamp.toMillis();
        nextPlayTime = lastPlayTime + (60 * 60 * 1000); // 1 hour cooldown
      }
      
      gameStatus[game] = {
        playsToday: gamePlays.length,
        maxPlays: 2,
        sharpEarned: gameSharp,
        maxSharp: 5,
        canPlay: gamePlays.length < 2 && gameSharp < 5 && todaySharp < 30,
        nextPlayTime: nextPlayTime,
        cooldownActive: nextPlayTime ? Date.now() < nextPlayTime : false
      };
    }
    
    return {
      totalSharpToday: todaySharp,
      maxDailySharp: 30,
      canEarnMore: todaySharp < 30,
      games: gameStatus
    };
    
  } catch (error) {
    console.error('Error getting daily game status:', error);
    return null;
  }
}