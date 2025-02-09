class NEAT {
  constructor(options) {
    this.inputSize = options.inputSize; // Number of inputs (e.g., bird y, velocity, pipe x, pipe y)
    this.hiddenSize = options.hiddenSize; // Number of hidden neurons
    this.outputSize = options.outputSize; // Number of outputs (e.g., flap or not flap)
    this.populationSize = options.populationSize; // Number of networks in the population
    this.mutationRate = options.mutationRate; // Probability of mutation
    this.crossoverRate = options.crossoverRate; // Probability of crossover
    this.population = this.initializePopulation(); // Initialize the population
    this.generation = 0; // Track the current generation
  }

  // Initialize the population with random neural networks
  initializePopulation() {
    return Array.from({ length: this.populationSize }, () =>
      new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize)
    );
  }

  // Predict the output (flap or not flap) for a given input
  predict(inputs) {
    const bestNetwork = this.getBestNetwork();
    return bestNetwork.predict(inputs);
  }

  // Update the fitness scores of the population
  updateFitness() {
    this.population.forEach((network) => {
      network.fitness = network.score; // Fitness is based on the score (frames survived)
    });
    this.sortPopulationByFitness();
  }

  // Sort the population by fitness (descending order)
  sortPopulationByFitness() {
    this.population.sort((a, b) => b.fitness - a.fitness);
  }

  // Evolve the population through selection, crossover, and mutation
  evolve() {
    this.selection();
    this.crossover();
    this.mutation();
    this.generation++; // Increment the generation counter
  }

  // Selection: Keep the top-performing networks
  selection() {
    const topPerformers = Math.floor(this.populationSize / 2);
    this.population = this.population.slice(0, topPerformers);
  }

  // Crossover: Combine two networks to create a new offspring
  crossover() {
    const newPopulation = [];
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.population[Math.floor(Math.random() * this.population.length)];
      const parent2 = this.population[Math.floor(Math.random() * this.population.length)];
      const child = parent1.crossover(parent2);
      newPopulation.push(child);
    }
    this.population = newPopulation;
  }

  // Mutation: Randomly mutate the weights of the networks
  mutation() {
    this.population.forEach((network) => {
      if (Math.random() < this.mutationRate) {
        network.mutate();
      }
    });
  }

  // Get the best-performing network in the population
  getBestNetwork() {
    return this.population[0];
  }
}

class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.weightsInputHidden = this.initializeWeights(inputSize, hiddenSize); // Weights from input to hidden layer
    this.weightsHiddenOutput = this.initializeWeights(hiddenSize, outputSize); // Weights from hidden to output layer
    this.fitness = 0; // Fitness score
    this.score = 0; // Score (frames survived)
  }

  // Initialize random weights for the network
  initializeWeights(rows, cols) {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() * 2 - 1) // Weights between -1 and 1
    );
  }

  // Predict the output based on the inputs
  predict(inputs) {
    // Calculate hidden layer activations
    const hidden = this.weightsInputHidden[0].map((_, i) =>
      inputs.reduce((sum, input, j) => sum + input * this.weightsInputHidden[j][i], 0)
    );
    // Apply ReLU activation
    const hiddenActivated = hidden.map((val) => Math.max(0, val));
    // Calculate output layer activations
    const output = this.weightsHiddenOutput[0].map((_, i) =>
      hiddenActivated.reduce((sum, h, j) => sum + h * this.weightsHiddenOutput[j][i], 0)
    );
    // Output 1 (flap) if the output is greater than 0.5, otherwise 0 (no flap)
    return output[0] > 0.5 ? 1 : 0;
  }

  // Crossover: Combine two networks to create a new offspring
  crossover(other) {
    const child = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        child.weightsInputHidden[i][j] =
          Math.random() > 0.5 ? this.weightsInputHidden[i][j] : other.weightsInputHidden[i][j];
      }
    }
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        child.weightsHiddenOutput[i][j] =
          Math.random() > 0.5 ? this.weightsHiddenOutput[i][j] : other.weightsHiddenOutput[i][j];
      }
    }
    return child;
  }

  // Mutation: Randomly adjust the weights of the network
  mutate() {
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        if (Math.random() < 0.1) {
          this.weightsInputHidden[i][j] += (Math.random() - 0.5) * 0.5; // Perturb weight
        }
      }
    }
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        if (Math.random() < 0.1) {
          this.weightsHiddenOutput[i][j] += (Math.random() - 0.5) * 0.5; // Perturb weight
        }
      }
    }
  }

  // Update the score (frames survived)
  updateScore(score) {
    this.score = score;
  }
}

export { NEAT };