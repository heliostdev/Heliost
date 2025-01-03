import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from "bs58";

export class TokenCreator {
    constructor(rpcEndpoint, privateKey) {
        this.connection = new Connection(rpcEndpoint, 'confirmed');
        this.signerKeyPair = Keypair.fromSecretKey(bs58.decode(privateKey));
    }

    createMetadataForm(metadata) {
        const formData = new FormData();
        formData.append("file", metadata.imageFile);
        formData.append("name", metadata.name);
        formData.append("symbol", metadata.symbol);
        formData.append("description", metadata.description);
        formData.append("twitter", metadata.twitter);
        formData.append("telegram", metadata.telegram);
        formData.append("website", metadata.website);
        formData.append("showName", "true");
        return formData;
    }

    async uploadMetadata(formData) {
        const response = await fetch("https://pump.fun/api/ipfs", {
            method: "POST",
            body: formData,
        });
        return response.json();
    }

    async createTokenTransaction(config) {
        console.log(config);
         
        const mintKeypair = Keypair.fromSecretKey(bs58.decode(config.mintPrivateKey))
        

        console.log(mintKeypair.publicKey.toBase58())

        const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                publicKey: config.publicKey,
                action: "create",
                tokenMetadata: config.tokenMetadata,
                mint: mintKeypair.publicKey.toBase58(),
                denominatedInSol: "true",
                amount: config.amount,
                slippage: config.slippage,
                priorityFee: config.priorityFee,
                pool: "pump"
            })
        });

        if (response.status !== 200) {
            throw new Error(`Transaction creation failed: ${response.statusText}`);
        }

        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        tx.sign([mintKeypair, this.signerKeyPair]);

        const signature = await this.connection.sendTransaction(tx);
        return signature;
    }

    async createToken(params) {
        try {
            const metadataForm = this.createMetadataForm(params);
            const metadataResponse = await this.uploadMetadata(metadataForm);

            const signature = await this.createTokenTransaction({
                publicKey: params.publicKey,
                tokenMetadata: {
                    name: metadataResponse.metadata.name,
                    symbol: metadataResponse.metadata.symbol,
                    uri: metadataResponse.metadataUri
                },
                amount: params.amount || 0,
                slippage: params.slippage || 10,
                priorityFee: params.priorityFee || 0.0005,
                mintPrivateKey: params.mintPrivateKey
            });

            return `https://solscan.io/tx/${signature}`;
        } catch (error) {
            throw new Error(`Token creation failed: ${error.message}`);
        }
    }
}


export default TokenCreator;