import type { PropsWithChildren } from "react";

import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export const ShellLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="app-shell-grid bg-slate-100">
      <Navbar />
      <main className="app-shell-content mx-auto flex w-full max-w-6xl flex-col gap-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

