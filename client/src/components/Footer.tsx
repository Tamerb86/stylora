import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm">
              © {currentYear} Nexify CRM Systems AS. Alle rettigheter reservert.
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">
              Personvern
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Vilkår
            </a>
            <a href="/contact" className="hover:text-white transition-colors">
              Kontakt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
