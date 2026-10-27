
    const players = window.FOOTBALL_DATA.worldCup.players;
    const metricMeta = {
      goals: {label:'世界杯进球数', unit:'球', digits:0},
      assists: {label:'世界杯助攻数', unit:'次', digits:0},
      passAccuracy: {label:'传球成功率', unit:'%', digits:0},
      speed: {label:'最高时速', unit:' km/h', digits:2}
    };
    let activePlayer = players[0];
    let activeMetric = 'goals';
    const fmt = (value, digits=0) => value == null ? '—' : Number(value).toLocaleString('zh-CN', {minimumFractionDigits:digits, maximumFractionDigits:digits});
    const initials = name => name.split(' ').map(x => x[0]).slice(0,2).join('');

    function renderChart() {
      const meta = metricMeta[activeMetric];
      const available = players.filter(p => p[activeMetric] != null).sort((a,b) => b[activeMetric] - a[activeMetric]);
      const max = Math.max(...available.map(p => p[activeMetric]), 1);
      document.getElementById('metric-note').textContent = meta.label;
      document.getElementById('chart').innerHTML = available.map((p, i) => `
        <div class="bar-row">
          <div class="player-label"><span class="player-thumb player-initials" aria-hidden="true">${initials(p.name)}</span><span class="player-label-copy"><span class="player-name">${p.zh}</span><span class="player-meta">${p.country} · ${p.pos}</span></span></div>
          <div class="track" aria-hidden="true"><div class="bar ${i===0?'top':''}" style="width:${(p[activeMetric]/max)*100}%"></div></div>
          <div class="bar-value">${fmt(p[activeMetric], meta.digits)}${meta.unit}</div>
        </div>`).join('');
      document.getElementById('chart').setAttribute('aria-label', `${meta.label}：${available.map(p => `${p.zh}${fmt(p[activeMetric], meta.digits)}${meta.unit}`).join('，')}`);
    }

    function renderProfile() {
      const p = activePlayer;
      const efficiency = p.goals != null && p.xg != null ? (p.goals - p.xg) : null;
      document.getElementById('profile').innerHTML = `
        <div class="profile-top"><span class="avatar player-initials" aria-hidden="true">${initials(p.name)}</span><div><div class="profile-name">${p.zh}</div><div class="profile-meta">${p.name} · ${p.country} · ${p.pos}</div></div></div>
        <div class="mini-grid">
          <div class="mini"><span>进球 / 助攻</span><strong>${fmt(p.goals)} / ${fmt(p.assists)}</strong></div>
          <div class="mini"><span>出场分钟</span><strong>${fmt(p.minutes)}</strong></div>
          <div class="mini"><span>传球成功率</span><strong>${p.passAccuracy == null ? '—' : fmt(p.passAccuracy)+'%'}</strong></div>
          <div class="mini"><span>${p.saves != null ? '门将扑救' : '最高时速'}</span><strong>${p.saves != null ? fmt(p.saves) : (p.speed == null ? '—' : fmt(p.speed,2)+' km/h')}</strong></div>
        </div>
        <p class="profile-foot">${efficiency == null ? '部分指标未被本地统计快照收录。缺失值不代表零，也不代表未出场。' : `实际进球较 xG ${efficiency >= 0 ? '高出' : '低于'} ${fmt(Math.abs(efficiency),2)} 球；${p.shots} 次射门，xG 为 ${fmt(p.xg,2)}。`}</p>`;
      [...document.querySelectorAll('#players-table tr')].forEach(tr => tr.classList.toggle('selected', tr.dataset.name === p.name));
    }

    function renderTable() {
      document.getElementById('players-table').innerHTML = players.map(p => `
        <tr data-name="${p.name}" tabindex="0" aria-label="查看${p.zh}的球员资料">
          <td class="name-cell"><div class="table-player"><span class="player-initials" aria-hidden="true">${initials(p.name)}</span><div><strong>${p.zh}</strong><span>${p.country} · ${p.pos}</span></div></div></td>
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
    select.innerHTML = players.map(p => `<option value="${p.name}">${p.zh} · ${p.country}</option>`).join('');
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
    document.getElementById('sample-coverage').textContent = `${countryCount} 个国家 · ${positionCount} 个位置组`;
    document.getElementById('goal-total').textContent = sum('goals');
    document.getElementById('assist-total').textContent = sum('assists');
    document.getElementById('goal-coverage').textContent = `${available('goals')} / ${players.length} 人有进球数据`;
    document.getElementById('assist-coverage').textContent = `${available('assists')} / ${players.length} 人有助攻数据`;
    document.getElementById('country-count').textContent = countryCount;
    renderTable(); renderChart(); renderProfile();
  