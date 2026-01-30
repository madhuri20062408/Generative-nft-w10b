const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy(
        "My Generative NFT",
        "GNFT",
        "ipfs://placeholder-cid/"
    );

    await myNFT.waitForDeployment();

    console.log("MyNFT deployed to:", await myNFT.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
