const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');

async function main() {
    const allowlist = JSON.parse(fs.readFileSync('./allowlist.json', 'utf8'));

    const leafNodes = allowlist.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

    const rootHash = merkleTree.getHexRoot();

    console.log('Merkle Root:', rootHash);

    fs.writeFileSync('./merkle-root.txt', rootHash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
