import { Heart, BookOpen } from 'lucide-react';
import type { Book } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Coords } from '@/lib/utils';
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
};

export default function WishlistView({
  wishlistBooks, userCoords, wishlistIds, onWishlistToggle, onBookClick, onEdit, onDelete,
}: Props) {
  const { user, isAdmin } = useAuth();

  if (wishlistBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="rounded-full bg-ink-800 p-4">
          <Heart className="h-8 w-8 text-ink-600" />
        </div>
        <p className="mt-4 text-sm font-semibold text-ink-300">Your wishlist is empty</p>
        <p className="mt-1 text-xs text-ink-500">Tap the heart icon on any book to save it here.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <Heart className="h-4 w-4 fill-brand text-brand" />
        <h2 className="text-sm font-bold text-white">My Wishlist</h2>
        <span className="text-xs text-ink-500">({wishlistBooks.length})</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {wishlistBooks.map((book) => (
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
    </div>
  );
}
