export const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Security"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers"],
    },
    {
      title: "Support",
      links: ["Help Center", "Contact", "Status"],
    },
  ];

  return (
    <footer className="w-full bg-gray-900 py-12">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.15901 1.0445C4.42971 1.28786 4.45159 1.70075 4.20823 1.97145L2.23948 4.15895C2.11917 4.29294 1.94963 4.37223 1.76917 4.37497C1.5887 4.3777 1.41643 4.30934 1.28791 4.18356L0.191431 3.08981C-0.0628662 2.83278 -0.0628662 2.41716 0.191431 2.16013C0.445728 1.90309 0.864087 1.90309 1.11838 2.16013L1.72268 2.76442L3.22932 1.09098C3.47268 0.820281 3.88557 0.798406 4.15627 1.04177L4.15901 1.0445ZM4.15901 5.4195C4.42971 5.66286 4.45159 6.07575 4.20823 6.34645L2.23948 8.53395C2.11917 8.66794 1.94963 8.74723 1.76917 8.74997C1.5887 8.7527 1.41643 8.68434 1.28791 8.55856L0.191431 7.46481C-0.0656006 7.20778 -0.0656006 6.79216 0.191431 6.53786C0.448462 6.28356 0.864087 6.28083 1.11838 6.53786L1.72268 7.14216L3.22932 5.46872C3.47268 5.19802 3.88557 5.17614 4.15627 5.4195H4.15901ZM6.12502 2.62497C6.12502 2.14098 6.51604 1.74997 7.00002 1.74997H13.125C13.609 1.74997 14 2.14098 14 2.62497C14 3.10895 13.609 3.49997 13.125 3.49997H7.00002C6.51604 3.49997 6.12502 3.10895 6.12502 2.62497ZM6.12502 6.99997C6.12502 6.51598 6.51604 6.12497 7.00002 6.12497H13.125C13.609 6.12497 14 6.51598 14 6.99997C14 7.48395 13.609 7.87497 13.125 7.87497H7.00002C6.51604 7.87497 6.12502 7.48395 6.12502 6.99997ZM4.37502 11.375C4.37502 10.891 4.76604 10.5 5.25002 10.5H13.125C13.609 10.5 14 10.891 14 11.375C14 11.859 13.609 12.25 13.125 12.25H5.25002C4.76604 12.25 4.37502 11.859 4.37502 11.375ZM1.31252 10.0625C1.66062 10.0625 1.99446 10.2007 2.2406 10.4469C2.48674 10.693 2.62502 11.0269 2.62502 11.375C2.62502 11.7231 2.48674 12.0569 2.2406 12.303C1.99446 12.5492 1.66062 12.6875 1.31252 12.6875C0.964428 12.6875 0.630588 12.5492 0.384447 12.303C0.138305 12.0569 0 11.7231 0 11.375C0 11.0269 0.138305 10.693 0.384447 10.4469C0.630588 10.2007 0.964428 10.0625 1.31252 10.0625Z"
                    fill="white"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Efficio</span>
            </div>
            <p className="text-sm text-gray-400 leading-5">
              The ultimate productivity platform for modern professionals.
            </p>
          </div>

          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-base font-semibold text-white mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-400 text-center">
            © 2025 Efficio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
