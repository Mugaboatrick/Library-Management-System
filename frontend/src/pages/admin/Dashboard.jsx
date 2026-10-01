import { Link } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';

const Icon = ({ name, className = 'h-5 w-5' }) => {
  const paths = {
    books: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
    members: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 11a3 3 0 1 0 0-6M17 15a5 5 0 0 1 3.5 5" /></>
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

const AdminDashboard = () => {
  return (
    <AdminLayout>
      {/* Full-bleed: these negative margins cancel AdminLayout's `main` padding
          (`p-2 sm:p-3 lg:p-4`) so the photo runs edge to edge beside the sidebar
          and to the bottom of the page. The rounded corners and the wrapper's
          bottom padding are gone so nothing frames the image. */}
      <div className="-m-2 sm:-m-3 lg:-m-4">
        <section className="relative isolate flex min-h-[calc(100dvh-6rem)] w-full overflow-hidden bg-[#e8f4e7]">
          <img
            src="/library-bg.jpg"
            alt="Bookshelves in the Hope Haven library"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          {/* The heading is now wide enough to reach past the old 560px column,
              so the readability scrim has to extend with it. A soft blur at the
              right edge keeps the photo visible without letting the photo run
              under the words. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#edf7e9]/95 via-[#edf7e9]/88 to-[#edf7e9]/45 sm:via-[#edf7e9]/80 sm:to-transparent" />
          <div className="flex w-full max-w-3xl flex-col items-start justify-center px-6 py-8 sm:px-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#d9f0dd] px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-[#158044] sm:text-base">
              <Icon name="books" className="h-4 w-4 sm:h-5 sm:w-5" /> Hope Haven School Library
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#075f31] sm:text-5xl lg:text-6xl">
              Welcome to<br />Hope Haven Library
            </h1>
            <p className="mt-4 text-lg font-semibold text-[#286741] sm:text-xl lg:text-2xl">
              Learn. Read. Grow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/admin/books" className="inline-flex items-center gap-2.5 rounded-full bg-[#138344] px-6 py-3 text-base font-bold text-white transition hover:bg-[#096d36]">
                <Icon name="books" className="h-5 w-5" /> Explore Books
              </Link>
              <Link to="/admin/borrow" className="inline-flex items-center gap-2.5 rounded-full border border-[#178646] bg-white/80 px-6 py-3 text-base font-bold text-[#167640] transition hover:bg-white">
                <Icon name="members" className="h-5 w-5" /> Get Started
              </Link>
            </div>
          </div>
        </section>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;