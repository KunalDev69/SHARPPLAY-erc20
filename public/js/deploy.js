async function main() {
  const [deployer] = await ethers. getSigners();
  console. log("Deploying with account:", deployer.address);

  const SharpToken = await ethers. getContractFactory("SharpToken");
  const token = await SharpToken.deploy(deployer. address);
  
  await token.deployed();
  
  console.log("SHARP Token deployed to:", token.address);
  console.log("Save this address and add to Firebase config!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});