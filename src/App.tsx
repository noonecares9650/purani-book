import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase, type Book, type WishlistItem } from '@/lib/supabase';
import { getCurrentPosition, type Coords } from '@/lib/utils';
import SplashScreen from '@/components/SplashScreen';
import BottomNav, { type Tab } from '@/components/BottomNav';
import HomeView from '@/components/HomeView';
import WishlistView from '@/components/WishlistView';
import ProfileView from '@/components/ProfileView';
import AddBookForm from '@/components/AddBookForm';
import BookDetailModal from '@/components/BookDetailModal';
import AdminView from '@/components/AdminView';

function AppContent() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [browsingAsGuest, setBrowsingAsGuest] = useState(false);

  const fetchedOnce = useRef(false);

  // Fetch books
  const fetchBooks = useCallback(async () => {
    setBooksLoading(true);
    setBooksError(null);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    setBooksLoading(false);
    if (error) {
      setBooksError('Could not load books. Please check your connection.');
      return;
    }
    setBooks(data ?? []);
  }, []);

  // Fetch wishlist
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistIds(new Set());
      setWishlistItems([]);
      return;
    }
    const { data } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setWishlistItems(data);
      setWishlistIds(new Set(data.map((w) => w.book_id)));
    }
  }, [user]);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Try to get user location
  useEffect(() => {
    getCurrentPosition()
      .then(setUserCoords)
      .catch(() => {});
  }, []);

  // Wishlist toggle
  const handleWishlistToggle = useCallback(async (bookId: string) => {
    if (!user) {
      setActiveTab('home');
      return;
    }

    if (wishlistIds.has(bookId)) {
      setWishlistIds((prev) => { const n = new Set(prev); n.delete(bookId); return n; });
      await supabase.from('wishlists').delete().eq('book_id', bookId).eq('user_id', user.id);
      setWishlistItems((prev) => prev.filter((w) => w.book_id !== bookId));
    } else {
      setWishlistIds((prev) => new Set(prev).add(bookId));
      const { data } = await supabase
        .from('wishlists')
        .insert({ book_id: bookId, user_id: user.id })
        .select();
      if (data && data[0]) {
        setWishlistItems((prev) => [...prev, data[0]]);
      }
    }
  }, [user, wishlistIds]);

  // Delete book
  const handleDelete = useCallback(async (book: Book) => {
    if (!user || (!isAdmin && book.user_id !== user.id)) return;
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('books').delete().eq('id', book.id);
    if (error) {
      alert('Could not delete the listing. Please try again.');
      return;
    }
    setBooks((prev) => prev.filter((b) => b.id !== book.id));
  }, [user]);

  // Edit book
  const handleEdit = useCallback((book: Book) => {
    setEditBook(book);
    setAddFormOpen(true);
  }, []);

  // Tab change
  const handleTabChange = (tab: Tab) => {
    if ((tab === 'sell' || tab === 'wishlist' || tab === 'profile' || tab === 'admin') && !user) {
      // Show splash-like prompt — just stay on home and show login prompt
      // We'll handle this by showing a prompt
      return;
    }
    if (tab === 'sell') {
      setEditBook(null);
      setAddFormOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  // After book saved
  const handleBookSaved = () => {
    fetchBooks();
    setActiveTab('home');
  };

  // Auth gate
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950">
        <img src="/logo.svg" alt="Purani Book" className="h-20 w-20 rounded-2xl object-cover shadow-2xl shadow-brand/20" />
        <p className="mt-6 text-lg font-extrabold text-white">Purani <span className="text-brand">Book</span></p>
        <Loader2 className="mt-4 h-5 w-5 animate-spin text-brand" />
      </div>
    );
  }

  if (!user && !browsingAsGuest) {
    return (
      <>
        <SplashScreen onBrowse={() => setBrowsingAsGuest(true)} />
        <BookDetailModal
          book={detailBook}
          userCoords={userCoords}
          isWishlisted={detailBook ? wishlistIds.has(detailBook.id) : false}
          onWishlistToggle={handleWishlistToggle}
          onClose={() => setDetailBook(null)}
        />
      </>
    );
  }

  if (!user && browsingAsGuest) {
    return (
      <div className="min-h-screen bg-ink-950 pb-20">
        {/* Top bar with sign-in banner */}
        <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Purani Book" className="h-8 w-8 rounded-lg object-cover" />
              <div>
                <h1 className="text-sm font-bold leading-tight text-white">
                  Purani <span className="text-brand">Book</span>
                </h1>
                <p className="text-[10px] text-ink-500">Browsing as guest</p>
              </div>
            </div>
            <button
              onClick={() => setBrowsingAsGuest(false)}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white transition-all hover:bg-brand-light active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-md">
          <HomeView
            books={books}
            loading={booksLoading}
            error={booksError}
            userCoords={userCoords}
            wishlistIds={wishlistIds}
            onWishlistToggle={handleWishlistToggle}
            onBookClick={setDetailBook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRetry={fetchBooks}
          />
        </main>

        <BookDetailModal
          book={detailBook}
          userCoords={userCoords}
          isWishlisted={detailBook ? wishlistIds.has(detailBook.id) : false}
          onWishlistToggle={handleWishlistToggle}
          onClose={() => setDetailBook(null)}
        />
      </div>
    );
  }

  // Wishlist books
  const wishlistBooks = books.filter((b) => wishlistIds.has(b.id));

  return (
    <div className="min-h-screen bg-ink-950 pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Purani Book" className="h-8 w-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-sm font-bold leading-tight text-white">
                Purani <span className="text-brand">Book</span>
              </h1>
              <p className="text-[10px] text-ink-500">
                {activeTab === 'home' ? 'Browse books' : activeTab === 'wishlist' ? 'Your saved books' : activeTab === 'admin' ? 'Admin controls' : 'Your account'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-md">
        {activeTab === 'home' && (
          <HomeView
            books={books}
            loading={booksLoading}
            error={booksError}
            userCoords={userCoords}
            wishlistIds={wishlistIds}
            onWishlistToggle={handleWishlistToggle}
            onBookClick={setDetailBook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRetry={fetchBooks}
          />
        )}
        {activeTab === 'admin' && isAdmin && (
          <AdminView
            books={books}
            onBookClick={setDetailBook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBooksChanged={fetchBooks}
          />
        )}
        {activeTab === 'wishlist' && (
          <WishlistView
            books={books}
            wishlistBooks={wishlistBooks}
            userCoords={userCoords}
            wishlistIds={wishlistIds}
            onWishlistToggle={handleWishlistToggle}
            onBookClick={setDetailBook}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            books={books}
            wishlistBooks={wishlistBooks}
            userCoords={userCoords}
            wishlistIds={wishlistIds}
            onWishlistToggle={handleWishlistToggle}
            onBookClick={setDetailBook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSell={() => { setEditBook(null); setAddFormOpen(true); }}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onChange={handleTabChange} isAdmin={isAdmin} />

      {/* Modals */}
      <AddBookForm
        open={addFormOpen}
        onClose={() => { setAddFormOpen(false); setEditBook(null); }}
        onSaved={handleBookSaved}
        editBook={editBook}
      />
      <BookDetailModal
        book={detailBook}
        userCoords={userCoords}
        isWishlisted={detailBook ? wishlistIds.has(detailBook.id) : false}
        onWishlistToggle={handleWishlistToggle}
        onClose={() => setDetailBook(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
