/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import useConversationSocket from "@/hooks/useConversationSocket";
import { formatSui } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export type GameSession = {
  id: string;
  name: string;
  maxPlayers: number;
  priceToJoin: string;
  players: string[];
  started: boolean;
  ended: boolean;
  prizePool?: number;
  votedAgent?: string[];
  correctVoters?: string[];
  impostorAgent?: number;
};

interface Agent {
  key: string;
  emoji: string;
  name: string;
}

const AGENTS: Agent[] = [
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
  { key: 'Unknown', emoji: '❓', name: 'Unknown' },
];

export default function SessionPage() {
  const params = useParams() as { sessionId: string };
  const account = useCurrentAccount();
  const pkgId = process.env.NEXT_PUBLIC_PKG_ID!;
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK!;

  const [sessionInfo, setSessionInfo] = useState<GameSession | null>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [userInSession, setUserInSession] = useState(false);
  const {
    data: sessionObj,
    isLoading,
    refetch,
  } = useSuiClientQuery("getObject", {
    id: params.sessionId,
    options: { showContent: true, showOwner: true },
  });

  useEffect(() => {
    if (sessionObj?.data) {
      const content = sessionObj.data.content;
      const fields = (content as any)?.fields;

      setSessionInfo({
        id: fields.id.id,
        name: fields.name,
        maxPlayers: fields.max_players,
        priceToJoin: fields.price_to_join,
        players: fields.players,
        started: fields.started,
        ended: fields.ended,
        prizePool: fields.prize_pool,
        votedAgent: fields.voted_agent?.fields?.contents,
        correctVoters: fields.correct_voters,
        impostorAgent: fields.impostor_agent,
      });

      setUserInSession(fields?.players.includes(account?.address || ""));
      setUserHasVoted(
        fields.voted_agent?.fields?.contents?.some(
          (entry: any) => entry.fields?.key === account?.address
        ) || false
      );
    }
  }, [account?.address, sessionObj]);

  console.log("Session Info:", sessionInfo);

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const { messages, eliminatedAgents } = useConversationSocket();

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  if (!sessionInfo || sessionInfo === null)
    return (
      <div className="flex justify-center items-center h-96">
        Session not found.
      </div>
    );

  // JOIN
  const handleJoinSession = async () => {
    if (!account) return toast.error("Connect your wallet to join.");
    if (userInSession) {
      return toast.error("You already joined this session.", {
        icon: <XCircle className="h-5 w-5" />,
      });
    }
    setIsLoadingJoin(true);
    try {
      const tx = new Transaction();
      const [deposit] = tx.splitCoins(tx.gas, [sessionInfo.priceToJoin]);
      tx.moveCall({
        package: pkgId,
        module: "game_session",
        function: "join_session",
        arguments: [tx.object(params.sessionId), deposit],
      });
      signAndExecuteTransaction(
        { transaction: tx, chain: `sui:${network}` },
        {
          onSuccess: () => {
            toast.success("Joined session!", { icon: <CheckCircle /> });
            refetch();
          },
          onError: (e) =>
            toast.error("Failed to join session", { description: e.message }),
        }
      );
    } finally {
      setIsLoadingJoin(false);
    }
  };

  // VOTE
  const handleVote = async () => {
    if (!account) return toast.error("Connect your wallet to vote.");
    if (!selectedAgent) return toast.error("Select an agent to vote for.");
    if (!userInSession) {
      return toast.error("You are not in this session.", {
        icon: <XCircle className="h-5 w-5" />,
      });
    }
    if (!sessionInfo.started || sessionInfo.ended) {
      return toast.error("Voting not allowed right now.", {
        icon: <XCircle className="h-5 w-5" />,
      });
    }
    if (userHasVoted) {
      return toast.error("You already voted.", {
        icon: <XCircle className="h-5 w-5" />,
      });
    }
    setIsVoting(true);
    const agentIndex = AGENTS.findIndex(
      (agent) => agent.key === selectedAgent.key
    );
    try {
      const tx = new Transaction();
      tx.moveCall({
        package: pkgId,
        module: "game_session",
        function: "vote",
        arguments: [tx.object(params.sessionId), tx.pure.u8(agentIndex!)],
      });
      signAndExecuteTransaction(
        { transaction: tx, chain: `sui:${network}` },
        {
          onSuccess: () => {
            toast.success("Voted!", { icon: <CheckCircle /> });
            refetch();
          },
          onError: (e) =>
            toast.error("Failed to vote", { description: e.message }),
        }
      );
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-base-200 dark:text-white p-4 min-h-0 overflow-y-auto">
        <div className="space-y-4 mt-2">
          {AGENTS.slice(0, 10).map((agent) => {
            const isEliminated = eliminatedAgents.includes(agent.key);
            return (
              <div
                key={agent.key}
                className={`flex items-center space-x-4 ${
                  isEliminated ? "" : "cursor-pointer"
                }`}
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
          <h1 className="dark:text-white text-2xl font-bold mb-4">
            {sessionInfo.name} Chat
          </h1>
          {!sessionInfo.started ? (
            <>
              <p className="text-lg font-semibold text-yellow-500">
                This session was created but was not started yet.
              </p>
              <p>
                Players ({sessionInfo.players.length}/{sessionInfo.maxPlayers}):
              </p>
              <ul className="list-disc pl-5">
                {sessionInfo.players.map((player, index) => (
                  <li key={index}>{player}</li>
                ))}
              </ul>
              <p className="mt-4">
                Price to Join: {formatSui(sessionInfo.priceToJoin)} SUI
              </p>
              <p>
                Total Prize Pool: {formatSui(sessionInfo?.prizePool || 0)} SUI
              </p>
              {sessionInfo.players.length < sessionInfo.maxPlayers && (
                <Button className="mt-8" onClick={() => handleJoinSession()}>
                  {isLoadingJoin ? <Spinner size="sm" /> : "Join Session"}
                </Button>
              )}
            </>
          ) : sessionInfo.ended ? (
            <>
              <p className="text-lg font-semibold text-red-500">
                This session has ended.
              </p>
              <p>
                The impostor was:{" "}
                <span className="font-bold">
                  {AGENTS[sessionInfo?.impostorAgent as number].name}
                </span>
              </p>
              <p className="mt-2">Winners:</p>
              <ul className="list-disc pl-5 text-green-500">
                {sessionInfo?.correctVoters?.map(
                  (winner: string, index: number) => (
                    <li key={index}>{winner}</li>
                  )
                )}
              </ul>
              <p className="mt-2">Losers:</p>
              <ul className="list-disc pl-5 text-red-500">
                {sessionInfo.players
                  .filter((p) => !sessionInfo?.correctVoters?.includes(p))
                  .map((loser, index) => (
                    <li key={index}>{loser}</li>
                  ))}
              </ul>
            </>
          ) : (
            <div
              ref={chatBoxRef}
              className="overflow-y-auto overflow-x-hidden max-h-[60vh] space-y-6 p-5"
            >
              {messages.map((msg, i) => (
                <div key={i} className="relative flex justify-end">
                  <div className="bg-base-100 dark:text-white rounded-xl px-4 py-2 max-w-lg relative">
                    <p>{msg.content}</p>
                    <div
                      className={`${
                        msg.name === "Narrator" ? "" : "cursor-pointer"
                      } absolute -top-3 -right-3 rounded-full border border-primary bg-white`}
                      style={{ width: "42px", height: "42px" }}
                      onClick={() =>
                        setSelectedAgent(
                          AGENTS.find((a) => a.key === msg.name) || null
                        )
                      }
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-70 transition-opacity"
            onClick={() => setSelectedAgent(null)}
          />

          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "tween", stiffness: 200, damping: 20 }}
            className="relative max-w-5xl p-0 z-10"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()} // prevent backdrop click
          >
            <button
              onClick={() => setSelectedAgent(null)}
              className="btn btn-sm btn-circle absolute right-2 top-2 z-20"
            >
              ✕
            </button>
            <div className="flex">
              <div
                className="bg-gray-200 rounded-l-lg relative"
                style={{ width: "430px", height: "430px" }}
              >
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
                    .filter((msg) => msg.name === selectedAgent.key)
                    .map((msg, i) => (
                      <p key={i} className="dark:text-white mb-2">
                        {msg.content}
                      </p>
                    ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleVote}
                    className="pixel-button bg-primary text-black"
                  >
                    {!sessionInfo.started ? (
                      "Voting not started"
                    ) : isVoting ? (
                      <Spinner size="sm" />
                    ) : userHasVoted ? (
                      "Already Voted"
                    ) : (
                      "Vote"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
