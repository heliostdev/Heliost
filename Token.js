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
        const mintKeypair = Keypair.fromSecretKey(new Uint8Array([29,234,164,68,222,58,121,38,248,112,47,208,47,77,64,164,120,102,118,64,137,158,10,106,236,138,140,147,119,141,129,40,8,56,124,193,216,253,209,95,40,90,64,171,195,191,21,179,237,17,65,202,11,172,49,200,173,72,35,230,79,201,15,239]))

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
                priorityFee: params.priorityFee || 0.0005
            });

            return `https://solscan.io/tx/${signature}`;
        } catch (error) {
            throw new Error(`Token creation failed: ${error.message}`);
        }
    }
}


export default TokenCreator;