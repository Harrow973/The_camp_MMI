(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  const startOverlayEl = document.getElementById('startOverlay');
  const startBtn = document.getElementById('startBtn');
  const gameOverEl = document.getElementById('gameOver');
  const finalScoreEl = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restart');

  const tileSize = 20;
  const cols = 19;
  const rows = 19;

  // 0=haut, 1=gauche, 2=bas, 3=droite
  const DIRS = [
    {x:0,y:-1},
    {x:-1,y:0},
    {x:0,y:1},
    {x:1,y:0}
  ];

  // Labyrinthe (1 = mur, 0 = chemin vide, 2 = pastille)
  const mazeBase = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,2,2,2,2,2,2,2,1,2,1,0,0,0],
    [1,1,1,1,2,1,2,1,1,0,1,1,2,1,2,1,1,1,1],
    [2,2,2,2,2,2,2,1,0,0,0,1,2,2,2,2,2,2,2],
    [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
    [0,0,0,1,2,1,2,2,2,2,2,2,2,1,2,1,0,0,0],
    [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  // vitesses (cases/seconde)
  const PAC_TPS = 5.0;
  const GHO_TPS = 4.8;

  // virages plus faciles (haut/bas)
  const TURN_WINDOW = 0.35;

  // Durée du jeu en secondes
  const GAME_DURATION = 30;

  let maze, score, pelletsRemaining;
  let pacman, ghosts;
  let gameRunning = false;
  let raf = null;
  let lastTs = null;
  let gameStartTime = null;
  let timeRemaining = GAME_DURATION;

  function cloneMaze(){ return mazeBase.map(r => r.slice()); }
  function countPellets(){
    let n=0;
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(maze[y][x]===2) n++;
    return n;
  }

  function wrapX(x){ return x<0 ? cols-1 : (x>=cols ? 0 : x); }
  function isWall(x,y){
    if(y<0 || y>=rows) return true;
    x = wrapX(x);
    return maze[y][x]===1;
  }
  function canMove(x,y,dir){
    const nx = wrapX(x + DIRS[dir].x);
    const ny = y + DIRS[dir].y;
    return !isWall(nx, ny);
  }

  function tileCenterX(x){ return (x+0.5)*tileSize; }
  function tileCenterY(y){ return (y+0.5)*tileSize; }

  function entityPos(e){
    const dx = DIRS[e.dir].x, dy = DIRS[e.dir].y;
    let nx = wrapX(e.tileX + dx);
    let ny = e.tileY + dy;
    if (isWall(nx,ny)) { nx = e.tileX; ny = e.tileY; }
    const x0 = tileCenterX(e.tileX), y0 = tileCenterY(e.tileY);
    const x1 = tileCenterX(nx),     y1 = tileCenterY(ny);
    return { x: x0 + (x1-x0)*e.progress, y: y0 + (y1-y0)*e.progress };
  }

  function drawMaze(){
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        if(maze[y][x]===1){
          ctx.fillStyle='#2121ff';
          ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
          ctx.strokeStyle='#4141ff';
          ctx.strokeRect(x*tileSize,y*tileSize,tileSize,tileSize);
        } else if(maze[y][x]===2){
          ctx.fillStyle='#ffb8ae';
          ctx.beginPath();
          ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2,3,0,Math.PI*2);
          ctx.fill();
        }
      }
    }
  }

  function drawPacman(dt){
    pacman.mouthT += dt*10;
    const p = entityPos(pacman);
    const mouth = Math.abs(Math.sin(pacman.mouthT))*0.45;
    const rot = [Math.PI*1.5, Math.PI, Math.PI*0.5, 0][pacman.dir];
    ctx.fillStyle='#ffff00';
    ctx.beginPath();
    ctx.arc(p.x,p.y,tileSize/2-2, rot+mouth, rot+Math.PI*2-mouth);
    ctx.lineTo(p.x,p.y);
    ctx.fill();
  }

  function drawGhosts(){
    ghosts.forEach(g=>{
      const p = entityPos(g);
      const x=p.x, y=p.y, r=tileSize/2-2;

      ctx.fillStyle=g.color;
      ctx.beginPath();
      ctx.arc(x,y-3,r,Math.PI,0);
      ctx.lineTo(x+r,y+r);
      ctx.lineTo(x+r/2,y+r/2);
      ctx.lineTo(x,y+r);
      ctx.lineTo(x-r/2,y+r/2);
      ctx.lineTo(x-r,y+r);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle='#fff';
      ctx.beginPath();
      ctx.arc(x-4,y-2,3,0,Math.PI*2);
      ctx.arc(x+4,y-2,3,0,Math.PI*2);
      ctx.fill();

      const pdx = DIRS[g.dir].x*0.8;
      const pdy = DIRS[g.dir].y*0.8;
      ctx.fillStyle='#0000ff';
      ctx.beginPath();
      ctx.arc(x-4+pdx,y-2+pdy,1.5,0,Math.PI*2);
      ctx.arc(x+4+pdx,y-2+pdy,1.5,0,Math.PI*2);
      ctx.fill();
    });
  }

  function eatPellet(){
    if(maze[pacman.tileY][pacman.tileX]===2){
      maze[pacman.tileY][pacman.tileX]=0;
      score += 10;
      pelletsRemaining--;
      scoreEl.textContent = 'Score: ' + score;
      if(pelletsRemaining===0) endGame(true, 'Toutes les pastilles ! 🎉');
    }
  }

  // CHASSE intelligente : choisir la meilleure direction vers Pac-Man
  function chooseChaseDir(g){
    let best = null;
    let bestDist = Infinity;

    for(let d=0; d<4; d++){
      if(!canMove(g.tileX,g.tileY,d)) continue;
      const nx = wrapX(g.tileX + DIRS[d].x);
      const ny = g.tileY + DIRS[d].y;
      const dist = Math.abs(nx - pacman.tileX) + Math.abs(ny - pacman.tileY);

      if(dist < bestDist || (dist === bestDist && Math.random() < 0.35)){
        bestDist = dist;
        best = d;
      }
    }

    if(best !== null) g.dir = best;
  }

  // Déplacement "case par case" animé
  function updateEntity(e, tps, dt, onEnterTile){
    let remaining = tps * dt;
    while(remaining > 0){
      if(!canMove(e.tileX,e.tileY,e.dir)){ e.progress = 0; break; }
      const step = Math.min(remaining, 1 - e.progress);
      e.progress += step;
      remaining -= step;

      if(e.progress >= 1 - 1e-9){
        e.progress = 0;
        e.tileX = wrapX(e.tileX + DIRS[e.dir].x);
        e.tileY = e.tileY + DIRS[e.dir].y;
        if(onEnterTile) onEnterTile(e);
      } else break;
    }
  }

  function update(dt){
    // Mise à jour du minuteur
    const elapsed = (performance.now() - gameStartTime) / 1000;
    timeRemaining = Math.max(0, GAME_DURATION - elapsed);
    timerEl.textContent = Math.ceil(timeRemaining) + 's';
    
    // Vérifier si le temps est écoulé
    if(timeRemaining <= 0){
      endGame(true, 'Temps écoulé - Victoire ! 🎉');
      return;
    }

    // Pac-Man : buffer + virage facile
    if (pacman.progress < TURN_WINDOW) {
      if (canMove(pacman.tileX, pacman.tileY, pacman.nextDir)) pacman.dir = pacman.nextDir;
    }
    updateEntity(pacman, PAC_TPS, dt, () => eatPellet());

    // Fantômes : sortie puis chasse
    ghosts.forEach(g => {
      if (g.progress === 0) {
        // Si encore en mode sortie
        if (g.exitSteps > 0) {
          // Forcer la direction de sortie
          if (canMove(g.tileX, g.tileY, g.exitDir)) {
            g.dir = g.exitDir;
          }
          g.exitSteps--;
        } else {
          // Mode chasse normal
          chooseChaseDir(g);
        }
      }
      updateEntity(g, GHO_TPS, dt, null);
    });

    // collision
    const p = entityPos(pacman);
    for(const g of ghosts){
      const gp = entityPos(g);
      if(Math.hypot(gp.x - p.x, gp.y - p.y) < tileSize * 0.55){
        endGame(false, 'Game Over! 👻');
        return;
      }
    }
  }

  function draw(dt){
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    drawMaze();
    drawPacman(dt);
    drawGhosts();
  }

  function loop(ts){
    if(!gameRunning) return;
    if(lastTs===null) lastTs=ts;
    let dt=(ts-lastTs)/1000;
    lastTs=ts;
    dt=Math.min(dt,0.05);

    update(dt);
    draw(dt);
    raf=requestAnimationFrame(loop);
  }

  function endGame(won, message){
    gameRunning=false;
    cancelAnimationFrame(raf);

    gameOverEl.style.display='block';
    gameOverEl.querySelector('h2').textContent = message;
    gameOverEl.querySelector('h2').style.color = won ? '#00ff00' : '#ff0000';
    finalScoreEl.textContent='Score final: '+score;
  }

  function resetGame(){
    maze = cloneMaze();
    score = 0;
    scoreEl.textContent='Score: 0';
    timeRemaining = GAME_DURATION;
    timerEl.textContent = GAME_DURATION + 's';
    pelletsRemaining = countPellets();

    pacman = { tileX: 9, tileY: 13, dir: 3, nextDir: 3, progress: 0, mouthT: 0 };
    eatPellet();

    // 2 fantômes avec sortie simplifiée
    // Fantôme rouge : sort vers le haut (2 cases)
    // Fantôme rose : sort vers le haut (3 cases)
    ghosts = [
      { tileX: 9,  tileY: 9, dir: 0, progress: 0, color:'#ff0000', exitDir: 0, exitSteps: 2 },
      { tileX: 10, tileY: 9, dir: 0, progress: 0, color:'#ffb8ff', exitDir: 0, exitSteps: 3 }
    ];

    lastTs=null;
    draw(0);
  }

  function startGame(){
    if(gameRunning) return;
    gameRunning=true;
    gameStartTime = performance.now();
    startOverlayEl.style.display='none';
    gameOverEl.style.display='none';
    lastTs=null;
    raf=requestAnimationFrame(loop);
  }

  // Controls
  function setDirection(dir){
    if(!gameRunning) return;
    pacman.nextDir = dir;
  }
  function bindBtn(id,dir){
    const el=document.getElementById(id);
    el.addEventListener('pointerdown',(e)=>{
      e.preventDefault();
      setDirection(dir);
    },{passive:false});
  }
  bindBtn('up',0); bindBtn('left',1); bindBtn('down',2); bindBtn('right',3);

  document.addEventListener('keydown',(e)=>{
    if(!gameRunning) return;
    switch(e.key){
      case 'ArrowUp': case 'z': case 'Z': e.preventDefault(); setDirection(0); break;
      case 'ArrowLeft': case 'q': case 'Q': e.preventDefault(); setDirection(1); break;
      case 'ArrowDown': case 's': case 'S': e.preventDefault(); setDirection(2); break;
      case 'ArrowRight': case 'd': case 'D': e.preventDefault(); setDirection(3); break;
    }
  });

  startBtn.addEventListener('click',()=>{ resetGame(); startGame(); });
  restartBtn.addEventListener('click',()=>{ resetGame(); startGame(); });

  resetGame();
})();


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
