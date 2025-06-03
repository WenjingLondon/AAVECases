
const { JsonRpcProvider, ZeroAddress } = require("ethers");
require("dotenv").config();

const RPC_URL = process.env.ALCHEMY_URL;
const provider = new JsonRpcProvider(RPC_URL);


const DATA_PROVIDER_ADDRESS = "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d";
const UI_POOL_DATA_PROVIDER = "0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb";
const LENDING_POOL_ADDRESS_PROVIDER = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";

const ASSET_ADDRESSES = [
  { name: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
  { name: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { name: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" }
];

function rayToPercent(ray) {
  return Number(ray) / 1e27 * 100;
}

const ProtocolDataProviderABI = [
"function getReserveData(address asset) view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint40)",
  "function getReserveConfigurationData(address asset) view returns (uint256,uint256,uint256,uint256,bool,bool,bool,bool,bool,bool)"
];

const UiPoolDataProviderABI = [
  "function getReservesData(address user) view returns ((address, uint256, uint256, uint256, uint256, uint256, uint256, bool, uint8, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)[], uint256[], uint256)",
  "function getUserReservesData(address user) view returns ((address, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, bool, bool, uint8)[], uint256, uint256, uint256, uint256, uint256)"
];

const LendingPoolAddressProviderABI = [
  "function getLendingPool() view returns (address)",
  "function getAddress(bytes32 id) view returns (address)"
];

async function main() {
	const protocolDataProvider = new ethers.Contract(DATA_PROVIDER_ADDRESS,ProtocolDataProviderABI,provider);
	const uiPoolDataProvider = new ethers.Contract(UI_POOL_DATA_PROVIDER,UiPoolDataProviderABI,provider);
	const lendingPoolAddressProvider = new ethers.Contract(LENDING_POOL_ADDRESS_PROVIDER,LendingPoolAddressProviderABI,provider);

	console.log("=== Get LendingPool address from LendingPoolAddressProvider ===");
	const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();
	console.log("LendingPool address:",lendingPoolAddress);

	console.log("\n=== ProtocolDataProvider: Multiple Asset Reserve Data ===");

    for (const asset of ASSET_ADDRESSES) {
    try {
    const reserveData = await protocolDataProvider.getReserveData(asset.address);
    const configData = await protocolDataProvider.getReserveConfigurationData(asset.address);

    const supplyAPY = rayToPercent(reserveData[3]);
    const borrowAPY = rayToPercent(reserveData[4]);
    const ltv = Number(configData[0]) / 100;
    const liquidationThreshold = Number(configData[1]) / 100;


    console.log(`\nAsset: ${asset.name}`);
    console.log(`  Supply APY (%): ${supplyAPY.toFixed(4)}`);
    console.log(`  Borrow APY (%): ${borrowAPY.toFixed(4)}`);
    console.log(`  LTV (%): ${ltv.toFixed(2)}`);
    console.log(`  Liquidation Threshold (%): ${liquidationThreshold.toFixed(2)}`);
  } catch (error) {
    console.error(`Error fetching data for ${asset.name}:`, error);
  }
}

	//UI Pool Data Provider multi-assets integreted data
	console.log(`\n===UiPoolDataProvider obtain market integregation data ===`);
	
	const userAddress = ZeroAddress;
	const reservesData = await uiPoolDataProvider.getReservesData(userAddress);

	console.log("Market assets quantity:",reservesData.reservesData.length || reservesData[0].length);
	//The first asset name and total liquidity case
	if(reservesData.reservesData.length > 0 || reservesData[0].length > 0){
	const firstAsset = (reservesData.reservesData.length > 0) ? reservesData.reservesData[0]:reservesData[0][0];
	console.log("The first asset market liquidity:",firstAsset.totalLiquidity || firstAsset.totalLiquidityUSD || "Unknown");
	} else {
	console.log("Can't get market assets data");
	}
}

    main().catch(console.error);








