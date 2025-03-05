"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [priceToJoin, setPriceToJoin] = useState(0.005);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setCreateModalOpen(false);
      }
    }

    if (createModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createModalOpen]);

  const { data: sessionCounterData, refetch: refetchSessionCounter } = useScaffoldReadContract({
    contractName: "GameSession",
    functionName: "sessionCounter",
    watch: true,
  });

  const sessionCounter = sessionCounterData ? BigInt(sessionCounterData) : 0n;
  const latestSessionId = sessionCounter > 0n ? sessionCounter : 0n;

  const { data: latestSessionData, refetch: refetchLatestSession } = useScaffoldReadContract({
    contractName: "GameSession",
    functionName: "getGameSession",
    args: [latestSessionId],
    watch: true,
  });

  const { writeContractAsync: writeGameSessionAsync } = useScaffoldWriteContract({
    contractName: "GameSession",
  });

  const handleCreateSession = async () => {
    if (!sessionName || !priceToJoin || !maxPlayers) return;
    try {
      const price = parseEther(priceToJoin.toString());
      const maxPlayersBigInt = BigInt(maxPlayers);
      await writeGameSessionAsync({
        functionName: "createGameSession",
        args: [sessionName, maxPlayersBigInt, price],
        value: price,
      });
      setCreateModalOpen(false);
      setSessionName("");
      setPriceToJoin(10);
      setMaxPlayers(2);
      refetchSessionCounter();
      refetchLatestSession();
    } catch (e) {
      console.error("Error creating session:", e);
    }
  };

  const handleJoinSession = async (price: bigint) => {
    if (!latestSessionId) return;
    try {
      await writeGameSessionAsync({
        functionName: "joinGameSession",
        args: [latestSessionId],
        value: price,
      });
      refetchLatestSession();
    } catch (e) {
      console.error("Error joining session:", e);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center pt-10 bg-base-300">
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Create New Game Card */}
          <div className="flex flex-col bg-base-100 text-center items-center justify-center rounded-xl w-[320px] h-[272px] sm:w-[444px] sm:h-[377px]">
            <span className="font-bold text-xl mb-3">Create New Game</span>
            <button className="btn btn-primary px-8 rounded-xl" onClick={() => setCreateModalOpen(true)}>
              Create Session
            </button>
          </div>
          {/* Display the latest session if available */}
          {latestSessionData && latestSessionData[0] && (
            <div className="flex items-center justify-center">
              <div className="flex flex-col bg-base-200 rounded-xl w-[320px] h-[272px] sm:w-[444px] sm:h-[377px] p-4">
                <span className="font-bold text-xl mb-1">{latestSessionData[0] /* Session name */}</span>
                <p className="-mb-2">
                  Players: {latestSessionData[5].length}/{Number(latestSessionData[1]) /* maxPlayers */}
                </p>
                <p className="mb-4">Price to Join: {Number(formatEther(latestSessionData[2]))} ETH</p>
                <button
                  className="btn btn-primary rounded-xl w-1/2 sm:w-2/6"
                  onClick={() => handleJoinSession(latestSessionData[2])}
                  disabled={latestSessionData[3]}
                >
                  Join Session
                </button>
                {/* Enter the session page "/sessions/[sessionId]" */}
                <Link href={`/sessions/${latestSessionId}`}>
                  <button className="btn btn-warning rounded-xl w-1/2 sm:w-2/6 mt-3">Enter Session</button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for creating a session */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div ref={modalRef} className="bg-base-100 rounded-lg p-6  w-[375px] sm:w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Create New Game</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-left font-medium">Session Name</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Enter session name"
                />
              </div>
              <div>
                <label className="block text-left font-medium">Price to Join (in ETH, 0.005 ETH minimum)</label>
                <input
                  type="number"
                  value={priceToJoin}
                  onChange={e => setPriceToJoin(Number(e.target.value))}
                  className="input input-bordered w-full"
                  placeholder="e.g. 0.1 ETH"
                  min={0.005}
                />
              </div>
              <div>
                <label className="block text-left font-medium">Max Players (2 to 5)</label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={e => setMaxPlayers(Number(e.target.value))}
                  className="input input-bordered w-full"
                  min={2}
                  max={5}
                />
              </div>
              <button className="btn btn-primary w-full mt-4" onClick={handleCreateSession}>
                Create Session
              </button>
              <button className="btn btn-secondary w-full mt-2" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
