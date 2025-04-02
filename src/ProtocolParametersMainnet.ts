import {
    ProtocolParameters,
    defaultProtocolParameters
} from "@harmoniclabs/plu-ts";

// Realistic Cardano mainnet values
const cardanoMainnetProtocolParameters: ProtocolParameters = {
    // Transaction fees
    txFeePerByte: 44,               // 44 lovelace per byte
    txFeeFixed: 155381,             // 155,381 lovelace fixed fee
    
    // Block and transaction size limits
    maxBlockBodySize: 90112,        // ~90KB
    maxTxSize: 16384,               // 16KB
    maxBlockHeaderSize: 1100,       // 1.1KB
    
    // Stake and pool parameters
    stakeAddressDeposit: 2000000,   // 2 ADA
    stakePoolDeposit: 500000000,    // 500 ADA
    poolRetireMaxEpoch: 18,         // 18 epochs
    stakePoolTargetNum: 500,        // Target of 500 stake pools
    poolPledgeInfluence: 3/10,   // 0.3 (3/10) pledge influence factor
    
    // Monetary policy
    monetaryExpansion: 3/1000,   // 0.003 (3/1000)
    treasuryCut: 1/5,            // 0.2 (1/5)
    
    // Protocol version (deprecated in Conway)
    protocolVersion: {
        major: 8,
        minor: 0
    },
    
    // Pool operation costs
    minPoolCost: 340000000,         // 340 ADA minimum pool cost
    
    // UTXO handling
    utxoCostPerByte: 4310,          // 4,310 lovelace per byte for UTXO storage
    
    // Script execution costs and limits
    costModels: defaultProtocolParameters.costModels, // Placeholder - actual values are complex
 
    executionUnitPrices: {
        priceMemory: 577/10000,               // Memory price: 0.0577 (577/10000)
        priceSteps: 721/10000000            // Step price: 0.0000721 (721/10000000)
    },
    
    maxTxExecutionUnits: {
        memory: 14000000,           // 14M memory units
        steps: 10000000000          // 10B step units
    },
    
    maxBlockExecutionUnits: {
        memory: 62000000,           // 62M memory units
        steps: 40000000000          // 40B step units
    },
    
    // Value size limit
    maxValueSize: 5000,             // 5KB
    
    // Collateral parameters
    collateralPercentage: 150,      // 150%
    maxCollateralInputs: 3,         // Maximum of 3 collateral inputs
    
    // Governance parameters (Conway era)
    poolVotingThresholds: {
        motionNoConfidence: 51/100,     // 51%
        committeeNormal: 51/100,        // 51%
        committeeNoConfidence: 51/100,  // 51%
        hardForkInitiation: 51/100,     // 51%
        securityRelevantVotingThresholds : 51/100         // 51%
    },
    
    drepVotingThresholds: {
        motionNoConfidence: 51/100,     // 51%
        committeeNormal: 51/100,        // 51%
        committeeNoConfidence: 51/100,  // 51%
        updateConstitution: 51/100,     // 51%
        hardForkInitiation: 51/100,     // 51% 
        ppNetworkGroup: 51/100,         // 51%
        ppEconomicGroup: 51/100,        // 51%
        ppTechnicalGroup: 51/100,       // 51%
        ppGovGroup: 51/100,             // 51%
        treasuryWithdrawal: 51/100      // 51%
    },
    
    minCommitteSize: 9,             // Minimum of 9 committee members
    committeeTermLimit: 12,         // 12 epochs term limit
    governanceActionValidityPeriod: 3, // 3 epochs
    governanceActionDeposit: 1000000000, // 1000 ADA
    drepDeposit: 2000000,           // 2 ADA
    drepActivityPeriod: 60,         // 60 epochs
    minfeeRefScriptCostPerByte: 4/10 // 0.4 (4/10)
};

export {cardanoMainnetProtocolParameters};