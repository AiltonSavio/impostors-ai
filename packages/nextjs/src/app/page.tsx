/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PixelFrame from "@/components/PixelFrame";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatSui, toSui } from "@/lib/utils";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { Transaction } from "@mysten/sui/transactions";
import { CheckCircle, XCircle } from "lucide-react";
import { GameSession } from "./sessions/[sessionId]/page";
import { motion } from "framer-motion";

export default function Home() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const gameSessionListId = process.env.NEXT_PUBLIC_GAME_SESSION_LIST_ID!;
  const pkgId = process.env.NEXT_PUBLIC_PKG_ID!;
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK!;

  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [priceToJoin, setPriceToJoin] = useState(1); // in SUI
  const [maxPlayers, setMaxPlayers] = useState(2);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data,
    isLoading: isLoadingSessionList,
    refetch,
  } = useSuiClientQuery("getObject", {
    id: gameSessionListId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (data?.data) {
      const content = data.data.content;
      const gameSessionIds = (content as any)?.fields?.game_session_ids;
      if (gameSessionIds) {
        setSessionIds(gameSessionIds);

        const sessionPromises = gameSessionIds.map((sessionId: string) =>
          client.getObject({
            id: sessionId,
            options: {
              showContent: true,
              showOwner: true,
            },
          })
        );
        Promise.all(sessionPromises)
          .then((sessionData) => {
            const sessionDetails = sessionData.map((session) => {
              const content = session.data?.content;

              return {
                id: content.fields?.id?.id,
                name: content?.fields?.name,
                maxPlayers: content?.fields?.max_players,
                priceToJoin: content?.fields?.price_to_join,
                players: content?.fields?.players,
                started: content?.fields?.started,
                ended: content?.fields?.ended,
              };
            });
            setSessions(sessionDetails);
          })
          .catch((error) => {
            console.error("Error fetching session details:", error);
          });
      }
    }
  }, [data, client]);

  const handleCreateSession = async () => {
    if (!account || !sessionName || !priceToJoin || !maxPlayers) return;

    if (!account) {
      toast.error("Connect wallet first");
      return;
    }
    if (priceToJoin < 1) {
      toast.error("Price must be >= 1 SUI", {
        icon: <XCircle className="h-5 w-5" />,
      });
      return;
    }

    const coinBalance = await client.getBalance({ owner: account.address });

    if (Number(coinBalance.totalBalance) < toSui(priceToJoin)) {
      toast.error("Not Enough SUI", {
        icon: <XCircle className="h-5 w-5" />,
      });
      return;
    }

    setIsLoading(true);

    try {
      const tx = new Transaction();
      // Split gas for deposit
      const [deposit] = tx.splitCoins(tx.gas, [toSui(priceToJoin)]);
      tx.moveCall({
        package: pkgId,
        module: "game_session",
        function: "create",
        arguments: [
          tx.object(gameSessionListId),
          tx.pure.string(sessionName),
          tx.pure.u8(maxPlayers),
          tx.pure.u64(toSui(priceToJoin)),
          deposit,
        ],
      });
      signAndExecuteTransaction(
        { transaction: tx, chain: `sui:${network}` },
        {
          onSuccess: () => {
            toast.success("Session created!", {
              icon: <CheckCircle className="h-5 w-5" />,
            });
            setCreateModalOpen(false);
            setSessionName("");
            setPriceToJoin(1);
            setMaxPlayers(2);
            refetch();
          },
          onError: (e) =>
            toast.error("Failed to create session", { description: e.message }),
        }
      );
    } catch (e: any) {
      toast.error("Failed to create session", { description: e.message });
    }
    setIsLoading(false);
  };

  const handleJoinSession = async (session: GameSession) => {
    if (!account) {
      toast.error("Connect wallet first");
      return;
    }
    if (session.players.includes(account.address)) {
      toast.error("You already joined this session", {
        icon: <XCircle className="h-5 w-5" />,
      });
      return;
    }
    const coinBalance = await client.getBalance({ owner: account.address });
    if (Number(coinBalance.totalBalance) < toSui(priceToJoin)) {
      toast.error("Not Enough SUI", {
        icon: <XCircle className="h-5 w-5" />,
      });
      return;
    }
    setIsLoading(true);
    try {
      const tx = new Transaction();
      const [deposit] = tx.splitCoins(tx.gas, [session.priceToJoin]);
      tx.moveCall({
        package: pkgId,
        module: "game_session",
        function: "join_session",
        arguments: [tx.object(session.id), deposit],
      });
      signAndExecuteTransaction(
        { transaction: tx, chain: `sui:${network}` },
        {
          onSuccess: () => {
            toast.success("Joined game session!", {
              icon: <CheckCircle className="h-5 w-5" />,
            });
          },
          onError: (e) =>
            toast.error("Failed to join session", { description: e.message }),
        }
      );
    } catch (e: any) {
      console.error("Error joining session:", e);

      toast.error("Failed to join session", { description: e.message });
    }
    setIsLoading(false);
  };

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
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

  return (
    <div>
      <div className="flex flex-col items-center justify-center pt-20 pb-32 px-4">
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-12">
          {/* Create New Game Card */}
          <PixelFrame
            width="w-[320px] sm:w-[444px]"
            height="h-[272px] sm:h-[377px]"
          >
            <h2 className="text-5xl uppercase text-center font-bold mb-8 text-[#ccb16f]">
              Create New Game
            </h2>
            <button
              className="pixel-button bg-accent w-full"
              onClick={() => setCreateModalOpen(true)}
            >
              Create Session
            </button>
          </PixelFrame>

          {/* Display all available sessions */}
          {sessionIds.length === 0 && !isLoadingSessionList && (
            <PixelFrame
              width="w-[320px] sm:w-[444px]"
              height="h-[272px] sm:h-[377px]"
            >
              <h2 className="text-xl font-bold mb-4 text-center text-[#ccb16f]">
                No Sessions Found
              </h2>
              <p className="text-center">Create the first game session!</p>
            </PixelFrame>
          )}
          {(isLoadingSessionList || isLoading) && (
            <PixelFrame
              width="w-[320px] sm:w-[444px]"
              height="h-[272px] sm:h-[377px] flex items-center justify-center"
            >
              <Spinner size="lg" />
            </PixelFrame>
          )}
          {sessions.map((session) => (
            <PixelFrame
              key={session.id}
              width="w-[320px] sm:w-[444px]"
              height="h-[272px] sm:h-[377px]"
            >
              <h2 className="text-3xl font-bold mb-2 text-[#ccb16f]">
                {session.name}
              </h2>
              <p className="mb-2">
                Players: {session.players.length}/{session.maxPlayers}
              </p>
              <p className="mb-2">
                Price: {formatSui(session.priceToJoin)} SUI
              </p>
              <div className="flex flex-col items-center space-y-3">
                <button
                  className={`pixel-button bg-primary text-black ${
                    session.started ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={() => handleJoinSession(session)}
                  disabled={session.started}
                >
                  ▶ Join
                </button>
                {/* You can add link to session details if desired */}
                <Link href={`/sessions/${session.id}`}>
                  <button className="pixel-button bg-primary text-black">
                    🎭 Enter
                  </button>
                </Link>
              </div>
            </PixelFrame>
          ))}
        </div>
      </div>

      {/* Modal for creating session */}
      {createModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-70 transition-opacity"
            onClick={() => setCreateModalOpen(false)}
          />

          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            ref={modalRef}
            className="bg-[#0f1a24] pixel-frame max-w-lg w-full p-6 text-[#eae2d1] z-10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">
              Create New Game
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-left font-medium mb-1">
                  Session Name
                </label>
                <Input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="bg-[#0a1219] border-[#373b3e] w-full focus:ring-[#373b3e]"
                  placeholder="Enter session name"
                />
              </div>
              <div>
                <label className="block text-left font-medium mb-1">
                  Price to Join (in SUI, 1 SUI minimum)
                </label>
                <Input
                  type="number"
                  value={priceToJoin}
                  onChange={(e) => setPriceToJoin(Number(e.target.value))}
                  className="bg-[#0a1219] border-[#373b3e] w-full focus:ring-[#373b3e]"
                  placeholder="e.g. 10"
                  min={1}
                  step={0.01}
                />
              </div>
              <div>
                <label className="block text-left font-medium mb-1">
                  Max Players (2-5)
                </label>
                <Input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="bg-[#0a1219] border-[#373b3e] w-full focus:ring-[#373b3e]"
                  min={2}
                  max={5}
                />
              </div>
              <div className="flex space-x-4 items-center mt-2">
                <button
                  className="pixel-button bg-accent w-full"
                  onClick={handleCreateSession}
                >
                  ▶ Create
                </button>
                <button
                  className="pixel-button bg-error w-full"
                  onClick={() => setCreateModalOpen(false)}
                >
                  ✖ Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
