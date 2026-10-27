(function () {
  'use strict';

  var root = document.getElementById('u19-country-birth-report');
  var select = root.querySelector('#u19-country-select');
  var totalValue = root.querySelector('[data-total]');
  var peakMonthValue = root.querySelector('[data-peak-month]');
  var peakCountValue = root.querySelector('[data-peak-count]');
  var liveSummary = root.querySelector('[data-live-summary]');
  var shell = root.querySelector('.chart-shell');
  var svg = root.querySelector('.month-chart');
  var tooltip = root.querySelector('.chart-tooltip');
  var ns = 'http://www.w3.org/2000/svg';
  var countryData = window.FOOTBALL_DATA.u19.countries;
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var allCounts = Object.values(countryData).reduce(function (totals, counts) {
    return totals.map(function (value, index) { return value + counts[index]; });
  }, Array(12).fill(0));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function selectedCounts() {
    return select.value === 'All countries' ? allCounts : countryData[select.value];
  }

  function add(tag, attributes, textContent) {
    var node = document.createElementNS(ns, tag);
    Object.entries(attributes || {}).forEach(function (entry) {
      node.setAttribute(entry[0], String(entry[1]));
    });
    if (textContent !== undefined) node.textContent = textContent;
    svg.appendChild(node);
    return node;
  }

  function clearSvg() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function niceMax(value) {
    if (value <= 8) return Math.max(4, Math.ceil(value / 2) * 2);
    return Math.ceil(value / 5) * 5;
  }

  function ticks(maxValue) {
    var step = maxValue <= 10 ? 2 : 5;
    var values = [];
    var value;
    for (value = 0; value <= maxValue; value += step) values.push(value);
    if (values[values.length - 1] !== maxValue) values.push(maxValue);
    return values;
  }

  function selectionStats(counts) {
    var total = counts.reduce(function (sum, value) { return sum + value; }, 0);
    var maxCount = Math.max.apply(null, counts);
    var peakMonths = counts.map(function (value, index) {
      return value === maxCount ? monthNames[index] : null;
    }).filter(function (value) { return Boolean(value); });
    return { total: total, maxCount: maxCount, peakMonths: peakMonths };
  }

  function updateSummary(counts) {
    var stats = selectionStats(counts);
    totalValue.textContent = stats.total;
    peakMonthValue.textContent = stats.peakMonths.join(', ');
    peakCountValue.textContent = stats.maxCount;
    liveSummary.textContent = select.value + ': ' + stats.total + ' players. Peak month ' + stats.peakMonths.join(', ') + ', ' + stats.maxCount + ' players.';
  }

  function showTooltip(bar, label) {
    var barBox = bar.getBoundingClientRect();
    var shellBox = shell.getBoundingClientRect();
    tooltip.textContent = label;
    tooltip.style.left = (barBox.left - shellBox.left + barBox.width / 2) + 'px';
    tooltip.style.top = (barBox.top - shellBox.top) + 'px';
    tooltip.classList.add('is-visible');
  }

  function hideTooltip() {
    tooltip.classList.remove('is-visible');
  }

  function addBar(box, count, maxCount, month) {
    var label = select.value + ' · ' + month + ': ' + count + ' players';
    var bar = add('rect', {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      rx: 1,
      'class': 'bar' + (count === maxCount ? ' peak' : ''),
      tabindex: 0,
      role: 'graphics-symbol',
      'aria-label': label
    });
    bar.addEventListener('pointerenter', function () { showTooltip(bar, label); });
    bar.addEventListener('pointerleave', hideTooltip);
    bar.addEventListener('focus', function () { showTooltip(bar, label); });
    bar.addEventListener('blur', hideTooltip);
    return bar;
  }

  function animateBar(bar, from, to) {
    if (!from || reduceMotion.matches || typeof bar.animate !== 'function') return;
    bar.animate([from, to], { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
  }

  function drawHorizontal(counts, width, height, maxCount, maxAxis, previousBars, previousOrientation, shouldAnimate) {
    var margin = { top: 14, right: 48, bottom: 50, left: 48 };
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;
    var slot = innerHeight / 12;
    var barHeight = Math.max(14, Math.min(22, slot * 0.56));
    var x = function (value) { return margin.left + value / maxAxis * innerWidth; };

    ticks(maxAxis).forEach(function (tick) {
      var xPos = x(tick);
      add('line', { x1: xPos, y1: margin.top, x2: xPos, y2: margin.top + innerHeight, 'class': 'grid-line' });
      add('text', { x: xPos, y: margin.top + innerHeight + 22, 'text-anchor': 'middle', 'class': 'muted-label' }, tick);
    });
    add('line', { x1: margin.left, y1: margin.top + innerHeight, x2: width - margin.right, y2: margin.top + innerHeight, 'class': 'axis-line' });

    counts.forEach(function (count, index) {
      var centerY = margin.top + slot * index + slot / 2;
      var finalBox = {
        x: margin.left,
        y: centerY - barHeight / 2,
        width: Math.max(count === 0 ? 0 : 1, x(count) - margin.left),
        height: barHeight
      };
      add('text', { x: margin.left - 9, y: centerY + 5, 'text-anchor': 'end' }, monthNames[index]);
      var bar = addBar(finalBox, count, maxCount, monthNames[index]);
      if (shouldAnimate && previousOrientation === 'horizontal') animateBar(bar, previousBars[index], finalBox);
      add('text', { x: x(count) + 8, y: centerY + 5, 'text-anchor': 'start', 'class': 'value-label' + (count === maxCount ? ' peak' : '') }, count);
    });
    add('text', { x: margin.left + innerWidth / 2, y: height - 8, 'text-anchor': 'middle', 'class': 'axis-title' }, 'Players');
    add('text', { x: 11, y: margin.top + innerHeight / 2, transform: 'rotate(-90 11 ' + (margin.top + innerHeight / 2) + ')', 'text-anchor': 'middle', 'class': 'axis-title' }, 'Birth month');
  }

  function drawVertical(counts, width, height, maxCount, maxAxis, previousBars, previousOrientation, shouldAnimate) {
    var margin = { top: 20, right: 16, bottom: 58, left: 56 };
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;
    var slot = innerWidth / 12;
    var barWidth = Math.max(16, Math.min(64, slot * 0.57));
    var y = function (value) { return margin.top + innerHeight - value / maxAxis * innerHeight; };

    ticks(maxAxis).forEach(function (tick) {
      var yPos = y(tick);
      add('line', { x1: margin.left, y1: yPos, x2: width - margin.right, y2: yPos, 'class': 'grid-line' });
      add('text', { x: margin.left - 12, y: yPos + 5, 'text-anchor': 'end', 'class': 'muted-label' }, tick);
    });
    add('line', { x1: margin.left, y1: margin.top + innerHeight, x2: width - margin.right, y2: margin.top + innerHeight, 'class': 'axis-line' });

    counts.forEach(function (count, index) {
      var centerX = margin.left + slot * index + slot / 2;
      var finalBox = {
        x: centerX - barWidth / 2,
        y: y(count),
        width: barWidth,
        height: margin.top + innerHeight - y(count)
      };
      var bar = addBar(finalBox, count, maxCount, monthNames[index]);
      if (shouldAnimate && previousOrientation === 'vertical') animateBar(bar, previousBars[index], finalBox);
      add('text', { x: centerX, y: Math.max(margin.top + 14, y(count) - 10), 'text-anchor': 'middle', 'class': 'value-label' + (count === maxCount ? ' peak' : '') }, count);
      add('text', { x: centerX, y: margin.top + innerHeight + 28, 'text-anchor': 'middle' }, monthNames[index]);
    });
    add('text', { x: margin.left + innerWidth / 2, y: height - 7, 'text-anchor': 'middle', 'class': 'axis-title' }, 'Birth month');
  }

  function draw(shouldAnimate) {
    var counts = selectedCounts();
    var width = Math.max(280, Math.round(shell.getBoundingClientRect().width));
    var isNarrow = width <= 640;
    var height = isNarrow ? 510 : Math.max(430, Math.min(540, Math.round(window.innerHeight * 0.52)));
    var previousBars = Array.from(svg.querySelectorAll('.bar')).map(function (bar) {
      return {
        x: Number(bar.getAttribute('x')),
        y: Number(bar.getAttribute('y')),
        width: Number(bar.getAttribute('width')),
        height: Number(bar.getAttribute('height'))
      };
    });
    var previousOrientation = svg.dataset.orientation;
    var maxCount = Math.max.apply(null, counts);
    var maxAxis = niceMax(maxCount);

    hideTooltip();
    clearSvg();
    svg.dataset.orientation = isNarrow ? 'horizontal' : 'vertical';
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    add('title', { id: 'u19-month-title' }, select.value + ' player birth month distribution');
    add('desc', { id: 'u19-month-desc' }, 'A 12-month bar chart of player birth counts for ' + select.value + '.');

    if (isNarrow) drawHorizontal(counts, width, height, maxCount, maxAxis, previousBars, previousOrientation, shouldAnimate);
    else drawVertical(counts, width, height, maxCount, maxAxis, previousBars, previousOrientation, shouldAnimate);
    updateSummary(counts);
  }

  var resizeFrame = 0;
  function scheduleDraw() {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(function () { draw(false); });
  }

  select.addEventListener('change', function () { draw(true); });
  draw(false);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleDraw).observe(shell);
  else window.addEventListener('resize', scheduleDraw);
}());
