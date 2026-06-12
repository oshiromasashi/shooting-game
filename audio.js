// BGM (mp3) + SFX (Web Audio API)

class AudioManager {
  constructor() {
    this._ac = null;
    this._master = null;
    this._bgm = null;
    // Preload both tracks
    this._tracks = {
      normal: Object.assign(new Audio('bgm.mp3'),  { loop: true, volume: 0.5 }),
      boss:   Object.assign(new Audio('bgm2.mp3'), { loop: true, volume: 0.5 }),
    };
  }

  _init() {
    if (this._ac) return;
    this._ac = new (window.AudioContext || window.webkitAudioContext)();
    this._master = this._ac.createGain();
    this._master.gain.value = 0.45;
    this._master.connect(this._ac.destination);
  }

  _resume() {
    if (this._ac && this._ac.state === 'suspended') this._ac.resume();
  }

  // ── BGM ───────────────────────────────────────────────────────────────────

  _playBGM(key) {
    if (this._bgm) {
      this._bgm.pause();
      this._bgm.currentTime = 0;
    }
    this._bgm = this._tracks[key];
    this._bgm.play().catch(() => {});
  }

  startBGM()     { this._playBGM('normal'); }
  startBossBGM() { this._playBGM('boss'); }

  pauseBGM() {
    if (this._bgm && !this._bgm.paused) this._bgm.pause();
  }

  resumeBGM() {
    if (this._bgm && this._bgm.paused) this._bgm.play().catch(() => {});
  }

  stopBGM() {
    if (!this._bgm) return;
    this._bgm.pause();
    this._bgm.currentTime = 0;
    this._bgm = null;
  }

  // ── SFX helpers ───────────────────────────────────────────────────────────

  _tone(freq, t, dur, type = 'square', vol = 0.12) {
    if (!freq) return;
    const ac = this._ac;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g);
    g.connect(this._master);
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.setValueAtTime(vol, t + dur * 0.65);
    g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(dur * 0.98, t + 0.01));
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _kick(t) {
    const ac = this._ac;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g);
    g.connect(this._master);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  _makeNoiseBuf(dur) {
    const ac = this._ac;
    const size = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, size, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── SFX ───────────────────────────────────────────────────────────────────

  shoot() {
    this._init(); this._resume();
    const t = this._ac.currentTime;
    this._tone(1040, t,         0.04,  'square', 0.07);
    this._tone(880,  t + 0.015, 0.025, 'square', 0.04);
  }

  explode(large = false) {
    this._init(); this._resume();
    const ac = this._ac;
    const t = ac.currentTime;
    const dur = large ? 0.55 : 0.22;
    const vol = large ? 0.28 : 0.15;
    const buf = this._makeNoiseBuf(dur);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = large ? 500 : 1100;
    const g = ac.createGain();
    src.connect(f); f.connect(g); g.connect(this._master);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.start(t);
    src.stop(t + dur + 0.05);
    if (large) this._kick(t);
  }

  bossDefeat() {
    this._init(); this._resume();
    const ac = this._ac;
    const t = ac.currentTime;

    // Deep rumble (1.5s decaying noise)
    const buf = this._makeNoiseBuf(1.5);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(420, t);
    f.frequency.exponentialRampToValueAtTime(60, t + 1.2);
    const g = ac.createGain();
    src.connect(f); f.connect(g); g.connect(this._master);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    src.start(t);
    src.stop(t + 1.6);

    // Double kick punch
    this._kick(t);
    this._kick(t + 0.08);

    // Power-down sweep (660Hz → 40Hz over 1.1s)
    const osc = ac.createOscillator();
    const og = ac.createGain();
    osc.connect(og); og.connect(this._master);
    osc.type = 'square';
    osc.frequency.setValueAtTime(660, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(40, t + 1.1);
    og.gain.setValueAtTime(0.001, t + 0.06);
    og.gain.linearRampToValueAtTime(0.20, t + 0.12);
    og.gain.setValueAtTime(0.20, t + 0.45);
    og.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    osc.start(t + 0.06);
    osc.stop(t + 1.15);
  }

  playerHit() {
    this._init(); this._resume();
    const ac = this._ac;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g); g.connect(this._master);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.22);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

window.audioManager = new AudioManager();
