
    const countryNames = { FRA: 'France', ENG: 'England', BRA: 'Brazil', TUR: 'Türkiye', MAR: 'Morocco', NED: 'Netherlands', ESP: 'Spain', GER: 'Germany', BEL: 'Belgium', URU: 'Uruguay' };
    const positionNames = { '前锋': 'Forward', '中场': 'Midfielder', '后卫': 'Defender', '门将': 'Goalkeeper' };
    const players = window.FOOTBALL_DATA.worldCup.players.map(player => ({ ...player, country: countryNames[player.countryCode], pos: positionNames[player.pos] }));
    const metricMeta = {
      goals: {label:'World Cup goals', unit:'', digits:0},
      assists: {label:'World Cup assists', unit:'', digits:0},
      passAccuracy: {label:'Pass accuracy', unit:'%', digits:0},
      speed: {label:'Top speed', unit:' km/h', digits:2}
    };
    let activePlayer = players[0];
    let activeMetric = 'goals';
    const fmt = (value, digits=0) => value == null ? '—' : Number(value).toLocaleString('en-US', {minimumFractionDigits:digits, maximumFractionDigits:digits});
    const initials = name => name.split(' ').map(x => x[0]).slice(0,2).join('');

    function renderChart() {
      const meta = metricMeta[activeMetric];
      const available = players.filter(p => p[activeMetric] != null).sort((a,b) => b[activeMetric] - a[activeMetric]);
      const max = Math.max(...available.map(p => p[activeMetric]), 1);
      document.getElementById('metric-note').textContent = meta.label;
      document.getElementById('chart').innerHTML = available.map((p, i) => `
        <div class="bar-row">
          <div class="player-label"><span class="player-thumb player-initials" aria-hidden="true">${initials(p.name)}</span><span class="player-label-copy"><span class="player-name" title="${p.name}">${p.name}</span><span class="player-meta">${p.country} · ${p.pos}</span></span></div>
          <div class="track" aria-hidden="true"><div class="bar ${i===0?'top':''}" style="width:${(p[activeMetric]/max)*100}%"></div></div>
          <div class="bar-value">${fmt(p[activeMetric], meta.digits)}${meta.unit}</div>
        </div>`).join('');
      document.getElementById('chart').setAttribute('aria-label', `${meta.label}: ${available.map(p => `${p.name}${fmt(p[activeMetric], meta.digits)}${meta.unit}`).join(', ')}`);
    }

    function renderProfile() {
      const p = activePlayer;
      const efficiency = p.goals != null && p.xg != null ? (p.goals - p.xg) : null;
      document.getElementById('profile').innerHTML = `
        <div class="profile-top"><span class="avatar player-initials" aria-hidden="true">${initials(p.name)}</span><div><div class="profile-name">${p.name}</div><div class="profile-meta">${p.country} · ${p.pos}</div></div></div>
        <div class="mini-grid">
          <div class="mini"><span>Goals / assists</span><strong>${fmt(p.goals)} / ${fmt(p.assists)}</strong></div>
          <div class="mini"><span>Minutes played</span><strong>${fmt(p.minutes)}</strong></div>
          <div class="mini"><span>Pass accuracy</span><strong>${p.passAccuracy == null ? '—' : fmt(p.passAccuracy)+'%'}</strong></div>
          <div class="mini"><span>${p.saves != null ? 'Goalkeeper saves' : 'Top speed'}</span><strong>${p.saves != null ? fmt(p.saves) : (p.speed == null ? '—' : fmt(p.speed,2)+' km/h')}</strong></div>
        </div>
        <p class="profile-foot">${efficiency == null ? 'Some fields are missing from the saved tables. Missing data do not mean zero or no appearances.' : `${fmt(p.goals)} goals from ${fmt(p.xg,2)} xG (${fmt(Math.abs(efficiency),2)} ${efficiency >= 0 ? 'above' : 'below'} xG), across ${fmt(p.shots)} shots.`}</p>`;
      [...document.querySelectorAll('#players-table tr')].forEach(tr => tr.classList.toggle('selected', tr.dataset.name === p.name));
    }

    function renderTable() {
      document.getElementById('players-table').innerHTML = players.map(p => `
        <tr data-name="${p.name}" tabindex="0" aria-label="View ${p.name} player profile">
          <td class="name-cell"><div class="table-player"><span class="player-initials" aria-hidden="true">${initials(p.name)}</span><div><strong>${p.name}</strong><span>${p.country} · ${p.pos}</span></div></div></td>
          <td>${p.rank == null ? '<span class="empty">—</span>' : `<span class="rank">#${p.rank}</span>`}</td>
          <td>${fmt(p.goals)}</td><td>${fmt(p.assists)}</td><td>${fmt(p.minutes)}</td><td>${fmt(p.shots)}</td>
          <td>${fmt(p.xg, p.xg == null ? 0 : 2)}</td><td>${p.passAccuracy == null ? '—' : fmt(p.passAccuracy)+'%'}</td>
          <td>${p.speed == null ? '—' : fmt(p.speed,2)}</td><td>${fmt(p.sprints)}</td>
        </tr>`).join('');
      document.querySelectorAll('#players-table tr').forEach(row => {
        row.addEventListener('click', () => selectPlayer(row.dataset.name));
        row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPlayer(row.dataset.name); } });
      });
    }

    function selectPlayer(name) {
      activePlayer = players.find(p => p.name === name) || players[0];
      document.getElementById('player-select').value = activePlayer.name;
      renderProfile();
    }

    const select = document.getElementById('player-select');
    select.innerHTML = players.map(p => `<option value="${p.name}">${p.name} · ${p.country}</option>`).join('');
    select.addEventListener('change', e => selectPlayer(e.target.value));
    document.querySelectorAll('[data-metric]').forEach(btn => btn.addEventListener('click', () => {
      activeMetric = btn.dataset.metric;
      document.querySelectorAll('[data-metric]').forEach(b => b.classList.toggle('active', b === btn));
      renderChart();
    }));
    const sum = key => players.reduce((total, player) => total + (player[key] ?? 0), 0);
    const available = key => players.filter(player => player[key] != null).length;
    const countryCount = new Set(players.map(player => player.country)).size;
    const positionCount = new Set(players.map(player => player.pos)).size;
    document.getElementById('sample-size').textContent = players.length;
    document.getElementById('sample-coverage').textContent = `${countryCount} countries · ${positionCount} position groups`;
    document.getElementById('goal-total').textContent = sum('goals');
    document.getElementById('assist-total').textContent = sum('assists');
    document.getElementById('goal-coverage').textContent = `${available('goals')} of ${players.length} players with goal data`;
    document.getElementById('assist-coverage').textContent = `${available('assists')} of ${players.length} players with assist data`;
    document.getElementById('country-count').textContent = countryCount;
    renderTable(); renderChart(); renderProfile();
