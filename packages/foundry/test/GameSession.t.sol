// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../contracts/GameSession.sol";

/// @dev A minimal mock ERC20 token to simulate USDC.
contract MockERC20 is IERC20 {
    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;
    uint public _totalSupply;

    function mint(address to, uint amount) public {
        balanceOf[to] += amount;
        _totalSupply += amount;
    }

    function totalSupply() public view override returns (uint) {
        return _totalSupply;
    }

    function transferFrom(
        address from,
        address to,
        uint amount
    ) external override returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(
            allowance[from][msg.sender] >= amount,
            "Insufficient allowance"
        );
        balanceOf[from] -= amount;
        allowance[from][msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transfer(
        address to,
        uint amount
    ) external override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

/// @dev Test suite for the GameSession contract.
contract GameSessionTest is Test {
    GameSession game;
    MockERC20 token;
    uint initialBalance = 1000 * 10 ** 6;
    address owner = address(1);
    address treasury = address(2);
    address player1 = address(3);
    address player2 = address(4);
    address player3 = address(5);
    address player4 = address(6);
    address player5 = address(7);

    function setUp() public {
        // Set msg.sender to owner for deployment.
        vm.startPrank(owner);
        token = new MockERC20();
        game = new GameSession(token, treasury);
        vm.stopPrank();

        // Mint tokens to players and approve the game contract.
        token.mint(player1, initialBalance);
        token.mint(player2, initialBalance);
        token.mint(player3, initialBalance);
        token.mint(player4, initialBalance);
        token.mint(player5, initialBalance);

        vm.prank(player1);
        token.approve(address(game), initialBalance);
        vm.prank(player2);
        token.approve(address(game), initialBalance);
        vm.prank(player3);
        token.approve(address(game), initialBalance);
        vm.prank(player4);
        token.approve(address(game), initialBalance);
        vm.prank(player5);
        token.approve(address(game), initialBalance);
    }

    /// ---------------------
    /// CreateGameSession Tests
    /// ---------------------

    function testCreateGameSession() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 5, 10 * 10 ** 6);
        (
            string memory name,
            uint maxPlayers,
            uint priceToJoin,
            bool started,
            bool ended,
            address[] memory players
        ) = game.getGameSession(sessionId);
        assertEq(name, "Test Game");
        assertEq(maxPlayers, 5);
        assertEq(priceToJoin, 10 * 10 ** 6);
        assertFalse(started);
        assertFalse(ended);
        assertEq(players.length, 0);
    }

    function testCreateGameSessionRevert_InvalidName() public {
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("InvalidName()"));
        // Name longer than 30 bytes.
        game.createGameSession(
            "This name is definitely more than thirty characters long",
            3,
            10 * 10 ** 6
        );
    }

    function testCreateGameSessionRevert_InvalidMaxPlayers() public {
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("InvalidMaxPlayers()"));
        game.createGameSession("Test", 0, 10 * 10 ** 6);

        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("InvalidMaxPlayers()"));
        game.createGameSession("Test", 6, 10 * 10 ** 6);
    }

    function testCreateGameSessionRevert_InvalidPriceToJoin() public {
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("InvalidPriceToJoin()"));
        game.createGameSession("Test", 3, 5 * 10 ** 6);
    }

    /// ---------------------
    /// joinGameSession Tests
    /// ---------------------

    function testJoinGameSession() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);

        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        (, , , , , address[] memory players) = game.getGameSession(sessionId);
        assertEq(players.length, 3);

        // Expect revert when session is full.
        vm.prank(player4);
        vm.expectRevert(abi.encodeWithSignature("SessionFull()"));
        game.joinGameSession(sessionId);
    }

    function testJoinGameSessionRevert_SessionFull() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);

        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        vm.prank(player4);
        vm.expectRevert(abi.encodeWithSignature("SessionFull()"));
        game.joinGameSession(sessionId);
    }

    /// ---------------------
    /// startGame Tests
    /// ---------------------

    function testStartGame() public {
        // Create a session with 3 players.
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        // Only owner can start the game.
        vm.prank(owner);
        game.startGame(sessionId, 1);
        (, , , bool started, , ) = game.getGameSession(sessionId);
        assertTrue(started);

        // Test that non-owner cannot start the game.
        vm.prank(player1);
        vm.expectRevert(); // expect a revert since caller is not owner.
        game.startGame(sessionId, 1);
    }

    function testStartGameRevert_NotOwner() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        vm.prank(player1);
        vm.expectRevert(); // Not owner, so should revert.
        game.startGame(sessionId, 1);
    }

    function testStartGameRevert_AlreadyStarted() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        vm.prank(owner);
        // Expect revert with "Game already started"
        vm.expectRevert("Game already started");
        game.startGame(sessionId, 1);
    }

    function testStartGameRevert_InvalidTraitorIndex() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        // Only 2 players joined; traitor index 2 is invalid.
        vm.prank(owner);
        vm.expectRevert("Invalid traitor index");
        game.startGame(sessionId, 2);
    }

    /// ---------------------
    /// vote Tests
    /// ---------------------

    function testVoteAndEndGame_NoCorrectVotes() public {
        // Create a session with 3 players.
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        // Start game with traitor index 0.
        vm.prank(owner);
        game.startGame(sessionId, 0);

        // Warp time to allow voting.
        vm.warp(block.timestamp + 121);

        // All players vote for a wrong agent index (e.g., vote 1).
        vm.prank(player1);
        game.vote(sessionId, 1);
        vm.prank(player2);
        game.vote(sessionId, 1);
        vm.prank(player3);
        game.vote(sessionId, 1);

        // End the game. Expect entire prize pool (3 * 10 * 10e6) goes to treasury.
        uint expectedPool = 3 * 10 * 10 ** 6; // 3 players 10 * 10e6 deposit each.
        uint treasuryBalanceBefore = token.balanceOf(treasury);
        vm.warp(block.timestamp + 600);
        vm.prank(owner);
        game.endGame(sessionId);
        uint treasuryBalanceAfter = token.balanceOf(treasury);
        assertEq(treasuryBalanceAfter - treasuryBalanceBefore, expectedPool);
    }

    function testVoteAndEndGame_WithCorrectVotes() public {
        // Create a session with 5 players.
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 5, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);
        vm.prank(player4);
        game.joinGameSession(sessionId);
        vm.prank(player5);
        game.joinGameSession(sessionId);

        // Start game with traitor index 2 (player3 is traitor).
        vm.prank(owner);
        game.startGame(sessionId, 2);

        // Warp time to allow voting.
        vm.warp(block.timestamp + 121);

        // Simulate votes.
        // Correct votes: vote index 2.
        vm.prank(player1);
        game.vote(sessionId, 2); // correct
        vm.prank(player2);
        game.vote(sessionId, 2); // correct
        vm.prank(player3);
        game.vote(sessionId, 1); // wrong
        vm.prank(player4);
        game.vote(sessionId, 2); // correct
        vm.prank(player5);
        game.vote(sessionId, 1); // wrong

        // End the game. Total prize pool: 5 * 10 * 10e6.
        uint priceToJoin = 10 * 10 ** 6;
        uint totalPool = 5 * priceToJoin; // 5 players each deposit 10 USDC.
        // Treasury should always get 2% if there is at least one correct vote.
        uint treasuryCut = (totalPool * 2) / 100;
        uint effectivePool = totalPool - treasuryCut;
        // For 3 correct votes, the contract uses percentages 50, 30, 20.
        uint reward1 = (effectivePool * 50) / 100;
        uint reward2 = (effectivePool * 30) / 100;
        uint reward3 = (effectivePool * 20) / 100;

        uint treasuryBalanceBefore = token.balanceOf(treasury);
        vm.warp(block.timestamp + 600);
        vm.prank(owner);
        game.endGame(sessionId);
        uint treasuryBalanceAfter = token.balanceOf(treasury);
        assertEq(treasuryBalanceAfter - treasuryBalanceBefore, treasuryCut);
        assertEq(
            token.balanceOf(player1),
            initialBalance - priceToJoin + reward1
        );
        assertEq(
            token.balanceOf(player2),
            initialBalance - priceToJoin + reward2
        );
        assertEq(token.balanceOf(player3), initialBalance - priceToJoin);
        assertEq(
            token.balanceOf(player4),
            initialBalance - priceToJoin + reward3
        );
        assertEq(token.balanceOf(player5), initialBalance - priceToJoin);
    }

    function testVoteRevert_GameNotStarted() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);
        // Game not started, so vote should revert.
        vm.warp(block.timestamp + 121);
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("GameNotStarted()"));
        game.vote(sessionId, 1);
    }

    function testVoteRevert_VotingNotAllowed() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        // Warp less than 120 seconds after start.
        vm.warp(block.timestamp + 100);
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("VotingNotAllowed()"));
        game.vote(sessionId, 1);
    }

    function testVoteRevert_AlreadyVoted() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        vm.warp(block.timestamp + 121);
        vm.prank(player1);
        game.vote(sessionId, 1);
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("AlreadyVoted()"));
        game.vote(sessionId, 1);
    }

    function testVoteRevert_GameAlreadyEnded() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        vm.warp(block.timestamp + 121);
        vm.prank(player1);
        game.vote(sessionId, 1);
        // End the game
        vm.warp(block.timestamp + 600);
        vm.prank(owner);
        game.endGame(sessionId);
        // Attempt to vote after game ended.
        vm.prank(player2);
        vm.expectRevert(abi.encodeWithSignature("GameAlreadyEnded()"));
        game.vote(sessionId, 1);
    }

    /// ---------------------
    /// endGame Tests
    /// ---------------------

    function testEndGameRevert_TooEarly() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        // Warp less than 600 seconds after start.
        vm.warp(block.timestamp + 500);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSignature("GameNotEndedYet()"));
        game.endGame(sessionId);
    }

    function testEndGameRevert_AlreadyEnded() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession("Test Game", 3, 10 * 10 ** 6);
        vm.prank(player1);
        game.joinGameSession(sessionId);
        vm.prank(player2);
        game.joinGameSession(sessionId);
        vm.prank(player3);
        game.joinGameSession(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        vm.warp(block.timestamp + 600);
        vm.prank(owner);
        game.endGame(sessionId);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSignature("GameAlreadyEnded()"));
        game.endGame(sessionId);
    }
}
