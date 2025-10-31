import React from "react";

import { useAuth0 } from "@auth0/auth0-react";

import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { CTASection } from "../components/CTASection";
import { Footer } from "../components/Footer";

export default function HomePage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero onGetStarted={loginWithRedirect} />
      <Features />
      <CTASection onGetStarted={loginWithRedirect} />
      <Footer />
    </div>
  );
}

