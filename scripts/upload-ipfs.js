const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);

async function uploadCollection() {
    try {
        // 1. Upload Images
        console.log("Uploading images to IPFS...");
        const imagesPath = path.join(__dirname, '../assets/images');

        // Check if directory exists, if not create dummy for demo
        if (!fs.existsSync(imagesPath)) {
            console.log("Images directory not found, skipping image upload...");
        } else {
            const imageUpload = await pinata.pinFromFS(imagesPath);
            console.log("Images CID:", imageUpload.IpfsHash);
        }

        // 2. Upload Metadata
        console.log("Uploading metadata to IPFS...");
        const metadataPath = path.join(__dirname, '../assets/metadata');

        if (!fs.existsSync(metadataPath)) {
            console.log("Metadata directory not found, skipping metadata upload...");
        } else {
            const metadataUpload = await pinata.pinFromFS(metadataPath);
            console.log("Metadata CID:", metadataUpload.IpfsHash);
            console.log("Base URI for contract: ipfs://" + metadataUpload.IpfsHash + "/");
        }

    } catch (error) {
        console.error("Error uploading to Pinata:", error);
    }
}

uploadCollection();
