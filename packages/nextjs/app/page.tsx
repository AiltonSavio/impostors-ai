"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import PixelFrame from "~~/components/PixelFrame";
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
    <main>
      <div className="flex flex-col items-center justify-center pt-20 pb-32 px-4">
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-12">
          {/* Create New Game Card */}
          <PixelFrame width="w-[320px] sm:w-[444px]" height="h-[272px] sm:h-[377px]">
            <h2 className="text-5xl uppercase text-center font-bold mb-8 text-[#ccb16f]">Create New Game</h2>
            <button className="pixel-button bg-accent w-full" onClick={() => setCreateModalOpen(true)}>
              Create Session
            </button>
          </PixelFrame>

          {/* Latest Session Display */}
          {latestSessionData && latestSessionData[0] && (
            <PixelFrame width="w-[320px] sm:w-[444px]" height="h-[272px] sm:h-[377px]">
              <h2 className="text-5xl font-bold mb-2 text-[#ccb16f]">{latestSessionData[0]}</h2>
              <p className="my-2">
                Players: {latestSessionData[5].length}/{Number(latestSessionData[1])}
              </p>
              <p className="mb-4">Price: {Number(formatEther(latestSessionData[2]))} ETH</p>
              <div className="flex flex-col items-center space-y-3">
                <button
                  className={`pixel-button bg-primary text-black ${latestSessionData[3] ? "opacity-30" : ""}`}
                  onClick={() => handleJoinSession(latestSessionData[2])}
                  disabled={latestSessionData[3]}
                >
                  ▶ Join
                </button>
                <Link href={`/sessions/${latestSessionId}`}>
                  <button className="pixel-button bg-primary text-black">🎭 Enter</button>
                </Link>
              </div>
            </PixelFrame>
          )}
        </div>
      </div>

      {/* Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div ref={modalRef} className="bg-[#0f1a24] pixel-frame max-w-lg w-full p-6 text-[#eae2d1]">
            <h2 className="text-2xl font-bold mb-4 text-center">Create New Game</h2>
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
                  placeholder="e.g. 0.1"
                  min={0.005}
                />
              </div>
              <div>
                <label className="block text-left font-medium">Max Players (2-5)</label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={e => setMaxPlayers(Number(e.target.value))}
                  className="input input-bordered w-full"
                  min={2}
                  max={5}
                />
              </div>
              <div className="flex space-x-4 items-center mt-2">
                <button className="pixel-button bg-accent w-full" onClick={handleCreateSession}>
                  ▶ Create
                </button>
                <button className="pixel-button bg-error w-full" onClick={() => setCreateModalOpen(false)}>
                  ✖ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
