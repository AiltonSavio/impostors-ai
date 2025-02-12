"use client";

import React from "react";
import Link from "next/link";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

/**
 * Site header
 */
export const Header = () => {
  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="w-auto lg:w-1/2">
        <Link href="/" passHref className="items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex font-bold leading-tight">
            <span className="hidden lg:flex">🎭 Impostors.AI</span>
            <span className="flex lg:hidden">🎭</span>
          </div>
        </Link>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
