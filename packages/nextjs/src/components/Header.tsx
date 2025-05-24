"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";

/**
 * Site header
 */
export const Header = () => {
  return (
    <div className="sticky top-0 z-50 bg-[#0a1219] py-4 px-6 shadow-md flex justify-between items-center font-pixel">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/favicon.png" alt="Impostors AI" width={48} height={48} />
        <span className="text-xl text-[#EAE2D1] hidden sm:inline">
          Impostors AI
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <ConnectButton className="hover:cursor-pointer" />
        {/* <FaucetButton /> */}
      </div>
    </div>
  );
};
