import { useState, useEffect } from 'react';
import { X, Phone, MapPin, User, Tag, Calendar, BookOpen, Heart, ChevronLeft, ChevronRight, Mail, MessageCircle } from 'lucide-react';
import type { Book } from '@/lib/supabase';
import { formatINR, calcDiscount, calcDistance, type Coords } from '@/lib/utils';

type Props = {
  book: Book | null;
  userCoords: Coords | null;
  isWishlisted: boolean;
  onWishlistToggle: (bookId: string) => void;
  onClose: () => void;
};

const conditionColors: Record<string, string> = {
  'New': 'bg-emerald-500/15 text-emerald-400',
  'Like New': 'bg-teal-500/15 text-teal-400',
  'Good': 'bg-sky-500/15 text-sky-400',
  'Fair': 'bg-amber-500/15 text-amber-400',
  'Acceptable': 'bg-orange-500/15 text-orange-400',
};

export default function BookDetailModal({ book, userCoords, isWishlisted, onWishlistToggle, onClose }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    setPhotoIdx(0);
  }, [book?.id]);

  useEffect(() => {
    if (!book) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [book, onClose]);

  if (!book) return null;

  const photos = book.photo_urls?.length ? book.photo_urls : book.photo_url ? [book.photo_url] : [];
  const discount = calcDiscount(Number(book.original_price), Number(book.price));
  const distance = calcDistance(userCoords, book.latitude != null && book.longitude != null ? { lat: book.latitude, lng: book.longitude } : null);
  const cleanPrimary = book.contact_number.replace(/\s+/g, '');
  const cleanAlt = book.alternate_number?.replace(/\s+/g, '') ?? '';
  const waNumber = cleanPrimary.replace(/\D/g, '');
  const waAlt = cleanAlt.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-ink-900 shadow-2xl sm:rounded-3xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-3.5">
          <h2 className="text-base font-bold text-white">Book Details</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo gallery */}
          <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
            {photos.length > 0 ? (
              <>
                <img src={photos[photoIdx]} alt={book.title} className="h-full w-full object-cover" />
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIdx((photoIdx - 1 + photos.length) % photos.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/60 backdrop-blur-sm transition-all hover:bg-ink-950/80"
                    >
                      <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={() => setPhotoIdx((photoIdx + 1) % photos.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/60 backdrop-blur-sm transition-all hover:bg-ink-950/80"
                    >
                      <ChevronRight className="h-5 w-5 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${i === photoIdx ? 'w-6 bg-brand' : 'w-1.5 bg-white/40'}`}
                        />
                      ))}
                    </div>
                    {/* Thumbnail strip */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={`h-10 w-10 overflow-hidden rounded-md border-2 transition-all ${i === photoIdx ? 'border-brand' : 'border-transparent opacity-60'}`}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-900">
                <BookOpen className="h-12 w-12 text-ink-600" />
              </div>
            )}
            {discount > 0 && (
              <div className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-lg">
                {discount}% OFF
              </div>
            )}
            <button
              onClick={() => onWishlistToggle(book.id)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/60 backdrop-blur-sm transition-all hover:bg-ink-950/80 active:scale-90"
            >
              <Heart className={`h-4 w-4 transition-all ${isWishlisted ? 'fill-brand text-brand' : 'text-white'}`} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 p-5">
            <div>
              <h3 className="text-xl font-bold text-white">{book.title}</h3>
              {book.author && <p className="mt-1 text-sm text-ink-400">by {book.author}</p>}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-brand">{formatINR(Number(book.price))}</span>
              {Number(book.original_price) > 0 && Number(book.original_price) > Number(book.price) && (
                <span className="text-sm text-ink-500 line-through">{formatINR(Number(book.original_price))}</span>
              )}
              {discount > 0 && (
                <span className="text-sm font-semibold text-emerald-400">Save {discount}%</span>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${conditionColors[book.condition] ?? 'bg-ink-800 text-ink-300'}`}>
                {book.condition}
              </span>
              {book.category && (
                <span className="flex items-center gap-1 rounded-full bg-ink-800 px-3 py-1 text-xs font-medium text-ink-300">
                  <Tag className="h-3 w-3" /> {book.category}
                </span>
              )}
              {book.subject && (
                <span className="rounded-full bg-ink-800 px-3 py-1 text-xs font-medium text-ink-300">
                  {book.subject}
                </span>
              )}
              {book.edition_year && (
                <span className="flex items-center gap-1 rounded-full bg-ink-800 px-3 py-1 text-xs font-medium text-ink-300">
                  <Calendar className="h-3 w-3" /> {book.edition_year}
                </span>
              )}
            </div>

            {/* Description */}
            {book.description && (
              <div>
                <p className="label-dark">Description</p>
                <p className="text-sm leading-relaxed text-ink-300">{book.description}</p>
              </div>
            )}

            {/* Seller info */}
            <div className="card-dark space-y-2.5 p-4">
              <p className="label-dark">Seller Information</p>
              <div className="flex items-center gap-2 text-sm text-ink-200">
                <User className="h-4 w-4 text-ink-500" />
                {book.seller_name}
              </div>
              {book.seller_email && (
                <a href={`mailto:${book.seller_email}`} className="flex items-center gap-2 text-sm text-brand hover:underline">
                  <Mail className="h-4 w-4 text-ink-500" />
                  {book.seller_email}
                </a>
              )}
              {book.city && (
                <div className="flex items-center gap-2 text-sm text-ink-200">
                  <MapPin className="h-4 w-4 text-ink-500" />
                  {book.city}
                  {distance != null && <span className="text-brand">• {distance} km away</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact actions */}
        <div className="space-y-2 border-t border-ink-800 p-4">
          <div className="flex gap-2.5">
            <a href={`tel:${cleanPrimary}`} className="btn-primary flex-1">
              <Phone className="h-4 w-4" />
              Call Seller
            </a>
            {cleanAlt && (
              <a href={`tel:${cleanAlt}`} className="btn-secondary flex-1">
                <Phone className="h-4 w-4" />
                Alt Number
              </a>
            )}
          </div>
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${book.seller_name}, I'm interested in your book "${book.title}" listed on Purani Book.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          )}
          {!waNumber && waAlt && (
            <a
              href={`https://wa.me/${waAlt}?text=${encodeURIComponent(`Hi ${book.seller_name}, I'm interested in your book "${book.title}" listed on Purani Book.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
