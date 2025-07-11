"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import useConversationSocket from "~~/hooks/useConversationSocket";

interface Agent {
  key: string;
  emoji: string;
  name: string;
}

const agents: Agent[] = [
  { key: "General", emoji: "🗡️", name: "The General" },
  { key: "Diplomat", emoji: "🤝", name: "The Diplomat" },
  { key: "Treasurer", emoji: "💰", name: "The Treasurer" },
  { key: "Spymaster", emoji: "🕵️", name: "The Spymaster" },
  { key: "Blacksmith", emoji: "🔨", name: "The Blacksmith" },
  { key: "Mage", emoji: "🔮", name: "The Mage" },
  { key: "Healer", emoji: "🩺", name: "The Healer" },
  { key: "Strategist", emoji: "📜", name: "The Strategist" },
  { key: "Tactician", emoji: "🗺️", name: "The Tactician" },
  { key: "Architect", emoji: "🏰", name: "The Architect" },
];

export default function SessionPage({ params }: { params: { sessionId: string } }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins in seconds

  function formatTimeLeft(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setSelectedAgent(null);
      }
    }

    if (selectedAgent) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedAgent]);

  const {
    data: latestSessionData,
    refetch: refetchLatestSession,
    isLoading: isLoadingLatestSession,
  } = useScaffoldReadContract({
    contractName: "GameSession",
    functionName: "getGameSession",
    args: [BigInt(params.sessionId)],
    watch: true,
  });

  const { writeContractAsync: writeGameSessionAsync } = useScaffoldWriteContract({
    contractName: "GameSession",
  });

  const handleJoinSession = async (price: bigint) => {
    try {
      await writeGameSessionAsync({
        functionName: "joinGameSession",
        args: [BigInt(params.sessionId)],
        value: price,
      });
      refetchLatestSession();
    } catch (e) {
      console.error("Error joining session:", e);
    }
  };

  const handleVote = async () => {
    if (!selectedAgent) return;
    // Determine the index of the selected agent in the agents array.
    const agentIndex = agents.findIndex(agent => agent.key === selectedAgent.key);
    if (agentIndex < 0) {
      console.error("Selected agent not found in agents list.");
      return;
    }
    try {
      await writeGameSessionAsync({
        functionName: "vote",
        args: [BigInt(params.sessionId), BigInt(agentIndex)],
      });
      console.log("Vote cast successfully");
    } catch (e) {
      console.error("Error casting vote:", e);
    }
  };

  const { messages, eliminatedAgents } = useConversationSocket();

  const sessionName = latestSessionData?.[0] ?? "";
  const maxPlayers = Number(latestSessionData?.[1] ?? 0);
  const priceToJoin = latestSessionData?.[2] ? Number(formatEther(latestSessionData[2])) : 0;
  const sessionStarted = latestSessionData?.[3] ?? false;
  const sessionEnded = latestSessionData?.[4] ?? false;
  const players: readonly string[] = latestSessionData?.[5] ?? [];
  const prizePool = latestSessionData?.[7] ? formatEther(latestSessionData[7]) : "0";
  const startTimestamp = latestSessionData?.[8] ? Number(latestSessionData[8]) * 1000 : null;

  useEffect(() => {
    const startTime = startTimestamp ? new Date(startTimestamp) : null;

    if (!sessionStarted || !startTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime.getTime()) / 1000);
      const remaining = Math.max(0, 600 - elapsed);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStarted, startTimestamp]);

  if (!latestSessionData || !latestSessionData[0] || isLoadingLatestSession) {
    return (
      <>
        {isLoadingLatestSession ? (
          <div className="flex items-center justify-center h-[86.7vh]">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[86.7vh]">
            <h1 className="text-2xl font-bold px-4 sm:px-0 text-center text-primary-content">
              This session hasn’t been created yet.
            </h1>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-base-200 dark:text-white p-4 min-h-0 overflow-y-auto">
        <div className="space-y-4 mt-2">
          {agents.map(agent => {
            const isEliminated = eliminatedAgents.includes(agent.key);
            return (
              <div
                key={agent.key}
                className={`flex items-center space-x-4 ${isEliminated ? "" : "cursor-pointer"}`}
                onClick={() => {
                  if (!isEliminated) {
                    setSelectedAgent(agent);
                  }
                }}
              >
                <div className="relative">
                  <Image
                    className="rounded-full bg-white w-[60px] h-[60px]"
                    width={60}
                    height={60}
                    src={`/agents/${agent.key}.webp`}
                    alt={agent.name}
                  />
                  {isEliminated && (
                    <div className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">X</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{agent.emoji}</span>
                  <span className="text-lg">{agent.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="bg-base-200 rounded-lg p-6 m-4 min-w-full min-h-full max-h-full">
          <h1 className="dark:text-white text-2xl font-bold">{sessionName} Chat</h1>
          {sessionStarted && (
            <div className="my-2 text-lg font-bold text-primary">
              Time left: <span className="font-numbers">{formatTimeLeft(timeLeft)}</span>
            </div>
          )}
          {!sessionStarted ? (
            <>
              <p className="text-lg font-semibold text-yellow-500">This session was created but was not started yet.</p>
              <p>
                Players ({players.length}/{maxPlayers}):
              </p>
              <ul className="list-disc pl-5">
                {players.map((player, index) => (
                  <li key={index}>{player}</li>
                ))}
              </ul>
              <p className="mt-4">Price to Join: {priceToJoin} ETH</p>
              <p className="-mt-2">Total Prize Pool: {prizePool} ETH</p>
              <button
                className="btn btn-primary rounded-xl px-8"
                onClick={() => handleJoinSession(latestSessionData[2])}
              >
                Join Session
              </button>
            </>
          ) : sessionEnded ? (
            <>
              <p className="text-lg font-semibold text-red-500">This session has ended.</p>
              <p>
                The impostor was: <span className="font-bold">{agents[Number(latestSessionData[9])].name}</span>
              </p>
              <p className="mt-2">Winners:</p>
              <ul className="list-disc pl-5 text-green-500">
                {latestSessionData[6].map((winner: string, index: number) => (
                  <li key={index}>{winner}</li>
                ))}
              </ul>
              <p className="mt-2">Losers:</p>
              <ul className="list-disc pl-5 text-red-500">
                {players
                  .filter(p => !latestSessionData[6].includes(p))
                  .map((loser, index) => (
                    <li key={index}>{loser}</li>
                  ))}
              </ul>
            </>
          ) : (
            <div ref={chatBoxRef} className="overflow-y-auto overflow-x-hidden max-h-[60vh] space-y-6 p-5">
              {messages.map((msg, i) => (
                <div key={i} className="relative flex justify-end">
                  <div className="bg-base-100 dark:text-white rounded-xl px-4 py-2 max-w-lg relative">
                    <p>{msg.content}</p>
                    <div
                      className={`${msg.name === "Narrator" ? "" : "cursor-pointer"} absolute -top-3 -right-3 rounded-full border border-primary bg-white`}
                      style={{ width: "42px", height: "42px" }}
                      onClick={() => setSelectedAgent(agents.find(a => a.key === msg.name) || null)}
                    >
                      <Image
                        className="rounded-full w-full h-full"
                        width={42}
                        height={42}
                        src={`/agents/${msg.name}.webp`}
                        alt={msg.name}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Modal for Selected Agent */}
      {selectedAgent && (
        <div className="modal modal-open fixed inset-0 z-50 flex items-center justify-center">
          <div ref={modalRef} className="modal-box relative max-w-5xl p-0">
            <button onClick={() => setSelectedAgent(null)} className="btn btn-sm btn-circle absolute right-2 top-2">
              ✕
            </button>
            <div className="flex">
              <div className="bg-gray-200 rounded-l-lg" style={{ width: "430px", height: "430px" }}>
                <Image
                  src={`/agents/${selectedAgent.key}.webp`}
                  alt={selectedAgent.name}
                  className="w-full h-full object-cover rounded-l-lg"
                  width={430}
                  height={430}
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white font-bold px-2 py-1 rounded">
                  {selectedAgent.name}
                </div>
              </div>
              <div
                className="p-4 flex flex-col justify-between bg-base-100"
                style={{ width: "592px", height: "430px" }}
              >
                <div className="overflow-auto pr-4">
                  {messages
                    .filter(msg => msg.name === selectedAgent.key)
                    .map((msg, i) => (
                      <p key={i} className="dark:text-white mb-2">
                        {msg.content}
                      </p>
                    ))}
                </div>
                <div className="flex justify-end">
                  <button onClick={handleVote} className="pixel-button bg-primary text-black">
                    Vote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
