const CANVAS_W = PARAMS.canvasW;
const CANVAS_H = PARAMS.canvasH;

const PAUSE_BTN = { x: CANVAS_W / 2 - 20, y: 2, w: 40, h: 20 };

function rectOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ── Background ─────────────────────────────────────────────────────────────
class Background {
  constructor() {
    this.layers = [
      { stars: [], speed: 40,  count: 70, minSize: 0.8, maxSize: 1.2 },
      { stars: [], speed: 100, count: 30, minSize: 1.5, maxSize: 2.5 },
    ];
    for (const layer of this.layers) {
      for (let i = 0; i < layer.count; i++) {
        layer.stars.push({
          x: Math.random() * CANVAS_W,
          y: Math.random() * CANVAS_H,
          size: layer.minSize + Math.random() * (layer.maxSize - layer.minSize),
        });
      }
    }
  }

  update(dt) {
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        star.y += layer.speed * dt;
        if (star.y > CANVAS_H + 2) {
          star.y = -2;
          star.x = Math.random() * CANVAS_W;
        }
      }
    }
  }

  draw(ctx) {
    for (const layer of this.layers) {
      ctx.fillStyle = '#fff';
      for (const star of layer.stars) {
        ctx.globalAlpha = layer.speed > 50 ? 0.9 : 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ── Particle ───────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 140;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 0.5 + Math.random() * 0.5;
    this.maxLife = this.life;
    this.color = color;
    this.size = 2 + Math.random() * 3;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  isDead() { return this.life <= 0; }
}

// ── Bullet ─────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, vx, vy, isEnemy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isEnemy = isEnemy;
    this.w = isEnemy ? 8 : 5;
    this.h = isEnemy ? 8 : 14;
    this._dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = this.isEnemy ? '#f88' : '#ff8';
    ctx.fillRect(this.x - this.w / 2 - 2, this.y - this.h / 2 - 2, this.w + 4, this.h + 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.isEnemy ? '#f44' : '#ffe000';
    ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
  }

  isOutOfBounds() {
    return this.x < -30 || this.x > CANVAS_W + 30 ||
           this.y < -30 || this.y > CANVAS_H + 30;
  }
}

// ── Player ─────────────────────────────────────────────────────────────────
class Player {
  constructor() { this.reset(); }

  reset() {
    this.x = CANVAS_W / 2;
    this.y = CANVAS_H - 70;
    this.w = 32;
    this.h = 36;
    this.speed = PARAMS.playerSpeed;
    this.hp = PARAMS.playerHp;
    this.shootTimer = 0;
    this.shootInterval = PARAMS.shootInterval;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.bullets = [];
  }

  update(dt, keys, touchPos) {
    if (touchPos) {
      const spd = 18;
      this.x += (touchPos.x - this.x) * Math.min(1, spd * dt);
      this.y += (touchPos.y - this.y) * Math.min(1, spd * dt);
    } else {
      let dx = 0, dy = 0;
      if (keys.has('ArrowLeft')  || keys.has('KeyA')) dx -= 1;
      if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
      if (keys.has('ArrowUp')    || keys.has('KeyW')) dy -= 1;
      if (keys.has('ArrowDown')  || keys.has('KeyS')) dy += 1;
      if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
    }

    this.x = Math.max(this.w / 2, Math.min(CANVAS_W - this.w / 2, this.x));
    this.y = Math.max(this.h / 2, Math.min(CANVAS_H - this.h / 2, this.y));

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shoot();
      this.shootTimer = this.shootInterval;
    }

    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    for (const b of this.bullets) b.update(dt);
    this.bullets = this.bullets.filter(b => !b.isOutOfBounds() && !b._dead);
  }

  shoot() {
    this.bullets.push(new Bullet(this.x, this.y - this.h / 2 - 2, 0, -PARAMS.playerBulletSpeed, false));
    if (window.audioManager) window.audioManager.shoot();
  }

  takeDamage() {
    if (this.invincible) return false;
    this.hp--;
    this.invincible = true;
    this.invincibleTimer = PARAMS.invincibleDuration;
    if (window.audioManager) window.audioManager.playerHit();
    return true;
  }

  draw(ctx) {
    if (this.invincible && Math.floor(this.invincibleTimer * 8) % 2 === 0) {
      for (const b of this.bullets) b.draw(ctx);
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = '#2af';
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 2);
    ctx.lineTo(this.w / 2,  this.h / 3);
    ctx.lineTo(this.w / 4,  this.h / 6);
    ctx.lineTo(-this.w / 4, this.h / 6);
    ctx.lineTo(-this.w / 2, this.h / 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6cf';
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 2);
    ctx.lineTo(this.w / 3, this.h / 4);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#acf';
    ctx.beginPath();
    ctx.ellipse(0, -this.h / 6, this.w / 5, this.h / 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f80';
    ctx.globalAlpha = 0.85;
    for (const ex of [-this.w / 4, this.w / 4]) {
      ctx.beginPath();
      ctx.ellipse(ex, this.h / 2 + 4, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
    for (const b of this.bullets) b.draw(ctx);
  }

  getHitBox() {
    return {
      x: this.x - this.w / 2 * 0.65,
      y: this.y - this.h / 2 * 0.75,
      w: this.w * 0.65,
      h: this.h * 0.75,
    };
  }
}

// ── Enemy ──────────────────────────────────────────────────────────────────
class Enemy {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.time = 0;
    this.bullets = [];
    this._dead = false;

    switch (type) {
      case 'grunt':
        this.w = 28; this.h = 22;
        this.hp = PARAMS.gruntHp; this.maxHp = PARAMS.gruntHp;
        this.vy = PARAMS.gruntSpeedMin + Math.random() * PARAMS.gruntSpeedRange;
        this.score = PARAMS.gruntScore;
        this.shootInterval = 99999;
        break;
      case 'medium':
        this.w = 36; this.h = 28;
        this.hp = PARAMS.mediumHp; this.maxHp = PARAMS.mediumHp;
        this.vy = PARAMS.mediumSpeedMin + Math.random() * PARAMS.mediumSpeedRange;
        this.score = PARAMS.mediumScore;
        this.shootInterval = PARAMS.mediumShootMin + Math.random() * PARAMS.mediumShootRange;
        break;
      case 'boss':
        this.w = 80; this.h = 60;
        this.hp = PARAMS.bossHp; this.maxHp = PARAMS.bossHp;
        this.vy = PARAMS.bossSpeed;
        this.score = PARAMS.bossScore;
        this.shootInterval = PARAMS.bossShootInterval;
        this.phase = 0;
        this.arrived = false;
        this.oscillationTime = 0;
        break;
    }
    this.shootTimer = this.shootInterval * Math.random() + 0.5;
  }

  update(dt) {
    this.time += dt;

    if (this.type === 'grunt') {
      this.y += this.vy * dt;
    } else if (this.type === 'medium') {
      this.y += this.vy * dt;
      this.x = this.baseX + Math.sin(this.time * 1.8) * 55;
    } else if (this.type === 'boss') {
      if (this.y < PARAMS.bossArrivalY) {
        this.y = Math.min(PARAMS.bossArrivalY, this.y + this.vy * dt);
      }
      if (this.y >= PARAMS.bossArrivalY) {
        if (!this.arrived) { this.arrived = true; this.oscillationTime = 0; }
        this.oscillationTime += dt;
        // -sin: at t=0 → x=center, first movement goes LEFT
        this.x = CANVAS_W / 2 - Math.sin(this.oscillationTime * PARAMS.bossOscillationSpeed) * PARAMS.bossOscillationAmp;
        if (this.hp < this.maxHp * 0.5 && this.phase === 0) {
          this.phase = 1; this.shootInterval = PARAMS.bossShootIntervalP1;
        }
        if (this.hp < this.maxHp * 0.25 && this.phase === 1) {
          this.phase = 2; this.shootInterval = PARAMS.bossShootIntervalP2;
        }
      }
    }

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.firePattern();
      this.shootTimer = this.shootInterval;
    }

    for (const b of this.bullets) b.update(dt);
    this.bullets = this.bullets.filter(b => !b.isOutOfBounds() && !b._dead);
  }

  firePattern() {
    const ox = this.x;
    const oy = this.y + this.h / 2;

    if (this.type === 'medium') {
      this.bullets.push(new Bullet(ox, oy, 0, 230, true));
    } else if (this.type === 'boss') {
      if (this.phase === 0) {
        for (const a of [-0.25, 0, 0.25]) {
          this.bullets.push(new Bullet(ox, oy, Math.sin(a) * 260, Math.cos(a) * 260, true));
        }
      } else if (this.phase === 1) {
        for (let i = -2; i <= 2; i++) {
          const a = i * 0.2;
          this.bullets.push(new Bullet(ox, oy, Math.sin(a) * 280, Math.cos(a) * 280, true));
        }
      } else {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + this.time;
          this.bullets.push(new Bullet(this.x, this.y, Math.cos(a) * 210, Math.sin(a) * 210, true));
        }
      }
    }
  }

  takeDamage(amount = 1) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  isOutOfBounds() {
    return this.y > CANVAS_H + this.h + 10;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'grunt') {
      ctx.fillStyle = '#e03030';
      ctx.beginPath();
      ctx.moveTo(0, -this.h / 2);
      ctx.lineTo(this.w / 2, 0);
      ctx.lineTo(0, this.h / 2);
      ctx.lineTo(-this.w / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f88';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (this.type === 'medium') {
      ctx.fillStyle = '#e06000';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? this.w / 2 : this.w * 0.35;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.85);
        else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.85);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fca';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      this._drawHpBar(ctx);

    } else if (this.type === 'boss') {
      ctx.fillStyle = '#8a0000';
      ctx.beginPath();
      ctx.moveTo(0,             this.h / 2);
      ctx.lineTo(this.w / 2,   -this.h / 3);
      ctx.lineTo(this.w * 0.3, -this.h / 2);
      ctx.lineTo(-this.w * 0.3, -this.h / 2);
      ctx.lineTo(-this.w / 2,  -this.h / 3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#c00';
      ctx.beginPath();
      ctx.moveTo(0, this.h / 2);
      ctx.lineTo(this.w * 0.25, -this.h * 0.1);
      ctx.lineTo(-this.w * 0.25, -this.h * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#f44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -this.h * 0.15, this.w * 0.2, this.h * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f00';
      ctx.fill();
    }

    ctx.restore();
    for (const b of this.bullets) b.draw(ctx);
  }

  _drawHpBar(ctx) {
    const bw = this.w, bx = -bw / 2, by = this.h / 2 + 6;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, 4);
    ctx.fillStyle = '#0d0';
    ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 4);
  }

  getHitBox() {
    return {
      x: this.x - this.w / 2 * 0.8,
      y: this.y - this.h / 2 * 0.8,
      w: this.w * 0.8,
      h: this.h * 0.8,
    };
  }
}

// ── EnemySpawner ───────────────────────────────────────────────────────────
class EnemySpawner {
  constructor() { this.reset(); }

  reset() {
    this.timer = 0;
    this.waveTimer = 0;
    this.bossSpawned = false;
  }

  update(dt, score, enemies) {
    const hasBoss = enemies.some(e => e.type === 'boss');

    if (score >= PARAMS.bossSpawnScore && !this.bossSpawned && !hasBoss) {
      this.bossSpawned = true;
      enemies.push(new Enemy('boss', CANVAS_W / 2, -100));
      if (window.audioManager) window.audioManager.startBossBGM();
      return;
    }

    if (hasBoss) return;

    this.timer += dt;
    this.waveTimer += dt;

    const interval = Math.max(PARAMS.spawnIntervalMin, PARAMS.spawnIntervalBase - score / PARAMS.spawnIntervalDecay);
    if (this.timer >= interval) {
      this.timer = 0;
      const x = 40 + Math.random() * (CANVAS_W - 80);
      if (Math.random() < PARAMS.gruntRatio || score < PARAMS.gruntOnlyBelow) {
        enemies.push(new Enemy('grunt', x, -30));
      } else {
        enemies.push(new Enemy('medium', x, -30));
      }
    }

    if (this.waveTimer >= PARAMS.waveInterval) {
      this.waveTimer = 0;
      for (let i = 0; i < 3; i++) {
        enemies.push(new Enemy('grunt', 60 + i * 120, -30 - i * 20));
      }
    }
  }
}

// ── HUD ────────────────────────────────────────────────────────────────────
class HUD {
  draw(ctx, score, hp, boss) {
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 8, 22);

    ctx.textAlign = 'right';
    ctx.font = '17px monospace';
    const hearts = '♥'.repeat(Math.max(0, hp)) + '♡'.repeat(Math.max(0, 3 - hp));
    ctx.fillText('HP: ' + hearts, CANVAS_W - 8, 22);

    if (boss) {
      const bw = CANVAS_W - 40, bh = 14;
      const bx = 20, by = 32;
      ctx.fillStyle = '#444';
      ctx.fillRect(bx, by, bw, bh);
      const ratio = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = ratio > 0.5 ? '#0d0' : ratio > 0.25 ? '#dd0' : '#f00';
      ctx.fillRect(bx, by, bw * ratio, bh);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', CANVAS_W / 2, by + bh - 2);
    }

    ctx.textAlign = 'left';
  }
}

// ── Game ───────────────────────────────────────────────────────────────────
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keys = new Set();
    this.touchPos = null;
    this._touchingPlayer = false;
    this.state = 'start';
    this.score = 0;
    this.hiScore = 0;

    this.bg = new Background();
    this.player = new Player();
    this.enemies = [];
    this.particles = [];
    this.spawner = new EnemySpawner();
    this.hud = new HUD();
    this._lastTime = null;

    // pause
    this._paused = false;

    // game over timer
    this._gameOverTimer = 0;

    // hit stop & time effects
    this._hitStopTimer = 0;
    this._timeScale = 1;
    this._slowTimer = 0;

    // screen flash (separate channels for player-hit red and boss-defeat white)
    this._flashRed   = 0;
    this._flashWhite = 0;

    // boss defeat animation
    this._bossDefeatTimer    = 0;
    this._bossDefeatDuration = 2.5;
    this._bossExplosionTimer = 0;
    this._bossX = 0;
    this._bossY = 0;

    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (this.state === 'start'    && e.code === 'Space') this.startGame();
      if (this.state === 'gameover' && e.code === 'KeyR')  this.continueGame();
      if (this.state === 'clear'    && e.code === 'KeyR')  this.startGame();
      if (this.state === 'playing'  && (e.code === 'KeyP' || e.code === 'Escape')) {
        this._togglePause();
      }
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));

    const opts = { passive: false };
    canvas.addEventListener('touchstart', e => { e.preventDefault(); this._onTouchStart(e); }, opts);
    canvas.addEventListener('touchmove',  e => { e.preventDefault(); this._onTouchMove(e);  }, opts);
    canvas.addEventListener('touchend',   e => { e.preventDefault(); this.touchPos = null; this._touchingPlayer = false; }, opts);

    canvas.setAttribute('tabindex', '0');
    canvas.focus();
  }

  _togglePause() {
    this._paused = !this._paused;
    if (window.audioManager) {
      if (this._paused) window.audioManager.pauseBGM();
      else              window.audioManager.resumeBGM();
    }
  }

  _isTouchOnPlayer(tx, ty) {
    const p = this.player;
    const margin = 24;
    return tx >= p.x - p.w / 2 - margin && tx <= p.x + p.w / 2 + margin &&
           ty >= p.y - p.h / 2 - margin && ty <= p.y + p.h / 2 + margin;
  }

  _onTouchStart(e) {
    // iOS BGM unlock: play() は最初のユーザー操作内で呼ぶ必要がある
    if (window.audioManager) window.audioManager.unlock();

    if (this.state === 'start')    { this.startGame();    return; }
    if (this.state === 'gameover') { this.continueGame(); return; }
    if (this.state === 'clear')    { this.startGame();    return; }

    if (this.state === 'playing') {
      if (this._paused) { this._togglePause(); return; }

      const touch = e.touches[0];
      if (!touch) return;
      const rect = this.canvas.getBoundingClientRect();
      const tx = (touch.clientX - rect.left) * (CANVAS_W / rect.width);
      const ty = (touch.clientY - rect.top)  * (CANVAS_H / rect.height);

      if (tx >= PAUSE_BTN.x && tx <= PAUSE_BTN.x + PAUSE_BTN.w &&
          ty >= PAUSE_BTN.y && ty <= PAUSE_BTN.y + PAUSE_BTN.h) {
        this._togglePause();
        return;
      }

      // 自機の上でタッチを開始した場合のみ追従を開始する
      if (this._isTouchOnPlayer(tx, ty)) {
        this._touchingPlayer = true;
        this.touchPos = { x: tx, y: ty };
      }
    }
  }

  _onTouchMove(e) {
    if (this.state !== 'playing' || this._paused || !this._touchingPlayer) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = this.canvas.getBoundingClientRect();
    this.touchPos = {
      x: (touch.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (touch.clientY - rect.top)  * (CANVAS_H / rect.height),
    };
  }

  startGame() {
    this.score = 0;
    this.touchPos = null;
    this._touchingPlayer = false;
    this.player.reset();
    this.enemies = [];
    this.particles = [];
    this.spawner.reset();
    this._paused = false;
    this._gameOverTimer = 0;
    this._hitStopTimer = 0;
    this._timeScale = 1;
    this._slowTimer = 0;
    this._flashRed = 0;
    this._flashWhite = 0;
    this._bossDefeatTimer = 0;
    this._bossExplosionTimer = 0;
    this.state = 'playing';
    if (window.audioManager) window.audioManager.startBGM();
  }

  continueGame() {
    this.touchPos = null;
    this._touchingPlayer = false;
    const px = this.player.x;
    const py = this.player.y;
    this.player.reset();
    this.player.x = px;
    this.player.y = py;
    this.player.invincible = true;
    this.player.invincibleTimer = 3.0;
    this._gameOverTimer = 0;
    this._paused = false;
    this._hitStopTimer = 0;
    this._timeScale = 1;
    this._slowTimer = 0;
    this._flashRed = 0;
    this._flashWhite = 0;
    this.state = 'playing';
    const hasBoss = this.enemies.some(e => e.type === 'boss');
    if (window.audioManager) {
      if (hasBoss) window.audioManager.startBossBGM();
      else         window.audioManager.startBGM();
    }
  }

  spawnExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
    if (window.audioManager) window.audioManager.explode(count > 20);
  }

  update(dt) {
    if (this._paused) return;

    // flash decay runs every frame regardless of hit stop
    if (this._flashRed   > 0) this._flashRed   = Math.max(0, this._flashRed   - dt * 9);
    if (this._flashWhite > 0) this._flashWhite = Math.max(0, this._flashWhite - dt * 2.5);

    // hit stop: freeze all game logic, only decrement the timer
    if (this._hitStopTimer > 0) {
      this._hitStopTimer -= dt;
      return;
    }

    // slow-motion countdown
    if (this._timeScale < 1) {
      this._slowTimer -= dt;
      if (this._slowTimer <= 0) this._timeScale = 1;
    }
    const eff = dt * this._timeScale;

    this.bg.update(eff);

    // ── boss defeat animation ───────────────────────────────────────────
    if (this.state === 'boss_defeat') {
      this._bossDefeatTimer += dt;
      this._bossExplosionTimer -= dt;
      if (this._bossExplosionTimer <= 0) {
        this._bossExplosionTimer = 0.14 + Math.random() * 0.14;
        const rx = this._bossX + (Math.random() - 0.5) * 100;
        const ry = this._bossY + (Math.random() - 0.5) * 80;
        const colors = ['#f44', '#f80', '#ff0', '#fff', '#f8a'];
        this.spawnExplosion(rx, ry, colors[Math.floor(Math.random() * colors.length)], 18);
      }
      for (const p of this.particles) p.update(eff);
      this.particles = this.particles.filter(p => !p.isDead());
      if (this._bossDefeatTimer >= this._bossDefeatDuration) {
        this.hiScore = Math.max(this.hiScore, this.score);
        this.state = 'clear';
      }
      return;
    }

    // ── game over timer ─────────────────────────────────────────────────
    if (this.state === 'gameover') {
      this._gameOverTimer += dt;
      if (this._gameOverTimer >= 4.0) { this.continueGame(); return; }
      return;
    }

    if (this.state === 'clear') return;
    if (this.state !== 'playing') return;

    // ── normal gameplay ─────────────────────────────────────────────────
    this.player.update(eff, this.keys, this.touchPos);
    this.spawner.update(eff, this.score, this.enemies);

    for (const e of this.enemies) e.update(eff);
    for (const p of this.particles) p.update(eff);

    this.particles = this.particles.filter(p => !p.isDead());
    this.enemies = this.enemies.filter(e => e.type === 'boss' || !e.isOutOfBounds());

    this.checkCollisions();

    if (this.player.hp <= 0) {
      this.spawnExplosion(this.player.x, this.player.y, '#4af', 24);
      this.hiScore = Math.max(this.hiScore, this.score);
      this.state = 'gameover';
      if (window.audioManager) window.audioManager.stopBGM();
    }
  }

  checkCollisions() {
    const pb = this.player.getHitBox();

    for (const bullet of this.player.bullets) {
      if (bullet._dead) continue;
      const bb = { x: bullet.x - bullet.w / 2, y: bullet.y - bullet.h / 2, w: bullet.w, h: bullet.h };
      for (const enemy of this.enemies) {
        if (enemy._dead) continue;
        if (rectOverlap(bb, enemy.getHitBox())) {
          bullet._dead = true;
          if (enemy.takeDamage(1)) {
            enemy._dead = true;
            this.score += enemy.score;
            const color = enemy.type === 'grunt' ? '#f88'
                        : enemy.type === 'medium' ? '#fa8' : '#f44';
            this.spawnExplosion(enemy.x, enemy.y, color, enemy.type === 'boss' ? 50 : 14);

            if (enemy.type === 'boss') {
              if (window.audioManager) {
                window.audioManager.stopBGM();
                window.audioManager.bossDefeat();
              }
              // store boss position for death animation
              this._bossX = enemy.x;
              this._bossY = enemy.y;
              this._bossDefeatTimer = 0;
              this._bossExplosionTimer = 0;
              // effects: hit stop → slow-mo + flash
              this._hitStopTimer = 0.35;
              this._flashWhite = 1.0;
              this.state = 'boss_defeat';
            }
          }
          break;
        }
      }
    }

    this.enemies = this.enemies.filter(e => !e._dead);

    if (this.state === 'boss_defeat') return;

    for (const enemy of this.enemies) {
      for (const bullet of enemy.bullets) {
        if (bullet._dead) continue;
        const bb = { x: bullet.x - bullet.w / 2, y: bullet.y - bullet.h / 2, w: bullet.w, h: bullet.h };
        if (rectOverlap(bb, pb)) {
          bullet._dead = true;
          if (this.player.takeDamage()) {
            this._hitStopTimer = 0.06;
            this._flashRed = 0.8;
          }
        }
      }
    }

    for (const enemy of this.enemies) {
      if (rectOverlap(pb, enemy.getHitBox())) {
        if (this.player.takeDamage()) {
          this._hitStopTimer = 0.06;
          this._flashRed = 0.8;
        }
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#00000f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.bg.draw(ctx);

    if (this.state === 'start') { this._drawStartScreen(ctx); return; }
    if (this.state === 'clear') { this._drawClearScreen(ctx);  return; }

    // boss defeat animation: show particles + player (frozen) + flash
    if (this.state === 'boss_defeat') {
      this.player.draw(ctx);
      for (const p of this.particles) p.draw(ctx);
      if (this._flashWhite > 0) {
        ctx.fillStyle = `rgba(255,255,255,${this._flashWhite})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
      return;
    }

    // normal playing / gameover
    for (const e of this.enemies) e.draw(ctx);
    this.player.draw(ctx);
    for (const p of this.particles) p.draw(ctx);

    // red flash on player hit
    if (this._flashRed > 0) {
      ctx.fillStyle = `rgba(255,50,50,${this._flashRed * 0.45})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    const boss = this.enemies.find(e => e.type === 'boss') || null;
    this.hud.draw(ctx, this.score, this.player.hp, boss);

    // pause button
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.fillRect(PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('II', CANVAS_W / 2, PAUSE_BTN.y + PAUSE_BTN.h - 5);
    ctx.textAlign = 'left';

    if (this.state === 'gameover') this._drawGameOver(ctx);
    if (this._paused) this._drawPause(ctx);
  }

  _drawStartScreen(ctx) {
    ctx.fillStyle = 'rgba(0,0,16,0.75)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#2af';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('SPACE RUNNER', CANVAS_W / 2, CANVAS_H / 2 - 90);

    ctx.fillStyle = '#adf';
    ctx.font = '13px monospace';
    ctx.fillText('タッチ / 矢印キー : 移動', CANVAS_W / 2, CANVAS_H / 2 - 20);
    ctx.fillText('弾は自動連射', CANVAS_W / 2, CANVAS_H / 2 + 8);
    ctx.fillText(`スコア ${PARAMS.bossSpawnScore} でボス出現`, CANVAS_W / 2, CANVAS_H / 2 + 36);
    ctx.fillStyle = '#88a';
    ctx.font = '12px monospace';
    ctx.fillText('P / ESC または ⏸ で一時停止', CANVAS_W / 2, CANVAS_H / 2 + 60);

    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    ctx.fillStyle = blink ? '#ff0' : 'rgba(255,255,0,0)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('タップ / SPACE でスタート', CANVAS_W / 2, CANVAS_H / 2 + 94);

    if (this.hiScore > 0) {
      ctx.fillStyle = '#f80';
      ctx.font = '13px monospace';
      ctx.fillText(`HI-SCORE: ${this.hiScore}`, CANVAS_W / 2, CANVAS_H / 2 + 126);
    }

    ctx.textAlign = 'left';
  }

  _drawClearScreen(ctx) {
    ctx.fillStyle = 'rgba(0,0,24,0.85)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 38px monospace';
    ctx.fillText('STAGE CLEAR!', CANVAS_W / 2, CANVAS_H / 2 - 70);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`SCORE: ${this.score}`, CANVAS_W / 2, CANVAS_H / 2 - 10);

    ctx.fillStyle = '#f80';
    ctx.font = '14px monospace';
    ctx.fillText(`HI-SCORE: ${this.hiScore}`, CANVAS_W / 2, CANVAS_H / 2 + 18);
    if (this.score >= this.hiScore && this.score > 0) {
      ctx.fillStyle = '#ff0';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('★ NEW RECORD! ★', CANVAS_W / 2, CANVAS_H / 2 + 40);
    }

    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    ctx.fillStyle = blink ? '#ff0' : 'rgba(255,255,0,0)';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('タップ / R でタイトルへ', CANVAS_W / 2, CANVAS_H / 2 + 80);

    ctx.textAlign = 'left';
  }

  _drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 44px monospace';
    ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`SCORE: ${this.score}`, CANVAS_W / 2, CANVAS_H / 2 + 10);

    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    ctx.fillStyle = blink ? '#ff0' : 'rgba(255,255,0,0)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('タップ / R で再開', CANVAS_W / 2, CANVAS_H / 2 + 52);

    const countdown = Math.max(0, Math.ceil(4.0 - this._gameOverTimer));
    ctx.fillStyle = '#888';
    ctx.font = '13px monospace';
    ctx.fillText(`${countdown}秒後に自動再開`, CANVAS_W / 2, CANVAS_H / 2 + 78);

    ctx.textAlign = 'left';
  }

  _drawPause(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px monospace';
    ctx.fillText('PAUSE', CANVAS_W / 2, CANVAS_H / 2 - 16);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('タップ・P・ESC でつづける', CANVAS_W / 2, CANVAS_H / 2 + 26);

    ctx.textAlign = 'left';
  }

  gameLoop(timestamp) {
    if (this._lastTime === null) this._lastTime = timestamp;
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05);
    this._lastTime = timestamp;
    this.update(dt);
    this.draw();
    requestAnimationFrame(ts => this.gameLoop(ts));
  }

  start() {
    requestAnimationFrame(ts => this.gameLoop(ts));
  }
}

// ── Entry Point ────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);
  game.start();
});
