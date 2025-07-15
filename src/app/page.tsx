import LandingInput from "@/components/landing-input";
import Link from "next/link";
import Logo from "@/components/logo";

export default function WelcomePage() {
  return (
    <div className="min-h-screen w-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-row w-full items-baseline justify-between mb-4 sm:mb-2 gap-4 sm:gap-2 p-1">
          <h1 className="text-3xl text-foreground sm:text-4xl lg:text-5xl font-bold text-center sm:text-left">
            MirrorStone
          </h1>
          <Link
            href="https://ldwid.com"
            className="font-semibold h-3 sm:h-4 flex-shrink-0"
          >
            <Logo className="h-full text-[#0066FF]" />
          </Link>
        </div>
        <LandingInput />
      </div>
    </div>
  );
}
