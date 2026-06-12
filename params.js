// ゲームパラメータ設定ファイル
// このファイルを編集することでゲームのバランスを調整できます

const PARAMS = {

  // ── キャンバスサイズ ──────────────────────────────────────────────────
  canvasW: 360,
  canvasH: 640,

  // ── 自機 ──────────────────────────────────────────────────────────────
  playerSpeed:          220,   // 移動速度 (px/s)
  playerHp:               3,   // 初期HP
  shootInterval:       0.15,   // 連射間隔 (秒)  小さいほど速い
  playerBulletSpeed:    630,   // 弾の速度 (px/s)
  invincibleDuration:   2.0,   // 被弾後の無敵時間 (秒)

  // ── 敵: 雑魚 (grunt) ─────────────────────────────────────────────────
  gruntHp:                1,
  gruntScore:           100,
  gruntSpeedMin:        110,   // 落下速度の最小値 (px/s)
  gruntSpeedRange:       70,   // 落下速度のランダム幅

  // ── 敵: 中型 (medium) ────────────────────────────────────────────────
  mediumHp:               4,
  mediumScore:          300,
  mediumSpeedMin:        70,
  mediumSpeedRange:      40,
  mediumShootMin:       2.2,   // 射撃間隔の最小値 (秒)
  mediumShootRange:     0.8,   // 射撃間隔のランダム幅

  // ── 敵: ボス ──────────────────────────────────────────────────────────
  bossHp:               150,
  bossScore:           5000,
  bossSpeed:             40,   // 登場時の降下速度 (px/s)
  bossArrivalY:         130,   // 停止するY座標
  bossOscillationAmp:   126,   // 横移動の振幅 (px)  ≈ 画面幅の35%
  bossOscillationSpeed: 0.7,   // 横移動の速さ (rad/s)  大きいほど速い
  bossShootInterval:    0.90,  // 射撃間隔 phase0 (秒)
  bossShootIntervalP1:  0.65,  //              phase1 (HP50%以下)
  bossShootIntervalP2:  0.45,  //              phase2 (HP25%以下)

  // ── スポーン ──────────────────────────────────────────────────────────
  bossSpawnScore:      3000,   // ボスが出現するスコア
  spawnIntervalMin:     0.6,   // 敵出現間隔の最小値 (秒)
  spawnIntervalBase:    2.2,   // 敵出現間隔の初期値 (秒)
  spawnIntervalDecay:  4000,   // スコアが増えると間隔が短くなる係数
  waveInterval:         9.0,   // 編隊出現間隔 (秒)
  gruntRatio:          0.65,   // grunt 出現確率
  gruntOnlyBelow:       600,   // このスコア未満は grunt のみ出現

};
