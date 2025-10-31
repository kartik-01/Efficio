export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
      <div className="app-shell-content flex flex-col gap-3 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} Efficio. Crafted for modular productivity.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-brand-primary">
            Privacy
          </a>
          <a href="#" className="hover:text-brand-primary">
            Terms
          </a>
          <a href="#" className="hover:text-brand-primary">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

