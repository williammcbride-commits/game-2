// ===============================
// ULTIMATE CITY CHASE – FINAL VERSION
// Multiplayer | Host Start | Bot Chase | Props | Coins | XP | Crown | Sounds
// ===============================

// ===== server.js =====
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_PLAYERS = 20;
let ROUND_TIME = 60;

let players = {}; // id -> {name,x,y,score,xp,level,speed}
let hostId = null;
let timeLeft = ROUND_TIME;
let roundActive = false;

let bot = { name:'Runner', x:300, y:200 };

const walls = [
  {x:100,y:100,w:200,h:20},
  {x:300,y:250,w:20,h:100},
  {x:50,y:300,w:150,h:20}
];

let props = [
  {type:'soda', x:80, y:60},
  {type:'soda', x:520, y:80},
  {type:'alien', x:150, y:220},
  {type:'alien', x:420, y:140}
];

let coins = [
  {x:120,y:180,collected:false},
  {x:160,y:180,collected:false},
  {x:200,y:180,collected:false},
  {x:240,y:180,collected:false},
  {x:280,y:180,collected:false}
];

app.use(express.static(__dirname + '/public'));

io.on('connection', socket => {
  if (!hostId) hostId = socket.id;

  socket.on('join', (name, botName, cb) => {
    if (Object.keys(players).length >= MAX_PLAYERS) return cb({ok:false});
    players[socket.id] = { name, x:50, y:50, score:0, xp:0, level:1, speed:5 };
    if (botName) bot.name = botName;
    cb({ok:true, host:socket.id===hostId});
    io.emit('state', getState());
  });

  socket.on('setTime', t => {
    if (socket.id!==hostId) return;
    ROUND_TIME = Math.max(10,Math.min(300,Number(t)));
    timeLeft = ROUND_TIME;
  });

  socket.on('startRound', () => {
    if (socket.id!==hostId) return;
    roundActive = true;
    timeLeft = ROUND_TIME;
    coins.forEach(c=>c.collected=false);
  });

  socket.on('move', dir => {
    if (!roundActive) return;
    const p = players[socket.id]; if(!p) return;
    let nx=p.x, ny=p.y;
    if(dir==='up')ny-=p.speed;
    if(dir==='down')ny+=p.speed;
    if(dir==='left')nx-=p.speed;
    if(dir==='right')nx+=p.speed;
    if(!walls.some(w=>nx<w.x+w.w&&nx+12>w.x&&ny<w.y+w.h&&ny+12>w.y)){
      p.x=nx; p.y=ny;
    }

    coins.forEach(c=>{
      if(!c.collected && Math.hypot(p.x-c.x,p.y-c.y)<12){
        c.collected=true;
        p.score++;
        p.xp+=10;
      }
    });

    while(p.xp>=100){ p.xp-=100; p.level++; p.speed+=0.5; }

    if(Math.hypot(p.x-bot.x,p.y-bot.y)<15){
      p.score+=5; p.xp+=50;
      roundActive=false;
      io.emit('roundEnd',{winner:p.name});
    }
  });

  socket.on('disconnect',()=>{
    delete players[socket.id];
    if(socket.id===hostId) hostId=Object.keys(players)[0]||null;
  });
});

setInterval(()=>{
  if(roundActive){
    let target=null;
    Object.values(players).forEach(p=>{ if(!target||dist(p,bot)<dist(target,bot)) target=p; });
    if(target){ bot.x+=bot.x>target.x?-6:6; bot.y+=bot.y>target.y?-6:6; }
    timeLeft--; if(timeLeft<=0){ roundActive=false; io.emit('roundEnd',{winner:'No one'}); }
  }
  io.emit('state', getState());
},1000);

function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function getState(){ return {players,bot,walls,props,coins,timeLeft,hostId,roundActive}; }

server.listen(3000,()=>console.log('Running on http://localhost:3000'));


// ===== public/index.html =====
/*
<!DOCTYPE html>
<html>
<head>
<title>Ultimate City Chase</title>
<style>
body{background:#0b1a12;color:gold;text-align:center}
canvas{background:#123;border:4px solid gold}
</style>
</head>
<body>
<h2>Ultimate City Chase</h2>
<input id="nick" placeholder="Nickname">
<input id="bot" placeholder="Bot name">
<button onclick="join()">Join</button>
<div id="host" style="display:none">
<input id="time" type="number" placeholder="Time">
<button onclick="setTime()">Set Time</button>
<button onclick="start()">START GAME</button>
</div>
<p id="info">Waiting for host…</p>
<canvas id="c" width="600" height="400"></canvas>
<audio id="coin" src="coin.mp3"></audio>
<script src="/socket.io/socket.io.js"></script>
<script>
const s=io();const g=c.getContext('2d');
function join(){s.emit('join',nick.value,bot.value,r=>{if(r.host)host.style.display='block';});}
function setTime(){s.emit('setTime',time.value);}function start(){s.emit('startRound');}
document.onkeydown=e=>{if(e.key==='w')s.emit('move','up');if(e.key==='s')s.emit('move','down');if(e.key==='a')s.emit('move','left');if(e.key==='d')s.emit('move','right');}

s.on('state',st=>{
 g.clearRect(0,0,600,400);
 info.innerText=st.roundActive?`Time: ${st.timeLeft}`:'Waiting for host…';

 st.walls.forEach(w=>{g.fillStyle='#555';g.fillRect(w.x,w.y,w.w,w.h);});
 st.coins.forEach(c=>{if(!c.collected){g.fillStyle='gold';g.beginPath();g.arc(c.x,c.y,5,0,7);g.fill();}});

 let leader = Object.values(st.players).sort((a,b)=>b.score-a.score)[0];
 Object.values(st.players).forEach(p=>{
  g.fillStyle='lime'; g.fillRect(p.x,p.y,12,12);
  g.fillText(`${p.name} L${p.level}`,p.x,p.y-5);
  if(p===leader){ g.fillText('👑',p.x+4,p.y-12); }
 });

 g.fillStyle='red';g.beginPath();g.arc(st.bot.x,st.bot.y,10,0,7);g.fill();
});

s.on('roundEnd',r=>alert('Winner: '+r.winner));
</script>
</body>
</html>
*/
