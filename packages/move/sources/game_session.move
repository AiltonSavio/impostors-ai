module impostors_ai::game_session;

use std::option::none;
use std::string::String;
use sui::balance::{Balance, join, split, value};
use sui::clock::{Clock, timestamp_ms};
use sui::coin::{Coin, from_balance};
use sui::sui::SUI;
use sui::vec_map::{Self, VecMap};

// === Errors ===
const E_ALREADY_JOINED: u64 = 1;
const E_SESSION_FULL: u64 = 2;
const E_GAME_ALREADY_STARTED: u64 = 3;
const E_GAME_NOT_STARTED: u64 = 4;
const E_GAME_ALREADY_ENDED: u64 = 5;
const E_GAME_NOT_ENDED: u64 = 6;
const E_ALREADY_VOTED: u64 = 7;
const E_INVALID_NAME_LENGTH: u64 = 8;
const E_INVALID_DEPOSIT: u64 = 9;
const E_INVALID_MAX_PLAYERS: u64 = 10;
const E_INVALID_PRICE_TO_JOIN: u64 = 11;
const E_INVALID_IMPOSTOR_AGENT: u64 = 12;
const E_INVALID_NUMBER_OF_PLAYERS: u64 = 13;

/// Reward percentages for 1 to 5 winners
const PERC_1: u64 = 100;
const PERC_2: vector<u64> = vector[60, 40];
const PERC_3: vector<u64> = vector[50, 30, 20];
const PERC_4: vector<u64> = vector[40, 30, 20, 10];
const PERC_5: vector<u64> = vector[35, 25, 20, 15, 5];
const TREASURY_BPS: u64 = 500; // 5%
const BPS_DENOM: u64 = 10_000;
const GAME_DURATION: u64 = 60 * 10_000; // 10 minute
const AGENTS_QUANTITY: u8 = 10;
const MIN_PRICE_TO_JOIN: u64 = 1_000_000_000; // 1 SUI

public struct AdminCap has key { id: UID }

/// Game session object
public struct GameSession has key, store {
    id: UID,
    name: String,
    max_players: u8,
    price_to_join: u64,
    players: vector<address>,
    started: bool,
    ended: bool,
    start_time: u64,
    impostor_agent: Option<u8>,
    prize_pool: Balance<SUI>,
    voted_agent: VecMap<address, u8>, // in order of voting
    correct_voters: vector<address>,
}

public struct GameSessionList has key, store {
    id: UID,
    game_session_ids: vector<ID>,
}

fun init(ctx: &mut TxContext) {
    transfer::transfer(
        AdminCap { id: object::new(ctx) },
        ctx.sender(),
    );

    let game_session_list = GameSessionList {
        id: object::new(ctx),
        game_session_ids: vector::empty<ID>(),
    };
    transfer::share_object(game_session_list);
}

// Create a new session. Sender is admin.
public entry fun create(
    game_session_list: &mut GameSessionList,
    name: String,
    max_players: u8,
    price_to_join: u64,
    deposit: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(name.length() <= 30, E_INVALID_NAME_LENGTH);
    assert!(max_players >= 1 && max_players <= 5, E_INVALID_MAX_PLAYERS);
    assert!(price_to_join >= MIN_PRICE_TO_JOIN, E_INVALID_PRICE_TO_JOIN); // 0.005 SUI
    assert!(deposit.value() == price_to_join, E_INVALID_DEPOSIT);

    let game_session = GameSession {
        id: object::new(ctx),
        name,
        max_players,
        price_to_join,
        players: vector::singleton(ctx.sender()),
        started: false,
        ended: false,
        start_time: 0,
        impostor_agent: none(),
        prize_pool: deposit.into_balance(),
        voted_agent: vec_map::empty(),
        correct_voters: vector::empty<address>(),
    };

    // Add the session to the list
    vector::push_back(&mut game_session_list.game_session_ids, object::id(&game_session));

    transfer::share_object(game_session);
}

// Join an existing session.
public entry fun join_session(
    game_session: &mut GameSession,
    deposit: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(game_session.players.length() < game_session.max_players as u64, E_SESSION_FULL);
    assert!(!game_session.started, E_GAME_ALREADY_STARTED);
    assert!(deposit.value() == game_session.price_to_join, E_INVALID_DEPOSIT);
    let mut i = 0;
    while (i < vector::length(&game_session.players)) {
        assert!(*vector::borrow(&game_session.players, i) != ctx.sender(), E_ALREADY_JOINED);
        i = i + 1;
    };

    vector::push_back(&mut game_session.players, ctx.sender());
    join(&mut game_session.prize_pool, deposit.into_balance());
}

// Start the game: store commitment and start time. Only admin.
public entry fun start(
    _: &AdminCap,
    game_session: &mut GameSession,
    impostor_agent: Option<u8>,
    clock: &Clock,
) {
    assert!(!game_session.started, E_GAME_ALREADY_STARTED);
    assert!(game_session.players.length() > 1, E_INVALID_NUMBER_OF_PLAYERS);
    assert!(
        impostor_agent.is_some() && impostor_agent.get_with_default(AGENTS_QUANTITY) < AGENTS_QUANTITY,
        E_INVALID_IMPOSTOR_AGENT,
    );

    game_session.impostor_agent = impostor_agent;
    game_session.start_time = timestamp_ms(clock);
    game_session.started = true;
}

// Player votes for impostor agent
public entry fun vote(game_session: &mut GameSession, agent: u8, ctx: &mut TxContext) {
    assert!(game_session.started, E_GAME_NOT_STARTED);
    assert!(!game_session.ended, E_GAME_ALREADY_ENDED);
    assert!(!game_session.voted_agent.contains(&ctx.sender()), E_ALREADY_VOTED);
    assert!(agent < AGENTS_QUANTITY, E_INVALID_IMPOSTOR_AGENT);

    game_session.voted_agent.insert(ctx.sender(), agent);
}

// End game, verify commitment, distribute prizes. Only admin.
public entry fun end(
    _: &AdminCap,
    game_session: &mut GameSession,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(game_session.started, E_GAME_NOT_STARTED);
    assert!(timestamp_ms(clock) > game_session.start_time + GAME_DURATION, E_GAME_NOT_ENDED);
    assert!(!game_session.ended, E_GAME_ALREADY_ENDED);

    game_session.ended = true;

    let mut i = 0;
    while (i < game_session.players.length()) {
        let voter = *vector::borrow(&game_session.players, i);
        let vote_option = game_session.voted_agent.try_get(&voter);
        let vote = vote_option.get_with_default(10);
        if (vote == game_session.impostor_agent.get_with_default(10)) {
            game_session.correct_voters.push_back(voter);
        };
        i = i + 1;
    };

    let prize_pool = &mut game_session.prize_pool;
    let total = value(prize_pool);
    let correct_voters_length = game_session.correct_voters.length();
    if (correct_voters_length == 0) {
        // All to treasury
        let treasury_amount = split(prize_pool, total);
        let treasury_coin = from_balance(treasury_amount, ctx);
        transfer::public_transfer(treasury_coin, ctx.sender());
    } else {
        // Treasury cut
        let treasury_cut = (total * TREASURY_BPS) / BPS_DENOM;
        let treasury_amount = split(prize_pool, treasury_cut);
        let treasury_coin = from_balance(treasury_amount, ctx);
        transfer::public_transfer(treasury_coin, ctx.sender());

        let winners_total = value(prize_pool);
        let winners = &game_session.correct_voters;
        let mut percentages = vector::empty<u64>();
        if (correct_voters_length == 1) {
            percentages = vector[PERC_1];
        } else if (correct_voters_length == 2) {
            percentages = PERC_2;
        } else if (correct_voters_length == 3) {
            percentages = PERC_3;
        } else if (correct_voters_length == 4) {
            percentages = PERC_4;
        } else if (correct_voters_length == 5) {
            percentages = PERC_5;
        };
        let mut j = 0;
        while (j < correct_voters_length) {
            let pct = *vector::borrow(&percentages, j);
            let reward = (winners_total * pct) / 100;
            let win_amount = split(prize_pool, reward);
            let win_coin = from_balance(win_amount, ctx);
            transfer::public_transfer(win_coin, *vector::borrow(winners, j));
            j = j + 1;
        }
    }
}

#[test_only]
use sui::coin::mint_for_testing;
#[test_only]
use sui::test_scenario;
#[test_only]
use sui::test_scenario::return_shared;
#[test_only]
use std::option::some;
#[test_only]
use sui::clock::destroy_for_testing;
#[test_only]
use sui::test_scenario::{take_from_address, return_to_address, ids_for_address};

#[test_only]
const ADMIN: address = @0xAD;
#[test_only]
const USER: address = @0xBEEF;
#[test_only]
const USER2: address = @0xCAFE;

#[test]
fun test_create_session() {
    let price_to_join = 10_000_000_000;
    let mut scenario = test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create a session
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"Test Session".to_string(),
            5,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // Get the session
    scenario.next_tx(ADMIN);
    {
        let game_session = scenario.take_shared<GameSession>();
        assert!(game_session.name == b"Test Session".to_string());
        assert!(game_session.max_players == 5);
        assert!(game_session.price_to_join == price_to_join);
        assert!(game_session.players.length() == 1);
        assert!(game_session.players[0] == ADMIN);
        assert!(game_session.started == false);
        assert!(game_session.ended == false);
        assert!(game_session.start_time == 0);
        assert!(game_session.impostor_agent.is_none());
        assert!(game_session.prize_pool.value() == price_to_join);
        assert!(game_session.voted_agent.size() == 0);
        assert!(game_session.correct_voters.length() == 0);
        return_shared(game_session);
    };

    scenario.end();
}

#[test]
fun test_join_session_success() {
    let price_to_join = 10_000_000_000;
    let mut scenario = test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create session
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"Test Session".to_string(),
            2,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // USER joins
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());

        assert!(game_session.players.length() == 2);
        assert!(game_session.players[1] == USER);
        assert!(game_session.prize_pool.value() == price_to_join * 2);

        return_shared(game_session);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = E_SESSION_FULL)]
fun test_join_session_full() {
    let price_to_join = 10_000_000_000;
    let mut scenario = test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create session (max_players = 1)
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"Test".to_string(),
            1,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // USER tries to join (should fail)
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = E_ALREADY_JOINED)]
fun test_join_session_already_joined() {
    let price_to_join = 10_000_000_000;
    let mut scenario = test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create session
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"Test".to_string(),
            3,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // USER joins once
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    // Same user tries again (should fail)
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = E_INVALID_DEPOSIT)]
fun test_join_session_wrong_deposit() {
    let price_to_join = 10_000_000_000;
    let mut scenario = test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create session
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"Test".to_string(),
            2,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // USER joins with wrong amount (should fail)
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join / 2, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    scenario.end();
}

#[test]
fun test_start_game_success() {
    let price_to_join = 10_000_000_000;
    let mut scenario = sui::test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create session (max_players=2)
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"StartTest".to_string(),
            2,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // USER joins
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    // Start game as admin
    scenario.next_tx(ADMIN);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let cap = scenario.take_from_address<AdminCap>(ADMIN);
        let mut clock = sui::clock::create_for_testing(scenario.ctx());
        clock.set_for_testing(10);
        start(&cap, &mut game_session, some(1), &clock);

        assert!(game_session.started == true);
        assert!(game_session.start_time == 10);
        assert!(game_session.impostor_agent.is_some());
        assert!(game_session.voted_agent.size() == 0);
        assert!(game_session.correct_voters.length() == 0);

        scenario.return_to_sender(cap);
        destroy_for_testing(clock);
        return_shared(game_session);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = E_GAME_ALREADY_STARTED)]
fun test_start_game_twice_fails() {
    let price_to_join = 10_000_000_000;
    let mut scenario = sui::test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create session (max_players=2)
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"StartTwice".to_string(),
            2,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // USER joins
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    // Start game
    scenario.next_tx(ADMIN);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let cap = scenario.take_from_address<AdminCap>(ADMIN);
        let clock = sui::clock::create_for_testing(scenario.ctx());
        start(&cap, &mut game_session, some(2), &clock);

        scenario.return_to_sender(cap);
        destroy_for_testing(clock);
        return_shared(game_session);
    };

    // Try to start again (should fail)
    scenario.next_tx(ADMIN);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let cap = scenario.take_from_address<AdminCap>(ADMIN);
        let clock = sui::clock::create_for_testing(scenario.ctx());
        start(&cap, &mut game_session, some(3), &clock);

        scenario.return_to_sender(cap);
        destroy_for_testing(clock);
        return_shared(game_session);
    };

    scenario.end();
}

#[test]
fun test_vote_success() {
    let price_to_join = 10_000_000_000;
    let mut scenario = sui::test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create session (max_players=2)
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"VoteTest".to_string(),
            2,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // USER joins
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    // Start game
    scenario.next_tx(ADMIN);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let cap = scenario.take_from_address<AdminCap>(ADMIN);
        let clock = sui::clock::create_for_testing(scenario.ctx());
        start(&cap, &mut game_session, some(1), &clock);

        scenario.return_to_sender(cap);
        destroy_for_testing(clock);
        return_shared(game_session);
    };

    // USER votes
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        vote(&mut game_session, 1, scenario.ctx());
        return_shared(game_session);
    };

    scenario.end();
}

#[test]
fun test_end_success() {
    let price_to_join = 10_000_000_000;
    let mut scenario = sui::test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    // Create session (max_players=2)
    scenario.next_tx(ADMIN);
    {
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        let mut game_session_list = scenario.take_shared<GameSessionList>();
        create(
            &mut game_session_list,
            b"VoteTest".to_string(),
            3,
            price_to_join,
            deposit,
            scenario.ctx(),
        );

        return_shared(game_session_list);
    };

    // USER joins
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    // USER2 joins
    scenario.next_tx(USER2);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let deposit: Coin<SUI> = mint_for_testing(price_to_join, scenario.ctx());
        join_session(&mut game_session, deposit, scenario.ctx());
        return_shared(game_session);
    };

    // Start game
    scenario.next_tx(ADMIN);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let cap = scenario.take_from_address<AdminCap>(ADMIN);
        let clock = sui::clock::create_for_testing(scenario.ctx());
        start(&cap, &mut game_session, some(1), &clock);

        scenario.return_to_sender(cap);
        destroy_for_testing(clock);
        return_shared(game_session);
    };

    // ADMIN votes
    scenario.next_tx(ADMIN);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        vote(&mut game_session, 1, scenario.ctx());
        return_shared(game_session);
    };

    // USER votes
    scenario.next_tx(USER);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        vote(&mut game_session, 1, scenario.ctx());
        return_shared(game_session);
    };

    // USER2 votes wrongly
    scenario.next_tx(USER2);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        vote(&mut game_session, 2, scenario.ctx());
        return_shared(game_session);
    };

    // End game
    scenario.next_tx(ADMIN);
    {
        let mut game_session = scenario.take_shared<GameSession>();
        let cap = scenario.take_from_address<AdminCap>(ADMIN);
        let mut clock = sui::clock::create_for_testing(scenario.ctx());
        clock.set_for_testing(GAME_DURATION + 1);
        end(&cap, &mut game_session, &clock, scenario.ctx());

        scenario.return_to_sender(cap);
        destroy_for_testing(clock);
        return_shared(game_session);
    };

    scenario.next_tx(ADMIN);
    {
        let percentages = PERC_2;
        let game_total_sui = price_to_join * 3;
        let treasury_cut = (game_total_sui * TREASURY_BPS) / BPS_DENOM;
        let game_sui_minus_treasury = game_total_sui - treasury_cut;

        let admin_coin_ids = ids_for_address<Coin<SUI>>(ADMIN);
        assert!(admin_coin_ids.length() == 2); // 2 coins: 1 for deposit, 1 for treasury cut

        let treasury_coin = scenario.take_from_address_by_id<Coin<SUI>>(ADMIN, admin_coin_ids[0]);
        assert!(treasury_coin.value() == treasury_cut);

        let admin_coin = scenario.take_from_address_by_id<Coin<SUI>>(ADMIN, admin_coin_ids[1]);
        assert!(admin_coin.value() == (game_sui_minus_treasury * percentages[0]) / 100);

        return_to_address(ADMIN, treasury_coin);
        return_to_address(ADMIN, admin_coin);

        let user_coin = scenario.take_from_address<Coin<SUI>>(USER);
        assert!(user_coin.value() == (game_sui_minus_treasury * percentages[1]) / 100);
        return_to_address(USER, user_coin);

        let user2_coin_ids = ids_for_address<Coin<SUI>>(USER2);
        assert!(user2_coin_ids.length() == 0); // No coins because user2 voted wrongly

        let game_session = scenario.take_shared<GameSession>();
        assert!(game_session.ended == true);
        assert!(game_session.correct_voters.length() == 2);
        assert!(game_session.voted_agent.size() == 3);
        assert!(game_session.prize_pool.value() == 0);
        return_shared(game_session);
    };

    scenario.end();
}
