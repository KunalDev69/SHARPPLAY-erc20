// Leaderboard functionality
let currentFilter = 'all';

async function loadLeaderboard(filter = 'all') {
  currentFilter = filter;
  
  try {
    let players = [];
    
    try {
      // Fetch real users from Firestore
      const snapshot = await db.collection('users')
        .orderBy('bestScore', 'desc')
        .limit(50)
        .get();
      
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          // Only include users who have played at least one game or have a score
          if (data.bestScore > 0 || data.totalEarned > 0) {
            players.push({ id: doc.id, ...data });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      document.getElementById('leaderboardBody').innerHTML = `
        <tr>
          <td colspan="5" class="loading">Error loading leaderboard. Please try again later.</td>
        </tr>
      `;
      return;
    }
    
    // If no players found
    if (players.length === 0) {
      document.getElementById('leaderboardBody').innerHTML = `
        <tr>
          <td colspan="5" class="loading">No players found yet. Be the first to play!</td>
        </tr>
      `;
      // Reset podium
      updatePodium([]);
      return;
    }
    
    // Update podium (top 3)
    updatePodium(players.slice(0, 3));
    
    // Update table
    let html = '';
    players.forEach((player, index) => {
      const rank = index + 1;
      const username = player.username || 'Anonymous Player';
      const score = player.bestScore || 0;
      const tokens = player.totalEarned || 0;
      const streak = player.dailyStreak || 0;
      
      // Highlight current user
      const isCurrentUser = (typeof currentUser !== 'undefined' && currentUser && currentUser.uid === player.id);
      const rowClass = isCurrentUser ? 'current-user-row' : '';
      
      html += `
        <tr class="${rowClass}">
          <td class="rank-cell">
            ${rank <= 3 ? ['🥇', '🥈', '🥉'][rank-1] : '#' + rank}
          </td>
          <td>
            <div class="player-cell">
              <div class="player-avatar">${player.photoURL ? '<img src="' + player.photoURL + '" alt="avatar">' : '👤'}</div>
              <span class="player-name">${username} ${isCurrentUser ? '(You)' : ''}</span>
            </div>
          </td>
          <td class="score-cell">${score.toLocaleString()}</td>
          <td>${tokens.toFixed(2)} SHARP</td>
          <td>${streak} 🔥</td>
        </tr>
      `;
    });
    
    document.getElementById('leaderboardBody').innerHTML = html;
    
    // Show user's rank if logged in
    if (typeof currentUser !== 'undefined' && currentUser) {
      showUserRank(players);
    }
    
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

function updatePodium(topPlayers) {
  // Reset podium first
  ['rank1', 'rank2', 'rank3'].forEach(rank => {
    document.getElementById(rank + 'Name').textContent = '---';
    document.getElementById(rank + 'Score').textContent = '0';
  });

  // First place
  if (topPlayers[0]) {
    document.getElementById('rank1Name').textContent = topPlayers[0].username || 'Anonymous';
    document.getElementById('rank1Score').textContent = (topPlayers[0].bestScore || 0).toLocaleString();
  }
  
  // Second place
  if (topPlayers[1]) {
    document.getElementById('rank2Name').textContent = topPlayers[1].username || 'Anonymous';
    document.getElementById('rank2Score').textContent = (topPlayers[1].bestScore || 0).toLocaleString();
  }
  
  // Third place
  if (topPlayers[2]) {
    document.getElementById('rank3Name').textContent = topPlayers[2].username || 'Anonymous';
    document.getElementById('rank3Score').textContent = (topPlayers[2].bestScore || 0).toLocaleString();
  }
}

async function showUserRank(allPlayers) {
  if (typeof currentUser === 'undefined' || !currentUser) return;
  
  try {
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (!userDoc.exists) return;
    
    const userData = userDoc.data();
    const userRank = allPlayers.findIndex(p => p.id === currentUser.uid) + 1;
    
    if (userRank > 0) {
      document.getElementById('yourRankBadge').textContent = `#${userRank}`;
      document.getElementById('yourBestScore').textContent = userData.bestScore || 0;
      document.getElementById('yourTotalEarned').textContent = (userData.totalEarned || 0).toFixed(2) + ' SHARP';
      document.getElementById('yourRank').style.display = 'block';
    }
  } catch (error) {
    console.error('Error showing user rank:', error);
  }
}

function filterLeaderboard(filter) {
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // For now, just reload (in production, filter by date)
  loadLeaderboard(filter);
}

// Load leaderboard when page loads
window.addEventListener('load', () => {
  loadLeaderboard();
});

// Refresh every 30 seconds
setInterval(() => {
  loadLeaderboard(currentFilter);
}, 30000);
