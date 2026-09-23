import { LogOut, BookOpen, Heart, Mail, User as UserIcon, Plus } from 'lucide-react';
import type { Book } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Coords } from '@/lib/utils';
import { formatINR, calcDiscount } from '@/lib/utils';
import BookCard from './BookCard';

type Props = {
  books: Book[];
  wishlistBooks: Book[];
  userCoords: Coords | null;
  wishlistIds: Set<string>;
  onWishlistToggle: (bookId: string) => void;
  onBookClick: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onSell: () => void;
};

export default function ProfileView({
  books, wishlistBooks, userCoords, wishlistIds, onWishlistToggle, onBookClick, onEdit, onDelete, onSell,
}: Props) {
  const { user, isAdmin, signOut } = useAuth();

  const myListings = books.filter((b) => b.user_id === user?.id);

  const totalValue = myListings.reduce((sum, b) => sum + Number(b.price), 0);
  const totalSavings = myListings.reduce(
    (sum, b) => sum + (Number(b.original_price) - Number(b.price)),
    0
  );

  return (
    <div className="px-4 py-4">
      {/* Profile header */}
      <div className="card-dark p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
            {(user?.email ?? 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="flex items-center gap-1 truncate text-xs text-ink-400">
              <Mail className="h-3 w-3" />
              {user?.email}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-ink-800 p-3 text-center">
            <p className="text-lg font-extrabold text-brand">{myListings.length}</p>
            <p className="text-[10px] font-medium text-ink-500">Listings</p>
          </div>
          <div className="rounded-xl bg-ink-800 p-3 text-center">
            <p className="text-lg font-extrabold text-brand">{wishlistBooks.length}</p>
            <p className="text-[10px] font-medium text-ink-500">Wishlist</p>
          </div>
          <div className="rounded-xl bg-ink-800 p-3 text-center">
            <p className="text-lg font-extrabold text-brand">{formatINR(totalValue)}</p>
            <p className="text-[10px] font-medium text-ink-500">Listed Value</p>
          </div>
        </div>

        {totalSavings > 0 && (
          <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-xs font-medium text-emerald-400">
            Total savings for buyers: {formatINR(totalSavings)}
          </div>
        )}

        <button
          onClick={onSell}
          className="btn-primary mt-4 w-full"
        >
          <Plus className="h-4 w-4" />
          List a New Book
        </button>

        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-700 bg-ink-800 px-4 py-2.5 text-sm font-semibold text-ink-300 transition-all hover:bg-ink-700 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* My Listings */}
      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-bold text-white">My Listings</h2>
          <span className="text-xs text-ink-500">({myListings.length})</span>
        </div>

        {myListings.length === 0 ? (
          <div className="card-dark flex flex-col items-center justify-center py-10 text-center">
            <BookOpen className="h-8 w-8 text-ink-600" />
            <p className="mt-3 text-sm font-semibold text-ink-300">No books listed yet</p>
            <p className="mt-1 text-xs text-ink-500">Start selling by listing your first book.</p>
            <button onClick={onSell} className="btn-secondary mt-4">
              <Plus className="h-4 w-4" />
              List a Book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {myListings.map((book) => (
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
    </div>
  );
}
