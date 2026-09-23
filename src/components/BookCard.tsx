import { useState } from 'react';
import { Heart, MapPin, Phone, Pencil, Trash2, BookOpen, Tag, User, Calendar, MessageCircle, Shield } from 'lucide-react';
import type { Book } from '@/lib/supabase';
import { formatINR, calcDiscount, calcDistance, type Coords } from '@/lib/utils';

type Props = {
  book: Book;
  currentUserId: string | null;
  isAdmin?: boolean;
  userCoords: Coords | null;
  isWishlisted: boolean;
  onWishlistToggle: (bookId: string) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onClick?: (book: Book) => void;
};

const conditionColors: Record<string, string> = {
  'New': 'bg-emerald-500/15 text-emerald-400',
  'Like New': 'bg-teal-500/15 text-teal-400',
  'Good': 'bg-sky-500/15 text-sky-400',
  'Fair': 'bg-amber-500/15 text-amber-400',
  'Acceptable': 'bg-orange-500/15 text-orange-400',
};

export default function BookCard({
  book, currentUserId, isAdmin = false, userCoords, isWishlisted, onWishlistToggle, onEdit, onDelete, onClick,
}: Props) {
  const [showActions, setShowActions] = useState(false);
  const isOwner = currentUserId != null && book.user_id === currentUserId;
  const canManage = isOwner || isAdmin;
  const discount = calcDiscount(Number(book.original_price), Number(book.price));
  const distance = calcDistance(userCoords, book.latitude != null && book.longitude != null ? { lat: book.latitude, lng: book.longitude } : null);
  const photos = book.photo_urls?.length ? book.photo_urls : book.photo_url ? [book.photo_url] : [];
  const mainPhoto = photos[0] ?? null;

  const cleanPrimary = book.contact_number.replace(/\s+/g, '');
  const cleanAlt = book.alternate_number?.replace(/\s+/g, '') ?? '';
  const waNumber = cleanPrimary.replace(/\D/g, '') || cleanAlt.replace(/\D/g, '');

  return (
    <div
      className="card-dark overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-700 hover:shadow-xl hover:shadow-black/30"
      onClick={() => onClick?.(book)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800" onClick={(e) => e.stopPropagation()}>
        {mainPhoto ? (
          <img src={mainPhoto} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-900">
            <BookOpen className="h-10 w-10 text-ink-600" />
          </div>
        )}

        {discount > 0 && (
          <div className="absolute left-2.5 top-2.5 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            {discount}% OFF
          </div>
        )}

        {isAdmin && !isOwner && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-purple-500/80 px-2 py-0.5 text-[10px] font-bold text-white" style={{ top: discount > 0 ? '2.625rem' : '0.625rem' }}>
            <Shield className="h-2.5 w-2.5" />
            Admin
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onWishlistToggle(book.id); }}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/60 backdrop-blur-sm transition-all hover:bg-ink-950/80 active:scale-90"
        >
          <Heart className={`h-4 w-4 transition-all ${isWishlisted ? 'fill-brand text-brand' : 'text-white'}`} />
        </button>

        {photos.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 rounded-md bg-ink-950/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {photos.length} photos
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3.5" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">{book.title}</h3>
          {book.author && <p className="mt-0.5 text-xs text-ink-400">by {book.author}</p>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-brand">{formatINR(Number(book.price))}</span>
          {Number(book.original_price) > 0 && Number(book.original_price) > Number(book.price) && (
            <span className="text-xs text-ink-500 line-through">{formatINR(Number(book.original_price))}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${conditionColors[book.condition] ?? 'bg-ink-800 text-ink-300'}`}>
            {book.condition}
          </span>
          {book.category && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {book.category}
            </span>
          )}
          {book.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {book.city}
            </span>
          )}
          {distance != null && (
            <span className="text-brand">{distance} km away</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
          <User className="h-3 w-3" />
          <span>{book.seller_name}</span>
          {book.edition_year && (
            <>
              <span className="text-ink-700">•</span>
              <Calendar className="h-3 w-3" />
              <span>{book.edition_year}</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-1 flex gap-2">
          <a
            href={`tel:${cleanPrimary}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white transition-all hover:bg-brand-light active:scale-95"
          >
            <Phone className="h-3.5 w-3.5" />
            Call
          </a>
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${book.seller_name}, I'm interested in your book "${book.title}" listed on Purani Book.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat
            </a>
          )}

          {canManage && (
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center justify-center rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-xs font-semibold text-ink-300 transition-all hover:bg-ink-700 active:scale-95"
            >
              {showActions ? 'Cancel' : 'Manage'}
            </button>
          )}
        </div>

        {canManage && showActions && (
          <div className="flex gap-2 animate-fade-in">
            {onEdit && (
              <button
                onClick={() => { setShowActions(false); onEdit(book); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-xs font-semibold text-sky-400 transition-all hover:bg-ink-700"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { setShowActions(false); onDelete(book); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
