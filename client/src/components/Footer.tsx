import { Link } from 'wouter';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <Link href="/">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
                Stylora
              </span>
            </Link>
            <p className="text-sm mt-2">
              © {currentYear} Nexify CRM Systems AS (Org.nr. 936 300 278)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Alle rettigheter reservert.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Personvernerklæring
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Vilkår for bruk
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              Om oss
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
