class NEAT {
  constructor(options) {
    this.inputSize = options.inputSize;
    this.outputSize = options.outputSize;
    this.populationSize = options.populationSize;
    this.mutationRate = options.mutationRate;
    this.crossoverRate = options.crossoverRate;

    // Initialize the population of networks
    this.population = this.initializePopulation();
  }

  // Initialize population with random neural networks
  initializePopulation() {
    let population = [];
    for (let i = 0; i < this.populationSize; i++) {
      population.push(this.createRandomNetwork());
    }
    return population;
  }

  // Create a random neural network
  createRandomNetwork() {
    return new NeuralNetwork(this.inputSize, this.outputSize);
  }

  // Predict output based on inputs
  predict(inputs) {
    // Select the best network based on fitness
    let bestNetwork = this.getBestNetwork();
    return bestNetwork.predict(inputs);
  }

  // Get the best-performing neural network (based on fitness score)
  getBestNetwork() {
    return this.population[0]; // Just returning the first for simplicity
  }

  // Update the fitness scores of the population (each bird's performance)
  updateFitness() {
    this.population.forEach(network => {
      network.fitness = this.calculateFitness(network);
    });
    this.sortPopulationByFitness();
  }

  // Fitness function: how well does the network perform in the game?
  calculateFitness(network) {
    // Use bird's score or distance to pipes as fitness score
    // The fitness increases with survival time or distance traveled
    return network.score; // Fitness is based on the network's score
  }

  // Sort the population based on fitness
  sortPopulationByFitness() {
    this.population.sort((a, b) => b.fitness - a.fitness);
  }

  // Evolve the population through selection, crossover, and mutation
  evolve() {
    this.selection();
    this.crossover();
    this.mutation();
  }

  // Selection: Select the best performers to "reproduce"
  selection() {
    // Tournament selection or fitness proportionate selection
    // Here, we keep the top performers (top half of the population)
    let bestPerformers = this.population.slice(0, Math.floor(this.populationSize / 2));
    this.population = bestPerformers;
  }

  // Crossover: Combine genes of two networks to create a new offspring
  crossover() {
    // Perform crossover between top networks to create new offspring
    let newOffspring = [];
    while (newOffspring.length < this.populationSize) {
      let parent1 = this.population[Math.floor(Math.random() * this.population.length)];
      let parent2 = this.population[Math.floor(Math.random() * this.population.length)];
      let child = parent1.crossover(parent2);
      newOffspring.push(child);
    }
    this.population = newOffspring;
  }

  // Mutation: Randomly mutate the neural networks
  mutation() {
    this.population.forEach(network => {
      if (Math.random() < this.mutationRate) {
        network.mutate();
      }
    });
  }
}

// Neural Network class
class NeuralNetwork {
  constructor(inputSize, outputSize) {
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    this.weights = this.initializeWeights();
    this.fitness = 0;
    this.score = 0; // Score will track performance in the game
  }

  // Initialize random weights for the neural network
  initializeWeights() {
    return new Array(this.inputSize).fill().map(() => Math.random());
  }

  // Predict the output based on the inputs
  predict(inputs) {
    let sum = 0;
    for (let i = 0; i < this.inputSize; i++) {
      sum += inputs[i] * this.weights[i];
    }
    return sum > 0.5 ? 1 : 0; // Output 1 (flap) or 0 (no flap)
  }

  // Crossover with another neural network (combine weights)
  crossover(other) {
    let child = new NeuralNetwork(this.inputSize, this.outputSize);
    for (let i = 0; i < this.inputSize; i++) {
      child.weights[i] = Math.random() > 0.5 ? this.weights[i] : other.weights[i];
    }
    return child;
  }

  // Mutate the neural network (randomly adjust weights)
  mutate() {
    let mutationIndex = Math.floor(Math.random() * this.weights.length);
    this.weights[mutationIndex] = Math.random(); // Mutate the weight at this index
  }

  // Update the score based on the game state
  updateScore(score) {
    this.score = score;
  }
}

export { NEAT };
