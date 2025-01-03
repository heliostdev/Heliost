// TokenLauncher.js
import React from 'react';
import { TokenCreator } from './Token.js';

class TokenLauncher {
  constructor({ onOutput, onComplete }) {
    this.currentStep = 0;
    this.onOutput = onOutput;
    this.onComplete = onComplete;
    this.formData = {
      name: '',
      symbol: '',
      description: '',
      twitter: '',
      telegram: '',
      website: '',
      imageFile: null,
      amount: 1,
      slippage: 10,
      priorityFee: 0.0005,
      publicKey: '',
      privateKey: ''
    };

    this.steps = [
      {
        prompt: "Enter token name:",
        field: "name",
        validate: (value) => value.length > 0
      },
      {
        prompt: "Enter token symbol:",
        field: "symbol",
        validate: (value) => value.length > 0
      },
      {
        prompt: "Enter token description:",
        field: "description",
        validate: (value) => value.length > 0
      },
      {
        prompt: "Enter Twitter handle (optional):",
        field: "twitter",
        validate: () => true
      },
      {
        prompt: "Enter Telegram group (optional):",
        field: "telegram",
        validate: () => true
      },
      {
        prompt: "Enter website URL (optional):",
        field: "website",
        validate: () => true
      },
      {
        prompt: "Enter initial supply amount:",
        field: "amount",
        validate: (value) => !isNaN(value) && value > 0
      },
      {
        prompt: "Enter slippage percentage (default 10):",
        field: "slippage",
        validate: (value) => !isNaN(value) && value >= 0
      },
      {
        prompt: "Enter priority fee in SOL (default 0.0005):",
        field: "priorityFee",
        validate: (value) => !isNaN(value) && value >= 0
      },
      {
        prompt: "Enter your public key:",
        field: "publicKey",
        validate: (value) => value.length > 0
      },
      {
        prompt: "Enter your private key:",
        field: "privateKey",
        validate: (value) => value.length > 0
      }
    ];
  }

  async handleInput(input) {
    const currentStepData = this.steps[this.currentStep];
    
    if (!currentStepData) {
      await this.onOutput("Invalid step");
      return false;
    }

    let value = input;
    if (["amount", "slippage", "priorityFee"].includes(currentStepData.field)) {
      value = parseFloat(input) || 0;
    }

    if (!currentStepData.validate(value)) {
      await this.onOutput("Invalid input. Please try again.");
      return false;
    }

    this.formData[currentStepData.field] = value;

    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      await this.onOutput(this.steps[this.currentStep].prompt);
      return true;
    } else {
      // All steps completed, create token
      try {
        await this.onOutput("Creating token...");
        const tokenCreator = new TokenCreator(
          "https://api.mainnet-beta.solana.com",
          this.formData.privateKey
        );

        const txUrl = await tokenCreator.createToken(this.formData);
        await this.onOutput(`Token created successfully! Transaction: ${txUrl}`);
        this.onComplete();
        return false;
      } catch (error) {
        await this.onOutput(`Error creating token: ${error.message}`);
        this.onComplete();
        return false;
      }
    }
  }
}

export default TokenLauncher;