/**
 * This file is autogenerated by Scaffold-ETH.
 * You should not edit it manually or your changes might be overwritten.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  31337: {
    GameSession: {
      address: "0x700b6a60ce7eaaea56f065753d8dcb9653dbad35",
      abi: [
        {
          type: "constructor",
          inputs: [
            {
              name: "_treasury",
              type: "address",
              internalType: "address payable",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "createGameSession",
          inputs: [
            {
              name: "_name",
              type: "string",
              internalType: "string",
            },
            {
              name: "_maxPlayers",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_priceToJoin",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "payable",
        },
        {
          type: "function",
          name: "endGame",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_impostorAgent",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "nonce",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "getGameSession",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "name",
              type: "string",
              internalType: "string",
            },
            {
              name: "maxPlayers",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "priceToJoin",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "started",
              type: "bool",
              internalType: "bool",
            },
            {
              name: "ended",
              type: "bool",
              internalType: "bool",
            },
            {
              name: "players",
              type: "address[]",
              internalType: "address[]",
            },
            {
              name: "correctVoters",
              type: "address[]",
              internalType: "address[]",
            },
            {
              name: "prizePool",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "startTime",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "impostorAgent",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getPlayerCount",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "joinGameSession",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "payable",
        },
        {
          type: "function",
          name: "owner",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "renounceOwnership",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "sessionCounter",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "startGame",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_impostorCommitment",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "transferOwnership",
          inputs: [
            {
              name: "newOwner",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "treasury",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address payable",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "vote",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "agentIndex",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "event",
          name: "AllPlayersJoined",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "GameEnded",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "GameSessionCreated",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "name",
              type: "string",
              indexed: false,
              internalType: "string",
            },
            {
              name: "maxPlayers",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "priceToJoin",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "GameStarted",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "OwnershipTransferred",
          inputs: [
            {
              name: "previousOwner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "newOwner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "PlayerJoined",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "RewardDistributed",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "reward",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "TreasuryPaid",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "amount",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "VoteCast",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "error",
          name: "AlreadyVoted",
          inputs: [],
        },
        {
          type: "error",
          name: "GameAlreadyEnded",
          inputs: [],
        },
        {
          type: "error",
          name: "GameAlreadyStarted",
          inputs: [],
        },
        {
          type: "error",
          name: "GameNotEndedYet",
          inputs: [],
        },
        {
          type: "error",
          name: "GameNotStarted",
          inputs: [],
        },
        {
          type: "error",
          name: "InsufficientDeposit",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidMaxPlayers",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidName",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidPriceToJoin",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidReveal",
          inputs: [],
        },
        {
          type: "error",
          name: "OwnableInvalidOwner",
          inputs: [
            {
              name: "owner",
              type: "address",
              internalType: "address",
            },
          ],
        },
        {
          type: "error",
          name: "OwnableUnauthorizedAccount",
          inputs: [
            {
              name: "account",
              type: "address",
              internalType: "address",
            },
          ],
        },
        {
          type: "error",
          name: "PlayerAlreadyJoined",
          inputs: [],
        },
        {
          type: "error",
          name: "RewardTransferFailed",
          inputs: [],
        },
        {
          type: "error",
          name: "SessionFull",
          inputs: [],
        },
        {
          type: "error",
          name: "TreasuryTransferFailed",
          inputs: [],
        },
        {
          type: "error",
          name: "VotingNotAllowed",
          inputs: [],
        },
      ],
      inheritedFunctions: {},
      deploymentFile: "run-1752227630.json",
      deploymentScript: "Deploy.s.sol",
    },
  },
  43113: {
    GameSession: {
      address: "0x71b8887d32b15ced50406dd3793ec4659935f8c8",
      abi: [
        {
          type: "constructor",
          inputs: [
            {
              name: "_treasury",
              type: "address",
              internalType: "address payable",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "createGameSession",
          inputs: [
            {
              name: "_name",
              type: "string",
              internalType: "string",
            },
            {
              name: "_maxPlayers",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_priceToJoin",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "payable",
        },
        {
          type: "function",
          name: "endGame",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_impostorAgent",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "nonce",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "getGameSession",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "name",
              type: "string",
              internalType: "string",
            },
            {
              name: "maxPlayers",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "priceToJoin",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "started",
              type: "bool",
              internalType: "bool",
            },
            {
              name: "ended",
              type: "bool",
              internalType: "bool",
            },
            {
              name: "players",
              type: "address[]",
              internalType: "address[]",
            },
            {
              name: "correctVoters",
              type: "address[]",
              internalType: "address[]",
            },
            {
              name: "prizePool",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "startTime",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "impostorAgent",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getPlayerCount",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "joinGameSession",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "payable",
        },
        {
          type: "function",
          name: "owner",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "renounceOwnership",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "sessionCounter",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "startGame",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_impostorCommitment",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "transferOwnership",
          inputs: [
            {
              name: "newOwner",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "treasury",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address payable",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "vote",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "agentIndex",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "event",
          name: "AllPlayersJoined",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "GameEnded",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "GameSessionCreated",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "name",
              type: "string",
              indexed: false,
              internalType: "string",
            },
            {
              name: "maxPlayers",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "priceToJoin",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "GameStarted",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "OwnershipTransferred",
          inputs: [
            {
              name: "previousOwner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "newOwner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "PlayerJoined",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "RewardDistributed",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "reward",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "TreasuryPaid",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "amount",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "VoteCast",
          inputs: [
            {
              name: "sessionId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "error",
          name: "AlreadyVoted",
          inputs: [],
        },
        {
          type: "error",
          name: "GameAlreadyEnded",
          inputs: [],
        },
        {
          type: "error",
          name: "GameAlreadyStarted",
          inputs: [],
        },
        {
          type: "error",
          name: "GameNotEndedYet",
          inputs: [],
        },
        {
          type: "error",
          name: "GameNotStarted",
          inputs: [],
        },
        {
          type: "error",
          name: "InsufficientDeposit",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidMaxPlayers",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidName",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidPriceToJoin",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidReveal",
          inputs: [],
        },
        {
          type: "error",
          name: "OwnableInvalidOwner",
          inputs: [
            {
              name: "owner",
              type: "address",
              internalType: "address",
            },
          ],
        },
        {
          type: "error",
          name: "OwnableUnauthorizedAccount",
          inputs: [
            {
              name: "account",
              type: "address",
              internalType: "address",
            },
          ],
        },
        {
          type: "error",
          name: "PlayerAlreadyJoined",
          inputs: [],
        },
        {
          type: "error",
          name: "RewardTransferFailed",
          inputs: [],
        },
        {
          type: "error",
          name: "SessionFull",
          inputs: [],
        },
        {
          type: "error",
          name: "TreasuryTransferFailed",
          inputs: [],
        },
        {
          type: "error",
          name: "VotingNotAllowed",
          inputs: [],
        },
      ],
      inheritedFunctions: {},
      deploymentFile: "run-1741211673.json",
      deploymentScript: "Deploy.s.sol",
    },
  },
} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
