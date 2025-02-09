import { NEAT } from "./neat.js";

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
  populationSize: 50,
  mutationRate: 0.1,
  crossoverRate: 0.7,
});

// Game state
let frames = 0;
let dx = 2;
const state = {
  curr: 0,
  getReady: 0,
  Play: 1,
  gameOver: 2,
};

// Game objects
const bird = {
  y: 100,
  speed: 0,
  gravity: 0.125,
  thrust: 3.6,
  update: function () {
    if (state.curr === state.Play) {
      this.y += this.speed;
      this.speed += this.gravity;
    }
  },
  flap: function () {
    this.speed = -this.thrust;
  },
};

const pipe = {
  pipes: [],
  gap: 85,
  update: function () {
    if (state.curr !== state.Play) return;
    if (frames % 100 === 0) {
      this.pipes.push({
        x: scrn.width,
        y: -210 * Math.min(Math.random() + 1, 1.8),
      });
    }
    this.pipes.forEach((p) => (p.x -= dx));
    if (this.pipes.length && this.pipes[0].x < -50) {
      this.pipes.shift();
    }
  },
};

// Game loop
function gameLoop() {
  
  if (state.curr === state.Play) {
    // Update all birds in the population
    neat.population.forEach((network) => {
      const inputs = [
        bird.y / scrn.height, // Normalized bird height
        bird.speed / 10, // Normalized speed
        (pipe.pipes[0]?.x || scrn.width) / scrn.width, // Normalized pipe x
        (pipe.pipes[0]?.y || 0) / scrn.height, // Normalized pipe y
      ];

      // Predict whether to flap
      const shouldFlap = network.predict(inputs);
      if (shouldFlap) bird.flap();

      // Update bird and pipes
      bird.update();
      pipe.update();

      // Check for collisions
      if (bird.y < 0 || bird.y > scrn.height || checkCollision()) {
        state.curr = state.gameOver;
      }

      // Update fitness (score is based on frames survived)
      network.updateScore(frames);
    });

    // Evolve the population if all birds are dead
    if (state.curr === state.gameOver) {
      neat.updateFitness();
      neat.evolve();
      resetGame();
    }
  }

  draw();
  frames++;
  requestAnimationFrame(gameLoop);
}

// Reset game for the next generation
function resetGame() {
  bird.y = 100;
  bird.speed = 0;
  pipe.pipes = [];
  state.curr = state.Play;
  frames = 0;
}

// Check for collisions
function checkCollision() {
  if (!pipe.pipes.length) return false;
  const p = pipe.pipes[0];
  const birdTop = bird.y - 10;
  const birdBottom = bird.y + 10;
  const pipeTop = p.y;
  const pipeBottom = p.y + pipe.gap;
  return (
    birdBottom > pipeBottom || birdTop < pipeTop
  );
}

// Draw game objects
function draw() {
  sctx.clearRect(0, 0, scrn.width, scrn.height);

  // Draw pipes
  pipe.pipes.forEach((p) => {
    sctx.fillStyle = "green";
    sctx.fillRect(p.x, 0, 50, p.y);
    sctx.fillRect(p.x, p.y + pipe.gap, 50, scrn.height - p.y - pipe.gap);
  });

  // Draw bird
  sctx.fillStyle = "red";
  sctx.fillRect(50, bird.y - 10, 20, 20);

  // Display generation and fitness
  sctx.fillStyle = "black";
  sctx.font = "20px Arial";
  sctx.fillText(`Generation: ${neat.generation}`, 20, 30);
  sctx.fillText(`Best Fitness: ${neat.getBestNetwork().fitness}`, 20, 60);
}

// Start the game loop
gameLoop();