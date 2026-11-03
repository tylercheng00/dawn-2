/* Rocket physics playground — generic textbook physics with user inputs. */
(function () {
  'use strict';
  var G0 = 9.80665, RE = 6371000;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
  function fmt(x, d) { return x.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }

  /* keep number inputs and sliders in sync */
  document.querySelectorAll('input[type=range][data-for]').forEach(function (r) {
    var n = $(r.getAttribute('data-for'));
    r.addEventListener('input', function () { n.value = r.value; n.dispatchEvent(new Event('input', { bubbles: true })); });
    n.addEventListener('input', function () { var v = parseFloat(n.value); if (isFinite(v)) r.value = Math.min(Math.max(v, r.min), r.max); });
  });

  /* ======================================================= 01 thrust */
  function thrust() {
    var mdot = Math.max(num('mdot'), 0), ve = Math.max(num('ve'), 0), F = mdot * ve;
    if ($('advT').checked) F += (num('pe') - num('pa')) * 1000 * num('ae');
    F = Math.max(F, 0);
    var isp = mdot > 0 ? F / (mdot * G0) : 0, tonnes = F / G0 / 1000;
    $('oF').textContent = fmt(F / 1000, 1) + ' kN';
    $('oIsp').textContent = fmt(isp, 0) + ' s';
    $('oLift').textContent = fmt(tonnes, 1) + ' t';
    $('thrustExplain').innerHTML = 'That thrust could hold up about <b>' + fmt(tonnes / 1.5, 0) + '</b> family cars (≈1.5 t each) against gravity. · 這推力大約可承托 <b>' + fmt(tonnes / 1.5, 0) + '</b> 輛家庭房車（每輛約 1.5 噸）。' +
      (isp > 465 ? '<br><span style="color:var(--bad)">Isp above ~465 s is beyond what chemical rockets achieve. · 比衝超過約 465 秒已超出化學火箭的能力。</span>' : '');
    return F;
  }
  ['mdot', 've', 'pe', 'pa', 'ae'].forEach(function (id) { $(id).addEventListener('input', thrust); });
  $('advT').addEventListener('change', function () { $('advBox').classList.toggle('show', this.checked); thrust(); });
  thrust();

  /* ======================================================= 02 liftoff */
  var lift = { tw: 0, a: 0 };
  function liftoff() {
    var F = num('lF') * 1000, m = Math.max(num('lM'), 0.001) * 1000, tw = F / (m * G0), a = F / m - G0;
    lift.tw = tw; lift.a = a;
    $('oTW').textContent = fmt(tw, 2); $('oTW').className = tw > 1 ? 'good' : 'bad';
    $('oAcc').textContent = fmt(Math.max(a, 0), 1) + ' m/s²';
    $('oG').textContent = fmt(F / m / G0, 2) + ' g';
    var v = $('lVerdict');
    if (tw <= 1) { v.className = 'verdict bad'; v.textContent = '✕ Stays on the pad — thrust is less than weight. · 推力小於重量，無法離地。'; }
    else if (tw < 1.15) { v.className = 'verdict bad'; v.textContent = '△ Barely lifts — most thrust is spent fighting gravity. · 勉強離地，大部分推力用於對抗重力。'; }
    else { v.className = 'verdict good'; v.textContent = '✓ Lift-off! It climbs at ' + fmt(a, 1) + ' m/s². · 成功起飛，加速度 ' + fmt(a, 1) + ' m/s²。'; }
    padT0 = performance.now();
  }
  ['lF', 'lM'].forEach(function (id) { $(id).addEventListener('input', liftoff); });
  $('useThrust').addEventListener('click', function () { var F = thrust() / 1000; $('lF').value = Math.round(F); $('lF').dispatchEvent(new Event('input', { bubbles: true })); });

  var padCv = $('padCv'), pctx = padCv.getContext('2d'), padT0 = performance.now();
  (function setup() { var d = Math.min(window.devicePixelRatio || 1, 2); padCv.width = 600 * d; padCv.height = 260 * d; pctx.scale(d, d); })();
  function drawRocket(ctx, x, y, s, flame, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (flame) {
      var fl = 26 + Math.sin(t * 40) * 4 + Math.sin(t * 63) * 3;
      var g = ctx.createLinearGradient(0, 0, 0, fl); g.addColorStop(0, '#fff3c4'); g.addColorStop(.4, '#ff9a3d'); g.addColorStop(1, 'rgba(201,72,26,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(0, fl * 1.4, 6, 0); ctx.fill();
    }
    ctx.fillStyle = '#e8edf2'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-7, -46); ctx.quadraticCurveTo(0, -66, 7, -46); ctx.lineTo(7, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9481a'; ctx.fillRect(-7, -30, 14, 5);
    ctx.fillStyle = '#5b6b7a'; ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-13, 2); ctx.lineTo(-7, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, -8); ctx.lineTo(13, 2); ctx.lineTo(7, 0); ctx.fill();
    ctx.restore();
  }
  function padLoop(now) {
    var W = 600, H = 260, t = (now - padT0) / 1000;
    pctx.clearRect(0, 0, W, H);
    for (var i = 0; i < 40; i++) { pctx.fillStyle = 'rgba(255,255,255,' + (0.15 + (i % 5) * .06) + ')'; pctx.fillRect((i * 97) % W, (i * 53) % 150, 1.5, 1.5); }
    pctx.fillStyle = '#1d2a36'; pctx.fillRect(0, H - 28, W, 28);
    pctx.fillStyle = '#33414e'; pctx.fillRect(W / 2 - 40, H - 32, 80, 6);
    var y = H - 32, shake = 0;
    if (lift.tw > 1) {
      var tt = t % 4.2, a = Math.min(lift.a, 40);
      y -= Math.min(0.5 * a * tt * tt * 6, H + 60);
    } else if (lift.tw > 0.05) shake = Math.sin(t * 50) * 1.2;
    drawRocket(pctx, W / 2 + shake, y, 1.6, lift.tw > 0.05, t);
    pctx.fillStyle = '#8796a3'; pctx.font = '12px IBM Plex Mono, monospace';
    pctx.fillText('T/W = ' + lift.tw.toFixed(2), 14, 22);
    if (!reduce || lift.tw <= 1) requestAnimationFrame(padLoop);
  }
  liftoff(); requestAnimationFrame(padLoop);

  /* ======================================================= 03 rocket equation */
  function rocketEq() {
    var pl = Math.max(num('pl'), 0), two = $('two').checked;
    var d1 = Math.max(num('d1'), 0.001), p1 = Math.max(num('p1'), 0), i1 = Math.max(num('i1'), 1);
    var d2 = Math.max(num('d2'), 0.001), p2 = Math.max(num('p2'), 0), i2 = Math.max(num('i2'), 1);
    var dv1, dv2 = 0;
    if (two) {
      var m02 = d2 + p2 + pl, mf2 = d2 + pl;
      dv2 = i2 * G0 * Math.log(m02 / mf2);
      dv1 = i1 * G0 * Math.log((d1 + p1 + m02) / (d1 + m02));
    } else {
      dv1 = i1 * G0 * Math.log((d1 + p1 + pl) / (d1 + pl));
    }
    var tot = dv1 + dv2, scale = 12000;
    $('dv1').textContent = fmt(dv1 / 1000, 2) + ' km/s';
    $('dv2').textContent = two ? fmt(dv2 / 1000, 2) + ' km/s' : '—';
    $('dvT').textContent = fmt(tot / 1000, 2) + ' km/s';
    $('dvT').className = tot >= 9400 ? 'good' : '';
    var w1 = Math.min(dv1 / scale * 100, 100);
    $('b1').style.width = w1 + '%';
    $('b2').style.left = w1 + '%'; $('b2').style.width = Math.min(dv2 / scale * 100, 100 - w1) + '%';
    $('refSub').style.left = (Math.sqrt(2 * G0 * 100000) / scale * 100) + '%';
    $('refLeo').style.left = (9400 / scale * 100) + '%';
    var v = $('dvVerdict');
    if (tot >= 9400) { v.className = 'verdict good'; v.textContent = '✓ Enough Δv for low Earth orbit (ideal). · 理想情況下足以進入近地軌道。'; }
    else if (tot >= 1400) { v.className = 'verdict'; v.textContent = '△ Enough to reach space on a hop, but not orbit. Try a second stage. · 足以短暫到達太空，但未能入軌，試試加入第二級。'; }
    else { v.className = 'verdict bad'; v.textContent = '✕ Not enough to reach space. · 未足以到達太空。'; }
  }
  ['pl', 'i1', 'd1', 'p1', 'i2', 'd2', 'p2'].forEach(function (id) { $(id).addEventListener('input', rocketEq); });
  $('two').addEventListener('change', function () { $('s2box').classList.toggle('off', !this.checked); rocketEq(); });
  rocketEq();

  /* ======================================================= 04 launch game */
  var LEVELS = [
    { id: 'l1', n: ['Mission 1', '任務一'], d: ['Reach 10 km', '到達 10 公里'], goal: 10, score: false,
      g: ['Climb above 10 km — higher than airliners fly. Tip: T/W must be above 1. · 飛越 10 公里，比客機飛得更高。提示：推重比須大於 1。'] },
    { id: 'l2', n: ['Mission 2', '任務二'], d: ['Cross 100 km', '越過 100 公里'], goal: 100, score: false,
      g: ['Cross the Kármán line at 100 km, a common definition of where space begins. · 越過 100 公里的卡門線（常用的太空界線）。'] },
    { id: 'l3', n: ['Mission 3', '任務三'], d: ['Lightest to 100 km', '最輕到達 100 公里'], goal: 100, score: true,
      g: ['Reach 100 km with the lowest liftoff mass you can. Your best result is saved on this device. · 以最輕的起飛質量到達 100 公里，最佳成績會儲存在此裝置。'] }
  ];
  var level = 0, won = {};
  try { won = JSON.parse(localStorage.getItem('dawn2_won') || '{}') || {}; } catch (e) { won = {}; }
  function bestMass() { try { var b = parseFloat(localStorage.getItem('dawn2_best')); return isFinite(b) ? b : null; } catch (e) { return null; } }
  var lv = $('levels');
  LEVELS.forEach(function (L, i) {
    var b = document.createElement('button'); b.type = 'button';
    b.innerHTML = L.n[0] + ' · ' + L.n[1] + '<small>' + L.d[0] + ' · ' + L.d[1] + '</small>';
    b.addEventListener('click', function () { level = i; renderLevels(); });
    lv.appendChild(b);
  });
  function renderLevels() {
    lv.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('on', i === level); b.classList.toggle('won', !!won[LEVELS[i].id]); });
    $('goal').textContent = LEVELS[level].g[0];
    var bm = bestMass();
    $('best').textContent = bm ? 'Best (Mission 3) · 任務三最佳：' + fmt(bm, 2) + ' t' : '';
  }
  renderLevels();

  function design() {
    var F = Math.max(num('gF'), 0) * 1000, isp = Math.min(Math.max(num('gI'), 50), 460), mp = Math.max(num('gP'), 0) * 1000, md = Math.max(num('gD'), 0.2) * 1000;
    var m0 = mp + md, mdot = F > 0 ? F / (isp * G0) : 0;
    $('gTW').textContent = fmt(F / (m0 * G0), 2); $('gTW').className = F / (m0 * G0) > 1 ? 'good' : 'bad';
    $('gBurn').textContent = mdot > 0 ? fmt(mp / mdot, 0) + ' s' : '—';
    $('gM0').textContent = fmt(m0 / 1000, 2) + ' t';
    return { F: F, isp: isp, mp: mp, md: md, m0: m0, mdot: mdot };
  }
  ['gF', 'gI', 'gP', 'gD'].forEach(function (id) { $(id).addEventListener('input', design); });
  design();

  /* physics: vertical flight with gravity(h), exponential atmosphere and drag */
  function simulate(d) {
    var dt = 0.05, h = 0, v = 0, m = d.m0, prop = d.mp, t = 0, maxH = 0, maxV = 0, maxQ = 0, burnout = null, out = [];
    var CdA = 0.5 * 1.0;
    if (d.F <= d.m0 * G0) return { pts: [{ t: 0, h: 0, v: 0, p: 1, burn: d.F > 0 }], maxH: 0, maxV: 0, noLift: true, burnout: null };
    while (t < 3000) {
      var burning = prop > 0, F = burning ? d.F : 0;
      var g = G0 * Math.pow(RE / (RE + h), 2), rho = 1.225 * Math.exp(-h / 8500);
      var q = 0.5 * rho * v * v, drag = q * CdA * (v >= 0 ? 1 : -1);
      var a = (F - drag) / m - g;
      v += a * dt; h += v * dt; t += dt;
      if (burning) { var dm = d.mdot * dt; if (dm > prop) dm = prop; prop -= dm; m -= dm; if (prop <= 0 && burnout === null) burnout = t; }
      if (h < 0) { h = 0; if (t > 1) { out.push({ t: t, h: 0, v: v, p: prop / d.mp || 0, burn: false }); break; } v = Math.max(v, 0); }
      maxH = Math.max(maxH, h); maxV = Math.max(maxV, v); maxQ = Math.max(maxQ, q);
      if (out.length === 0 || t - out[out.length - 1].t >= 0.25) out.push({ t: t, h: h, v: v, p: d.mp ? prop / d.mp : 0, burn: burning });
      if (h > 2.0e6) break;
    }
    return { pts: out, maxH: maxH, maxV: maxV, maxQ: maxQ, burnout: burnout, noLift: false };
  }

  var sky = $('sky'), sctx = sky.getContext('2d'), SW = 700, SH = 520, anim = null;
  (function () { var dd = Math.min(window.devicePixelRatio || 1, 2); sky.width = SW * dd; sky.height = SH * dd; sctx.scale(dd, dd); })();
  function lerpColor(a, b, k) { return 'rgb(' + a.map(function (x, i) { return Math.round(x + (b[i] - x) * k); }).join(',') + ')'; }

  function drawSky(sim, idx, goalKm) {
    var p = sim.pts[Math.min(idx, sim.pts.length - 1)], hk = p.h / 1000;
    var topKm = Math.max(goalKm * 1.25, sim.maxH / 1000 * 1.1, 12);
    var k = Math.min(hk / 80, 1);
    var g = sctx.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, lerpColor([40, 90, 150], [3, 6, 12], k)); g.addColorStop(1, lerpColor([120, 170, 215], [8, 14, 24], k));
    sctx.fillStyle = g; sctx.fillRect(0, 0, SW, SH);
    if (k > .3) { for (var s = 0; s < 70; s++) { sctx.fillStyle = 'rgba(255,255,255,' + ((k - .3) * (0.3 + (s % 4) * .15)) + ')'; sctx.fillRect((s * 131) % SW, (s * 71) % SH, 1.4, 1.4); } }
    // altitude column (left) and chart (right)
    var colW = 220, base = SH - 40, top = 50;
    function yOf(km) { return base - (km / topKm) * (base - top); }
    sctx.fillStyle = 'rgba(29,42,54,.9)'; sctx.fillRect(0, base, SW, SH - base);
    sctx.strokeStyle = 'rgba(255,255,255,.12)'; sctx.lineWidth = 1; sctx.font = '11px IBM Plex Mono, monospace'; sctx.fillStyle = 'rgba(223,230,236,.7)';
    var step = topKm > 400 ? 100 : topKm > 150 ? 50 : topKm > 40 ? 20 : topKm > 15 ? 5 : 2;
    for (var km = 0; km <= topKm; km += step) { var y = yOf(km); sctx.beginPath(); sctx.moveTo(0, y); sctx.lineTo(SW, y); sctx.stroke(); sctx.fillText(km + ' km', 6, y - 4); }
    [[goalKm, '#ff7a3d', 'GOAL · 目標'], [100, '#6db2dc', 'Kármán line · 卡門線 100 km']].forEach(function (r, i) {
      if (r[0] > topKm || (i === 1 && goalKm === 100)) return;
      var yy = yOf(r[0]); sctx.strokeStyle = r[1]; sctx.setLineDash([6, 6]); sctx.lineWidth = 1.5;
      sctx.beginPath(); sctx.moveTo(0, yy); sctx.lineTo(SW, yy); sctx.stroke(); sctx.setLineDash([]);
      sctx.fillStyle = r[1]; sctx.fillText(r[2] + (i === 0 ? ' ' + r[0] + ' km' : ''), colW + 12, yy - 6);
    });
    // trajectory chart altitude vs time
    var tMax = Math.max(sim.pts[sim.pts.length - 1].t, 1), cx0 = colW + 10, cx1 = SW - 16;
    sctx.strokeStyle = '#ffb48a'; sctx.lineWidth = 2.2; sctx.beginPath();
    for (var i = 0; i <= Math.min(idx, sim.pts.length - 1); i++) {
      var q = sim.pts[i], x = cx0 + q.t / tMax * (cx1 - cx0), y2 = yOf(q.h / 1000);
      if (i) sctx.lineTo(x, y2); else sctx.moveTo(x, y2);
    }
    sctx.stroke();
    if (sim.burnout) { var bx = cx0 + sim.burnout / tMax * (cx1 - cx0); if (p.t >= sim.burnout) { sctx.fillStyle = 'rgba(223,230,236,.6)'; sctx.fillText('engine cut-off · 熄火', Math.min(bx + 4, SW - 130), base - 8); sctx.fillRect(bx, base - 4, 1, 4); } }
    // rocket in the column
    var ry = Math.max(top - 10, yOf(hk));
    drawRocket(sctx, colW / 2 + 20, ry, 1.1, p.burn, p.t);
    sctx.fillStyle = 'rgba(255,255,255,.08)'; sctx.fillRect(colW, top - 20, 1, base - top + 20);
    $('hT').textContent = p.t.toFixed(1); $('hH').textContent = hk.toFixed(1); $('hV').textContent = Math.round(p.v); $('hP').textContent = Math.round(p.p * 100);
  }

  function showResult(sim, d) {
    var L = LEVELS[level], maxKm = sim.maxH / 1000, ok = !sim.noLift && maxKm >= L.goal, r = $('result');
    var lines = '';
    if (sim.noLift) lines = '<h3 class="bad">No lift-off · 未能起飛</h3><p>Thrust is lower than the rocket\'s weight (T/W ≤ 1). Add thrust or reduce mass. · 推力小於重量，請增加推力或減輕質量。</p>';
    else {
      lines = '<h3 class="' + (ok ? 'good' : 'bad') + '">' + (ok ? '✓ Mission complete · 任務完成' : '✕ Not high enough · 高度不足') + '</h3>' +
        '<p>Max altitude · 最高高度 <b>' + fmt(maxKm, 1) + ' km</b><br>Max speed · 最高速度 <b>' + fmt(sim.maxV, 0) + ' m/s</b><br>Engine cut-off · 熄火 <b>T+' + fmt(sim.burnout || 0, 0) + ' s</b></p>';
      if (ok && L.score) {
        var bm = bestMass(), mt = d.m0 / 1000;
        if (!bm || mt < bm) { try { localStorage.setItem('dawn2_best', String(mt)); } catch (e) {} lines += '<p class="good">New best: ' + fmt(mt, 2) + ' t · 新紀錄</p>'; }
        else lines += '<p>Liftoff mass ' + fmt(mt, 2) + ' t — best is ' + fmt(bm, 2) + ' t. · 最佳紀錄 ' + fmt(bm, 2) + ' 噸</p>';
      }
      if (!ok) lines += '<p>Tip · 提示：' + (sim.maxV < 600 ? 'more propellant or a higher Isp gives more Δv. · 增加推進劑或比衝可提高 Δv。' : 'drag and gravity eat speed — a higher T/W or less dry mass helps. · 空氣阻力及重力會消耗速度，提高推重比或減輕乾重會有幫助。') + '</p>';
    }
    if (ok) { won[L.id] = true; try { localStorage.setItem('dawn2_won', JSON.stringify(won)); } catch (e) {} }
    r.innerHTML = lines; r.classList.add('show'); renderLevels();
  }

  function launch() {
    cancelAnimationFrame(anim); $('result').classList.remove('show');
    var d = design(), sim = simulate(d), goalKm = LEVELS[level].goal;
    if (sim.noLift) { drawSky(sim, 0, goalKm); showResult(sim, d); return; }
    var dur = reduce ? 0 : Math.min(10000, 3500 + sim.pts.length * 4), t0 = performance.now();
    $('launch').disabled = true;
    function frame(now) {
      var k = dur ? Math.min(Math.max((now - t0) / dur, 0), 1) : 1, idx = Math.max(0, Math.floor(k * (sim.pts.length - 1)));
      drawSky(sim, idx, goalKm);
      if (k < 1) anim = requestAnimationFrame(frame); else { $('launch').disabled = false; showResult(sim, d); }
    }
    anim = requestAnimationFrame(frame);
  }
  $('launch').addEventListener('click', launch);
  $('reset').addEventListener('click', function () {
    cancelAnimationFrame(anim); $('launch').disabled = false; $('result').classList.remove('show');
    [['gF', 100], ['gI', 220], ['gP', 3], ['gD', 2.5]].forEach(function (p) { $(p[0]).value = p[1]; $(p[0]).dispatchEvent(new Event('input', { bubbles: true })); });
    drawSky({ pts: [{ t: 0, h: 0, v: 0, p: 1, burn: false }], maxH: 0 }, 0, LEVELS[level].goal);
  });
  drawSky({ pts: [{ t: 0, h: 0, v: 0, p: 1, burn: false }], maxH: 0 }, 0, LEVELS[level].goal);
  lv.addEventListener('click', function () { if (!anim || $('launch').disabled === false) drawSky({ pts: [{ t: 0, h: 0, v: 0, p: 1, burn: false }], maxH: 0 }, 0, LEVELS[level].goal); });

  // expose the simulator for automated checks
  window.__dawnSim = { simulate: simulate, design: design };
})();
