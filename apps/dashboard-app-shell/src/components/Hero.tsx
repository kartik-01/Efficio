import { ArrowRight } from "lucide-react";

import { Button } from "@efficio/ui";

type HeroProps = { onGetStarted?: () => void };

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100">
      <div className="max-w-[1280px] mx-auto px-8 py-40">
        <div className="max-w-[584px]">
          <h1 className="text-6xl font-bold leading-[60px] mb-8">
            <span className="text-gray-900">Organize Your</span>{" "}
            <span className="text-indigo-500">Productivity</span>{" "}
            <span className="text-gray-900">Like Never Before</span>
          </h1>

          <p className="text-lg text-gray-600 leading-7 mb-10">
            Efficio combines task management, time tracking, and analytics in
            one powerful platform. Stay focused, track progress, and achieve your
            goals with our micro-frontend architecture.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 text-white h-[58px] px-8 rounded-lg text-base font-semibold flex items-center gap-2"
              onClick={onGetStarted}
            >
              Get Started Free
              <ArrowRight className="w-3.5 h-4" />
            </Button>
            <Button variant="outline" className="h-[58px] px-6 rounded-lg text-base font-semibold text-gray-700 border-gray-300 hover:bg-gray-50">
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

