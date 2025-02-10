import { NEAT } from './neat.js';

// Canvas setup
const RAD = Math.PI / 180;
const scrn = document.getElementById("canvas");
const sctx = scrn.getContext("2d");
scrn.tabIndex = 1;

// Initialize NEAT
const neat = new NEAT({
  inputSize: 4, // Bird y, velocity, next pipe x, next pipe gap y
  hiddenSize: 4,
  outputSize: 1, // Flap (1) or not flap (0)
  populationSize: 50, // Number of birds
  mutationRate: 0.1,
  crossoverRate: 0.7,
});

let frames = 0;
let dx = 2;
const state = { curr: 0, getReady: 0, Play: 1, gameOver: 2 };

////////////////////////////////////////
const gnd = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {
    this.y = parseFloat(scrn.height - this.sprite.height);
    sctx.drawImage(this.sprite, this.x, this.y);
  },
  update: function () {
    if (state.curr != state.Play) return;
    this.x -= dx;
    this.x = this.x % (this.sprite.width / 2);
  },
};
const bg = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {
    let y = parseFloat(scrn.height - this.sprite.height);
    sctx.drawImage(this.sprite, this.x, y);
  },
};

let birds = [];

/////////////////////////////////////
const pipe = {
  top: { sprite: new Image() },
  bot: { sprite: new Image() },
  gap: 85,
  moved: true,
  pipes: [],
  draw: function () {
    for (let i = 0; i < this.pipes.length; i++) {
      let p = this.pipes[i];
      sctx.drawImage(this.top.sprite, p.x, p.y);
      sctx.drawImage(
        this.bot.sprite,
        p.x,
        p.y + parseFloat(this.top.sprite.height) + this.gap
      );
    }
  },
  update: function () {
    if (state.curr != state.Play) return;
    if (frames % 100 == 0) {
      this.pipes.push({
        x: parseFloat(scrn.width),
        y: -210 * Math.min(Math.random() + 1, 1.8),
      });
    }
    this.pipes.forEach((pipe) => {
      pipe.x -= dx;
    });

    if (this.pipes.length && this.pipes[0].x < -this.top.sprite.width) {
      this.pipes.shift();
      this.moved = true;
    }
  },
};

/////////////////////////////////////
// Define the bird object
const bird = {
  animations: [
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
  ],
  thrust: 3.6, // Flap strength
};

// Load bird animations
bird.animations[0].sprite.src = "img/bird/b0.png";
bird.animations[1].sprite.src = "img/bird/b1.png";
bird.animations[2].sprite.src = "img/bird/b2.png";
bird.animations[3].sprite.src = "img/bird/b0.png";

// Define the Bird class
class Bird {
  constructor() {
    this.y = 100; // Initial y-position
    this.speed = 0; // Initial speed
    this.alive = true; // Whether the bird is alive
    this.rotation = 0; // Initial rotation
    this.frame = 0; // Current animation frame
  }

  draw() {
    let h = bird.animations[this.frame].sprite.height;
    let w = bird.animations[this.frame].sprite.width;
    sctx.save();
    sctx.translate(50, this.y); // Fixed x position for all birds
    sctx.rotate(this.rotation * RAD); // Apply rotation
    sctx.drawImage(bird.animations[this.frame].sprite, -w / 2, -h / 2);
    sctx.restore();
  }

  flap() {
    this.speed = -bird.thrust; // Apply upward thrust
  }

  setRotation() {
    if (this.speed <= 0) {
      // Rotate upward when flapping
      this.rotation = Math.max(-25, (-25 * this.speed) / (-1 * bird.thrust));
    } else if (this.speed > 0) {
      // Rotate downward when falling
      this.rotation = Math.min(90, (90 * this.speed) / (bird.thrust * 2));
    }
  }
}

/////////////////////////////////////
const UI = {
  getReady: { sprite: new Image() },
  gameOver: { sprite: new Image() },
  tap: [{ sprite: new Image() }, { sprite: new Image() }],
  score: {
    curr: 0,
    best: 0,
  },
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  frame: 0,
  draw: function () {
    switch (state.curr) {
      case state.getReady:
        this.y = parseFloat(scrn.height - this.getReady.sprite.height) / 2;
        this.x = parseFloat(scrn.width - this.getReady.sprite.width) / 2;
        this.tx = parseFloat(scrn.width - this.tap[0].sprite.width) / 2;
        this.ty =
          this.y + this.getReady.sprite.height - this.tap[0].sprite.height;
        sctx.drawImage(this.getReady.sprite, this.x, this.y);
        sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);
        break;
      case state.gameOver:
        this.y = parseFloat(scrn.height - this.gameOver.sprite.height) / 2;
        this.x = parseFloat(scrn.width - this.gameOver.sprite.width) / 2;
        this.tx = parseFloat(scrn.width - this.tap[0].sprite.width) / 2;
        this.ty =
          this.y + this.gameOver.sprite.height - this.tap[0].sprite.height;
        sctx.drawImage(this.gameOver.sprite, this.x, this.y);
        sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);
        break;
    }
    this.drawScore();
  },
  drawScore: function () {
    sctx.fillStyle = "#FFFFFF";
    sctx.strokeStyle = "#000000";
    switch (state.curr) {
      case state.Play:
        sctx.lineWidth = "2";
        sctx.font = "35px Squada One";
        sctx.fillText(this.score.curr, scrn.width / 2 - 5, 50);
        sctx.strokeText(this.score.curr, scrn.width / 2 - 5, 50);
        break;
      case state.gameOver:
        sctx.lineWidth = "2";
        sctx.font = "40px Squada One";
        let sc = `SCORE :     ${this.score.curr}`;
        try {
          this.score.best = Math.max(
            this.score.curr,
            Number(localStorage.getItem("best") || 0)
          );
          localStorage.setItem("best", this.score.best);
          let bs = `BEST  :     ${this.score.best}`;
          sctx.fillText(sc, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx.strokeText(sc, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx.fillText(bs, scrn.width / 2 - 80, scrn.height / 2 + 30);
          sctx.strokeText(bs, scrn.width / 2 - 80, scrn.height / 2 + 30);
        } catch (e) {
          sctx.fillText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
          sctx.strokeText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
        }
        break;
    }
  },
  update: function () {
    if (state.curr == state.Play) return;
    this.frame += frames % 10 == 0 ? 1 : 0;
    this.frame = this.frame % this.tap.length;
  },
};

gnd.sprite.src = "img/ground.png";
bg.sprite.src = "img/BG.png";
pipe.top.sprite.src = "img/toppipe.png";
pipe.bot.sprite.src = "img/botpipe.png";
UI.gameOver.sprite.src = "img/go.png";
UI.getReady.sprite.src = "img/getready.png";
UI.tap[0].sprite.src = "img/tap/t0.png";
UI.tap[1].sprite.src = "img/tap/t1.png";

/////////////////////////////////////
function resetGame() {
  birds = [];
  for (let i = 0; i < neat.populationSize; i++) {
    birds.push(new Bird()); // Create a new Bird instance for each member of the population
  }
  pipe.pipes = []; // Clear existing pipes
  frames = 0;
  state.curr = state.Play;
}

function checkCollision(birdInstance) {
  if (!pipe.pipes.length) return false;
  const p = pipe.pipes[0];
  const birdRadius = 10; // Approximate bird hitbox radius
  const pipeWidth = pipe.top.sprite.width;
  const pipeGapTop = p.y + pipe.top.sprite.height;
  const pipeGapBottom = pipeGapTop + pipe.gap;

  return (
    (birdInstance.y - birdRadius < pipeGapTop || birdInstance.y + birdRadius > pipeGapBottom) &&
    (50 + birdRadius > p.x && 50 - birdRadius < p.x + pipeWidth)
  );
}

function gameLoop() {
  if (state.curr === state.Play) {
    let allDead = true;

    birds.forEach((birdInstance, i) => {
      if (!birdInstance.alive) return;

      // Input features: bird y-position, bird speed, next pipe x-position, next pipe gap y-position
      const inputs = [
        birdInstance.y / scrn.height, // Normalized bird y-position
        birdInstance.speed / 10,      // Normalized bird speed
        (pipe.pipes[0]?.x || scrn.width) / scrn.width, // Normalized next pipe x-position
        (pipe.pipes[0]?.y || 0) / scrn.height,         // Normalized next pipe gap y-position
      ];

      // Predict whether to flap
      const output = neat.population[i].predict(inputs)[0];
      let shouldFlap = output > 0.3; // Lower threshold for flapping

      if (shouldFlap) {
        birdInstance.flap();
      }

      // Update bird position
      birdInstance.y += birdInstance.speed;
      birdInstance.speed += 0.125; // Apply gravity

      // Update bird rotation
      birdInstance.setRotation();

      // Check for collisions or out-of-bounds
      if (birdInstance.y < 0 || birdInstance.y > scrn.height || checkCollision(birdInstance)) {
        birdInstance.alive = false;
      } else {
        allDead = false;
      }
    });

    // Update pipes
    pipe.update();

    // If all birds are dead, evolve the population and reset the game
    if (allDead) {
      neat.updateFitness(birds); // Pass birds array to updateFitness
      console.log(`Generation ${neat.generation} - Fitness Scores:`, neat.population.map(n => n.fitness));
      neat.evolve();
      console.log(`Generation ${neat.generation} - Population Size: ${neat.population.length}`);
      resetGame();
    }
  }

  // Render the game
  draw();
  frames++;
  requestAnimationFrame(gameLoop);
}

function draw() {
  sctx.fillStyle = "#30c0df";
  sctx.fillRect(0, 0, scrn.width, scrn.height);
  bg.draw();
  pipe.draw();

  // Draw all birds
  birds.forEach((birdInstance) => {
    if (birdInstance.alive) {
      birdInstance.draw();
    }
  });

  gnd.draw();
  UI.draw();
}

// Initialize the game
resetGame();
gameLoop();