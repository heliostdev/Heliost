
import { program } from "commander";
import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";
import sharp from "sharp";
import terminalImage from "terminal-image";
import { randomInt } from "crypto";
import inquirer from "inquirer";
import TokenCreator from "./token.js";
import * as fs from "fs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function displayImage(path) {
  try {
    const image = await terminalImage.file(path, { width: "50%" });
    console.log(image);
    return true;
  } catch (error) {
    console.error(`Failed to display image: ${error.message}`);
    return false;
  }
}
async function combineImagesWithEffects() {
  try {
    const TARGET_SIZE = 500;

    const loadImage = async (path) => {
      try {
        return await sharp(path)
          .resize(TARGET_SIZE, TARGET_SIZE, {
            fit: "cover",
            position: "center",
          })
          .toBuffer();
      } catch (err) {
        throw new Error(`Failed to load image ${path}: ${err.message}`);
      }
    };

    const imagePaths = [
      "./images/1.png",
      "./images/2.png",
      "./images/3.png",
      "./images/4.png",
      "./images/5.jpg",
      "./images/6.jpg",
      "./images/7.jpg",
    ];

    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const images = await Promise.all(
      shuffleArray(imagePaths).map((path) => loadImage(path).catch(() => null))
    ).then((results) => {
      const validImages = results.filter((img) => img !== null);
      if (validImages.length === 0) {
        throw new Error(
          "No valid images found. Please ensure images exist and are in correct format."
        );
      }
      return validImages;
    });
    // Function to apply random effects to a single image
    const applyRandomEffectsToImage = async (imageBuffer) => {
      let processedImage = sharp(imageBuffer);

      // Array of possible effects
      const effects = [
        // Color modifications
        () =>
          processedImage.modulate({
            brightness: 1 + (Math.random() * 0.5 - 0.25), // 0.75-1.25
            saturation: 1 + (Math.random() * 0.8 - 0.4), // 0.6-1.4
            hue: Math.floor(Math.random() * 360), // 0-360
          }),

        // Tinting
        () =>
          processedImage.tint({
            r: Math.floor(Math.random() * 255),
            g: Math.floor(Math.random() * 255),
            b: Math.floor(Math.random() * 255),
          }),

        // Artistic effects
        () => processedImage.blur(Math.random() * 2 + 0.3),
        () => processedImage.sharpen(Math.random() * 5),
        () => processedImage.gamma(1 + Math.random() * 2), // Range 1.0-3.0
        () => processedImage.negate({ alpha: false }),
        () => processedImage.grayscale(),
        () => processedImage.normalize(),
      ];

      // Apply 2-3 random effects
      const numEffects = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numEffects; i++) {
        const effect = effects[Math.floor(Math.random() * effects.length)];
        processedImage = await effect();
      }

      return processedImage.toBuffer();
    };

    // Process all images with random effects
    const processedImages = await Promise.all(
      images.map((img) => applyRandomEffectsToImage(img))
    );

    // Create base canvas
    const composition = sharp({
      create: {
        width: TARGET_SIZE,
        height: TARGET_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });
    const focusedIndex = Math.floor(Math.random() * processedImages.length)+1;

    // Create composite operations with random opacities and rotations
    const compositeOperations = processedImages.map((img, index) => {
      // Generate random rotation angle
      const rotation = Math.floor(Math.random() * 360);

      // Set opacity based on whether this is the focused image
      const opacity =
        index === focusedIndex
          ? 0.8 + Math.random() * 0.2 // High opacity (0.8-1.0) for focused image
          : 0.01 + Math.random() * 0.2; // Low opacity (0.01-0.21) for others

      // Calculate size needed to cover frame even when rotated
      const size = Math.ceil(TARGET_SIZE);

      return {
        input: img,
        blend: "overlay",
        opacity: opacity,
        gravity: "center",
        // Calculate offset to ensure center positioning
        left: Math.floor((TARGET_SIZE - size) / 2),
        top: Math.floor((TARGET_SIZE - size) / 2),
        rotate: rotation,
        // Ensure image covers full frame
        width: size,
        height: size,
      };
    });

    // Apply final composition with all layers
    return composition.composite(compositeOperations);
  } catch (error) {
    console.error("Error in combineImagesWithEffects:", error);
    throw error;
  }
}
// Modified sun animation to support cancelation
const sunFrames = ["☀️ |", "☀️ /", "☀️ -", "☀️ \\", "☀️ |", "☀️ /"];

class SunAnimator {
  constructor() {
    this.isAnimating = false;
    this.frame = 0;
  }

  async start(text) {
    this.isAnimating = true;
    while (this.isAnimating) {
      process.stdout.write("\r" + " ".repeat(process.stdout.columns));
      process.stdout.write(
        "\r" + sunFrames[this.frame] + " " + chalk.white(text)
      );
      this.frame = (this.frame + 1) % sunFrames.length;
      await sleep(100);
    }
  }

  stop() {
    this.isAnimating = false;
    process.stdout.write("\n");
  }
}

async function typeText(text, speed = 50) {
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(chalk.white(text[i]));
    await sleep(speed);
  }
  console.log("\n");
}

const asciiArt = figlet.textSync("HELIOST", {
  font: "Sub-Zero",
  horizontalLayout: "fitted",
});

async function collectWalletInfo() {
  const questions = [
    {
      type: "input",
      name: "publicKey",
      message: "☀️ Enter your developer wallet public key:",
      validate: (input) => {
        if (input.length < 32)
          return "Public key must be at least 32 characters";
        if (input.length > 44)
          return "Public key must be less than 44 characters";
        return true;
      },
    },
    {
      type: "password",
      name: "privateKey",
      message: "☀️ Enter your developer wallet private key:",
      validate: (input) => {
        if (input.length < 64)
          return "Private key must be at least 64 characters";
        if (input.length > 88)
          return "Private key must be less than 88 characters";
        return true;
      },
    },
    {
      type: "number",
      name: "initialBuy",
      message: "☀️ Enter initial buy amount in SOL:",
      validate: (input) => {
        if (isNaN(input)) return "Please enter a valid number";
        if (input <= 0) return "Amount must be greater than 0";
        if (input > 100) return "Amount must be less than or equal to 100";
        return true;
      },
    },
  ];

  return inquirer.prompt(questions);
}

program
  .command("deploy-token")
  .option("--network <network>", "blockchain network")
  .action(async (options) => {
    if (options.network !== "solana") {
      await typeText("🚫 Only Solana network is supported", 40);
      process.exit(1);
    }

    try {
      console.clear();
      console.log(gradient(["#FFD700", "#FFA500", "#FF8C00"])(asciiArt));
      await sleep(800);

      await typeText("☀️ Creating your token on the directory of sun...", 40);

      // Create sun animator instance
      const sunAnimator = new SunAnimator();

      // Start animation and store the promise
      const animationPromise = sunAnimator.start(
        "Generating token parameters..."
      );

      // Make the API request
      const response = await fetch(
        "https://api.heliost.ai/api/generate-token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      // Stop the animation after the request completes
      sunAnimator.stop();

      if (!response.ok) throw new Error("Failed to generate token parameters");
      const params = await response.json();

      await typeText("\nToken Parameters:", 40);
      const info = [
        `Name: ${params.name}`,
        `Symbol: ${params.symbol}`,
        `Description: ${params.description}`,
        `Website: ${params.website}`,
        `Contract Address: ${params.publicKey}`,
      ];

      for (const line of info) {
        await typeText(`☀️ ${line}`, 30);
        await sleep(200);
      }

      let satisfied = false;

      while (!satisfied) {
        await typeText("☀️ Creating token image... (output.png) ", 40);
        const processedImage = await combineImagesWithEffects();
        await processedImage.toFile("output.png");
        await displayImage("output.png");

        const { wantToRegenerate } = await inquirer.prompt([
          {
            type: "confirm",
            name: "wantToRegenerate",
            message: "☀️ Would you like to regenerate the image? (output.png) ",
            default: false,
          },
        ]);

        satisfied = !wantToRegenerate;
      }

      await typeText(
        "\n☀️ Image generation complete. Preparing deployment...",
        40
      );

      
      const walletInfo = await collectWalletInfo();

      await typeText("\n☀️ Initiating deployment sequence...", 40);

      // Start a new animation for deployment
      const deployAnimator = new SunAnimator();
      const deployAnimationPromise = deployAnimator.start(
        "Deploying your token to Solana..."
      );

      const tokenCreator = new TokenCreator(
        "https://api.mainnet-beta.solana.com",
        walletInfo.privateKey
      );
      const imageFile = await fs.openAsBlob("./output.png");

      console.log(params.privateKey);
      const tokenCreationResult = await tokenCreator.createToken({
        imageFile,
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        twitter: "",
        telegram: "",
        website: params.website,
        publicKey: walletInfo.publicKey,
        mintPrivateKey: params.privateKey,
        amount: walletInfo.initialBuy,
        slippage: 20,
        priorityFee: 0.0005,
      });
      console.log("Token created successfully!");

      console.log("Transaction URL:", tokenCreationResult);

      // Stop the deployment animation
      deployAnimator.stop();

      await typeText("☀️ Your token is now live on Solana", 40);
      await typeText(
        `☀️ Initial buy of ${walletInfo.initialBuy} SOL processed`,
        40
      );
      await typeText(`\n☀️ Transaction URL: ${result.transactionUrl}`, 30);
    } catch (error) {
      console.log("\n");
      const errorBox = [`ERROR: ${error.message.padEnd(18)}`];
      console.log(error.message);

      for (const line of errorBox) {
        await typeText(line, 40);
      }
    }
  });

program.parse(process.argv);
