import { useState, useMemo } from 'react';
import { Search, X, BookOpen, Loader2, SlidersHorizontal } from 'lucide-react';
import type { Book } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatINR, calcDiscount, type Coords } from '@/lib/utils';
import BookCard from './BookCard';

type Props = {
  books: Book[];
  loading: boolean;
  error: string | null;
  userCoords: Coords | null;
  wishlistIds: Set<string>;
  onWishlistToggle: (bookId: string) => void;
  onBookClick: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onRetry: () => void;
};

type SortMode = 'newest' | 'price-low' | 'price-high' | 'discount';

export default function HomeView({
  books, loading, error, userCoords, wishlistIds, onWishlistToggle, onBookClick, onEdit, onDelete, onRetry,
}: Props) {
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showSort, setShowSort] = useState(false);

  // Dynamic categories from data
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => { if (b.category) set.add(b.category); });
    return ['All', ...Array.from(set).sort()];
  }, [books]);

  const filtered = useMemo(() => {
    let result = books.filter((b) => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q);
      const matchesCat = activeCategory === 'All' || b.category === activeCategory;
      return matchesSearch && matchesCat;
    });

    switch (sortMode) {
      case 'price-low':
        result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-high':
        result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'discount':
        result = [...result].sort((a, b) =>
          calcDiscount(Number(b.original_price), Number(b.price)) - calcDiscount(Number(a.original_price), Number(a.price))
        );
        break;
      default:
        result = [...result].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return result;
  }, [books, search, activeCategory, sortMode]);

  const sortLabels: Record<SortMode, string> = {
    'newest': 'Newest First',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    'discount': 'Biggest Discount',
  };

  return (
    <div className="px-4 py-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, author, or category..."
          className="w-full rounded-xl border border-ink-700 bg-ink-800 py-3 pl-10 pr-10 text-sm text-ink-100 outline-none transition-all placeholder:text-ink-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {search && (
            <button onClick={() => setSearch('')} className="rounded-full p-1 text-ink-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setShowSort(!showSort)}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-brand"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sort dropdown */}
      {showSort && (
        <div className="mt-2 flex flex-wrap gap-2 animate-fade-in">
          {(Object.keys(sortLabels) as SortMode[]).map((key) => (
            <button
              key={key}
              onClick={() => { setSortMode(key); setShowSort(false); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                sortMode === key
                  ? 'bg-brand text-white'
                  : 'bg-ink-800 text-ink-400 hover:text-ink-200'
              }`}
            >
              {sortLabels[key]}
            </button>
          ))}
        </div>
      )}

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-brand text-white'
                  : 'bg-ink-800 text-ink-400 border border-ink-700 hover:text-ink-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="mt-3 mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-ink-500">
          {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'book' : 'books'} found`}
        </p>
        {!user && (
          <p className="text-xs font-medium text-ink-600">Sign in to list books</p>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink-500">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="mt-3 text-sm">Loading books...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button onClick={onRetry} className="btn-secondary mt-3">Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-ink-800 p-4">
            <BookOpen className="h-8 w-8 text-ink-600" />
          </div>
          <p className="mt-4 text-sm font-semibold text-ink-300">
            {books.length === 0 ? 'No books listed yet' : 'No books match your search'}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            {books.length === 0 ? 'Be the first to list a book for sale.' : 'Try a different search or category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              currentUserId={user?.id ?? null}
              isAdmin={isAdmin}
              userCoords={userCoords}
              isWishlisted={wishlistIds.has(book.id)}
              onWishlistToggle={onWishlistToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={onBookClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
