// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "forge-std/console.sol";

error InvalidName();
error InvalidMaxPlayers();
error InvalidPriceToJoin();
error GameNotStarted();
error VotingNotAllowed();
error AlreadyVoted();
error GameAlreadyEnded();
error GameNotEndedYet();
error SessionFull();
error InsufficientDeposit();
error TreasuryTransferFailed();
error RewardTransferFailed();

contract GameSession is Ownable {
    uint public sessionCounter;
    // 10 USDC (assuming USDC has 6 decimals)
    uint constant DEPOSIT = 10 * 10 ** 6;

    IERC20 public token;
    address public treasury; // Company treasury address

    /// @notice Session struct holds all game state.
    struct Session {
        string name;
        uint startTime;
        uint maxPlayers;
        uint priceToJoin;
        address[] players;
        mapping(address => bool) hasVoted;
        mapping(address => uint) votedAgent;
        address[] voteOrder; // Order in which votes were cast.
        address[] correctVoters; // Order of players who voted for the traitor.
        bool started;
        bool ended;
        uint impostorAgent; // Index into players array indicating the traitor.
        uint prizePool; // Total deposits.
    }

    // Since Session contains mappings, we use a mapping from sessionId to Session.
    mapping(uint => Session) private sessions;

    /// @notice Constructor sets the USDC token and treasury address.
    constructor(IERC20 _token, address _treasury) Ownable(msg.sender) {
        token = _token;
        treasury = _treasury;
    }

    /// @notice Creates a new game session.
    /// @param _name The chosen game name (e.g., "Medieval Kingdom Strategy").
    /// @param _maxPlayers The maximum number of players (1–5).
    /// @param _priceToJoin The price to join (in USDC, must be at least 10 USDC).
    /// @return sessionId The new session’s ID.
    function createGameSession(
        string memory _name,
        uint _maxPlayers,
        uint _priceToJoin
    ) public returns (uint sessionId) {
        if (bytes(_name).length > 30) revert InvalidName();
        if (_maxPlayers < 1 || _maxPlayers > 5) revert InvalidMaxPlayers();
        if (_priceToJoin < 10 * 10 ** 6) revert InvalidPriceToJoin();

        sessionCounter++;
        sessionId = sessionCounter;
        Session storage s = sessions[sessionId];
        s.name = _name;
        s.maxPlayers = _maxPlayers;
        s.priceToJoin = _priceToJoin;
        s.started = false;
        s.ended = false;
        s.prizePool = 0;

        emit GameSessionCreated(sessionId, _name, _maxPlayers, _priceToJoin);
    }

    /// @notice Returns basic session details.
    function getGameSession(
        uint sessionId
    )
        public
        view
        returns (string memory, uint, uint, bool, bool, address[] memory)
    {
        Session storage s = sessions[sessionId];
        return (
            s.name,
            s.maxPlayers,
            s.priceToJoin,
            s.started,
            s.ended,
            s.players
        );
    }

    /// @notice Returns the number of players in a session.
    function getPlayerCount(uint sessionId) public view returns (uint) {
        return sessions[sessionId].players.length;
    }

    /// @notice Allows a player to join a session by depositing the required USDC.
    function joinGameSession(uint sessionId) public {
        Session storage s = sessions[sessionId];
        if (s.players.length >= s.maxPlayers) revert SessionFull();

        bool success = token.transferFrom(
            msg.sender,
            address(this),
            s.priceToJoin
        );
        if (!success) revert InsufficientDeposit();

        s.players.push(msg.sender);
        s.prizePool += s.priceToJoin;
        emit PlayerJoined(sessionId, msg.sender);
    }

    /// @notice Allows a player to vote for the traitor.
    /// @param sessionId The session ID.
    /// @param agentIndex The index of the agent that the voter believes is the traitor.
    function vote(uint sessionId, uint agentIndex) public {
        Session storage s = sessions[sessionId];
        if (!s.started) revert GameNotStarted();
        if (block.timestamp < s.startTime + 120) revert VotingNotAllowed();
        if (s.hasVoted[msg.sender]) revert AlreadyVoted();
        if (s.ended) revert GameAlreadyEnded();


        s.hasVoted[msg.sender] = true;
        s.votedAgent[msg.sender] = agentIndex;
        s.voteOrder.push(msg.sender);

        emit VoteCast(sessionId, msg.sender);
    }

    /// @notice Starts the game.
    /// Only the owner can call this. Sets the start time and assigns the traitor.
    /// @param sessionId The session ID.
    /// @param _impostorAgent The index (within the players array) of the traitor.
    function startGame(uint sessionId, uint _impostorAgent) public onlyOwner {
        Session storage s = sessions[sessionId];
        require(!s.started, "Game already started");
        require(_impostorAgent < s.players.length, "Invalid traitor index");
        s.startTime = block.timestamp;
        s.impostorAgent = _impostorAgent;
        s.started = true;
        emit GameStarted(sessionId);
    }

    /// @notice Ends the game after 10 minutes and distributes rewards.
    /// If no player voted correctly (i.e. no vote equals the traitor index),
    /// the entire prize pool is transferred to the treasury.
    /// Otherwise, 2% of the prize pool is sent to the treasury and the remaining is distributed among correct voters.
    /// @param sessionId The session ID.
    function endGame(uint sessionId) public {
        Session storage s = sessions[sessionId];
        if (block.timestamp < s.startTime + 600) revert GameNotEndedYet();
        if (s.ended) revert GameAlreadyEnded();
        s.ended = true;

        // Gather correct voters in the order they voted.
        uint count = 0;
        for (uint i = 0; i < s.voteOrder.length; i++) {
            address voter = s.voteOrder[i];
            if (s.votedAgent[voter] == s.impostorAgent) {
                s.correctVoters.push(voter);
                count++;
            }
        }

        if (count == 0) {
            // No correct votes: transfer entire prize pool to treasury.
            bool sentTreasury = token.transfer(treasury, s.prizePool);
            if (!sentTreasury) revert TreasuryTransferFailed();
            emit TreasuryPaid(sessionId, s.prizePool);
        } else {
            // Always transfer 2% to the treasury if at least one player won.
            uint treasuryCut = (s.prizePool * 2) / 100;
            bool sentTreasury = token.transfer(treasury, treasuryCut);
            if (!sentTreasury) revert TreasuryTransferFailed();
            emit TreasuryPaid(sessionId, treasuryCut);

            uint effectivePool = s.prizePool - treasuryCut;

            // Define reward percentages based on the number of correct voters.
            uint[] memory percentages;
            if (count == 1) {
                percentages = new uint[](1);
                percentages[0] = 100;
            } else if (count == 2) {
                percentages = new uint[](2);
                percentages[0] = 60;
                percentages[1] = 40;
            } else if (count == 3) {
                percentages = new uint[](3);
                percentages[0] = 50;
                percentages[1] = 30;
                percentages[2] = 20;
            } else if (count == 4) {
                percentages = new uint[](4);
                percentages[0] = 40;
                percentages[1] = 30;
                percentages[2] = 20;
                percentages[3] = 10;
            } else if (count == 5) {
                percentages = new uint[](5);
                percentages[0] = 35;
                percentages[1] = 25;
                percentages[2] = 20;
                percentages[3] = 15;
                percentages[4] = 5;
            } else {
                // If more than 5 players (should not happen in our design), distribute equally.
                percentages = new uint[](count);
                for (uint i = 0; i < count; i++) {
                    percentages[i] = 100 / count;
                }
            }

            // Distribute the effectivePool among the correct voters.
            for (uint i = 0; i < count; i++) {
                uint reward = (effectivePool * percentages[i]) / 100;
                bool sent = token.transfer(s.correctVoters[i], reward);
                if (!sent) revert RewardTransferFailed();
                emit RewardDistributed(sessionId, s.correctVoters[i], reward);
            }
        }
        emit GameEnded(sessionId);
    }

    /// ===== Events =====
    event GameSessionCreated(
        uint indexed sessionId,
        string name,
        uint maxPlayers,
        uint priceToJoin
    );
    event PlayerJoined(uint indexed sessionId, address indexed player);
    event VoteCast(uint indexed sessionId, address indexed player);
    event GameStarted(uint indexed sessionId);
    event TreasuryPaid(uint indexed sessionId, uint amount);
    event RewardDistributed(
        uint indexed sessionId,
        address indexed player,
        uint reward
    );
    event GameEnded(uint indexed sessionId);
}
