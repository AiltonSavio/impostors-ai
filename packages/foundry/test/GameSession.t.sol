// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../contracts/GameSession.sol";

contract GameSessionTest is Test {
    GameSession game;
    address payable treasury = payable(address(2));
    uint initialBalance = 100 ether; // assign ample ETH for testing
    address owner = address(1);
    address player1 = address(3);
    address player2 = address(4);
    address player3 = address(5);
    address player4 = address(6);
    address player5 = address(7);
    uint constant price = 0.01 ether;

    function setUp() public {
        // Set initial ETH balance for all relevant addresses.
        vm.deal(owner, initialBalance);
        vm.deal(player1, initialBalance);
        vm.deal(player2, initialBalance);
        vm.deal(player3, initialBalance);
        vm.deal(player4, initialBalance);
        vm.deal(player5, initialBalance);

        // Deploy the contract as owner.
        vm.startPrank(owner);
        game = new GameSession(treasury);
        vm.stopPrank();
    }

    /// ---------------------
    /// CreateGameSession Tests
    /// ---------------------

    function testCreateGameSession() public {
        vm.prank(player1);
        // The creator sends the deposit along with the call.
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            5,
            price
        );
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
        assertEq(priceToJoin, price);
        assertFalse(started);
        assertFalse(ended);
        // Creator automatically joined.
        assertEq(players.length, 1);
    }

    function testCreateGameSessionRevert_InvalidName() public {
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("InvalidName()"));
        // Name longer than 30 bytes.
        game.createGameSession{value: price}(
            "This name is definitely more than thirty characters long",
            3,
            price
        );
    }

    function testCreateGameSessionRevert_InvalidMaxPlayers() public {
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("InvalidMaxPlayers()"));
        game.createGameSession{value: price}("Test", 0, price);

        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("InvalidMaxPlayers()"));
        game.createGameSession{value: price}("Test", 6, price);
    }

    function testCreateGameSessionRevert_InvalidPriceToJoin() public {
        // Price less than MIN_DEPOSIT (0.005 ETH)
        uint invalidPrice = 0.001 ether;
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("InvalidPriceToJoin()"));
        game.createGameSession{value: invalidPrice}("Test", 3, invalidPrice);
    }

    /// ---------------------
    /// joinGameSession Tests
    /// ---------------------

    function testJoinGameSession() public {
        // Create session; creator automatically joins.
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        // Other players join.
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

        (, , , , , address[] memory players) = game.getGameSession(sessionId);
        assertEq(players.length, 3);
    }

    function testJoinGameSessionRevert_SessionFull() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

        vm.prank(player4);
        vm.expectRevert(abi.encodeWithSignature("SessionFull()"));
        game.joinGameSession{value: price}(sessionId);
    }

    function testJoinGameSessionRevert_PlayerAlreadyJoined() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);

        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("PlayerAlreadyJoined()"));
        game.joinGameSession{value: price}(sessionId);
    }

    /// ---------------------
    /// startGame Tests
    /// ---------------------

    function testStartGame() public {
        // Create a session with 3 players.
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        (, , , bool started, , ) = game.getGameSession(sessionId);
        assertTrue(started);
    }

    function testStartGameRevert_NotOwner() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

        vm.prank(player1);
        vm.expectRevert();
        game.startGame(sessionId, 1);
    }

    function testStartGameRevert_AlreadyStarted() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSignature("GameAlreadyStarted()"));
        game.startGame(sessionId, 1);
    }

    /// ---------------------
    /// vote Tests
    /// ---------------------

    function testVoteRevert_GameNotStarted() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);
        // Game not started yet.
        vm.warp(block.timestamp + 121);
        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSignature("GameNotStarted()"));
        game.vote(sessionId, 1);
    }

    function testVoteRevert_VotingNotAllowed() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

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
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

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
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

        vm.prank(owner);
        game.startGame(sessionId, 1);
        vm.warp(block.timestamp + 121);
        vm.prank(player1);
        game.vote(sessionId, 1);
        // End the game.
        vm.warp(block.timestamp + 600);
        vm.prank(owner);
        game.endGame(sessionId);
        vm.prank(player2);
        vm.expectRevert(abi.encodeWithSignature("GameAlreadyEnded()"));
        game.vote(sessionId, 1);
    }

    /// ---------------------
    /// endGame Tests
    /// ---------------------

    // Test when no correct votes are cast.
    function testVoteAndEndGame_NoCorrectVotes() public {
        uint sessionId;
        // Create a session with 3 players.
        vm.prank(player1);
        sessionId = game.createGameSession{value: price}("Test Game", 3, price);
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);

        // Start game with traitor index 0.
        vm.prank(owner);
        game.startGame(sessionId, 0);

        // Warp time to allow voting.
        vm.warp(block.timestamp + 121);

        // All players vote incorrectly (vote 1, traitor is 0).
        vm.prank(player1);
        game.vote(sessionId, 1);
        vm.prank(player2);
        game.vote(sessionId, 1);
        vm.prank(player3);
        game.vote(sessionId, 1);

        // Before ending, record treasury balance.
        uint treasuryBalanceBefore = treasury.balance;
        // Warp to after endGame time.
        vm.warp(block.timestamp + 600);
        vm.prank(owner);
        game.endGame(sessionId);
        uint treasuryBalanceAfter = treasury.balance;
        // Expect the entire prize pool (3 * price) goes to treasury.
        uint expectedPool = 3 * price;
        assertEq(treasuryBalanceAfter - treasuryBalanceBefore, expectedPool);
    }

    // Test when there are correct votes.
    function testVoteAndEndGame_WithCorrectVotes() public {
        uint sessionId;
        // Create a session with 5 players.
        vm.prank(player1);
        sessionId = game.createGameSession{value: price}("Test Game", 5, price);
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player4);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player5);
        game.joinGameSession{value: price}(sessionId);

        // Start game with traitor index 2 (player3 is traitor).
        vm.prank(owner);
        game.startGame(sessionId, 2);

        // Warp time to allow voting.
        vm.warp(block.timestamp + 121);

        // Simulate votes:
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

        // Total prize pool: 5 players * price.
        uint totalPool = 5 * price;
        // Treasury always takes 5% if there is at least one correct vote.
        uint treasuryCut = (totalPool * 5) / 100;
        uint effectivePool = totalPool - treasuryCut;

        // For 3 correct votes, percentages are: [50, 30, 20].
        uint reward1 = (effectivePool * 50) / 100;
        uint reward2 = (effectivePool * 30) / 100;
        uint reward3 = (effectivePool * 20) / 100;

        uint treasuryBalanceBefore = treasury.balance;
        vm.warp(block.timestamp + 600);
        vm.prank(owner);
        game.endGame(sessionId);
        uint treasuryBalanceAfter = treasury.balance;
        assertEq(treasuryBalanceAfter - treasuryBalanceBefore, treasuryCut);

        // Check players’ balances.
        // Note: Each player spent `price` to join.
        // Players who did not vote correctly get no reward.
        // The expected final balance = initialBalance - price + reward (if they won).
        // player1 should receive reward1, player2 reward2, player4 reward3.
        // Players 3 and 5 get nothing (other than losing their deposit).
        assertEq(player1.balance, initialBalance - price + reward1);
        assertEq(player2.balance, initialBalance - price + reward2);
        assertEq(player3.balance, initialBalance - price);
        assertEq(player4.balance, initialBalance - price + reward3);
        assertEq(player5.balance, initialBalance - price);
    }

    function testEndGameRevert_TooEarly() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(owner);
        game.startGame(sessionId, 1);
        vm.warp(block.timestamp + 500);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSignature("GameNotEndedYet()"));
        game.endGame(sessionId);
    }

    function testEndGameRevert_AlreadyEnded() public {
        vm.prank(player1);
        uint sessionId = game.createGameSession{value: price}(
            "Test Game",
            3,
            price
        );
        vm.prank(player2);
        game.joinGameSession{value: price}(sessionId);
        vm.prank(player3);
        game.joinGameSession{value: price}(sessionId);
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
