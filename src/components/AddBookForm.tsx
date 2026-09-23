import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { X, Upload, ImageIcon, Loader2, MapPin, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { supabase, CONDITIONS, type Book, type BookInsert } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { fileToDataURL, getCurrentPosition, type Coords } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editBook?: Book | null;
};

const MAX_PHOTOS = 7;
const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB per photo

export default function AddBookForm({ open, onClose, onSaved, editBook }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState<string>('Good');
  const [editionYear, setEditionYear] = useState('');
  const [description, setDescription] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [city, setCity] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [alternateNumber, setAlternateNumber] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editBook;

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (editBook) {
      setTitle(editBook.title ?? '');
      setAuthor(editBook.author ?? '');
      setCategory(editBook.category ?? '');
      setSubject(editBook.subject ?? '');
      setPrice(editBook.price != null ? String(editBook.price) : '');
      setOriginalPrice(editBook.original_price != null ? String(editBook.original_price) : '');
      setCondition(editBook.condition ?? 'Good');
      setEditionYear(editBook.edition_year ?? '');
      setDescription(editBook.description ?? '');
      setSellerName(editBook.seller_name ?? '');
      setSellerEmail(editBook.seller_email ?? '');
      setCity(editBook.city ?? '');
      setContactNumber(editBook.contact_number ?? '');
      setAlternateNumber(editBook.alternate_number ?? '');
      const existingPhotos = editBook.photo_urls?.length ? editBook.photo_urls : editBook.photo_url ? [editBook.photo_url] : [];
      setPhotos(existingPhotos);
      setCoords(editBook.latitude != null && editBook.longitude != null ? { lat: editBook.latitude, lng: editBook.longitude } : null);
      setUseLocation(editBook.latitude != null);
    } else {
      resetForm();
      // Pre-fill seller info from auth
      if (user) {
        setSellerEmail(user.email ?? '');
        const fullName = user.user_metadata?.full_name ?? '';
        if (fullName) setSellerName(fullName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editBook, user]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  function resetForm() {
    setTitle(''); setAuthor(''); setCategory(''); setSubject('');
    setPrice(''); setOriginalPrice(''); setCondition('Good');
    setEditionYear(''); setDescription('');
    setSellerName(''); setSellerEmail(''); setCity('');
    setContactNumber(''); setAlternateNumber('');
    setPhotos([]); setCoords(null); setUseLocation(false);
    setErrors({}); setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPhotoError(null);

    const remaining = MAX_PHOTOS - photos.length;
    if (files.length > remaining) {
      setPhotoError(`You can upload up to ${MAX_PHOTOS} photos total.`);
    }

    const toProcess = files.slice(0, remaining);
    const newPhotos: string[] = [];

    for (const file of toProcess) {
      if (file.size > MAX_PHOTO_SIZE) {
        setPhotoError(`"${file.name}" is too large. Max 2MB per photo.`);
        continue;
      }
      try {
        const url = await fileToDataURL(file);
        newPhotos.push(url);
      } catch {
        setPhotoError('Could not process one or more photos.');
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUseLocation() {
    if (!useLocation) {
      setUseLocation(true);
      setLocating(true);
      try {
        const pos = await getCurrentPosition();
        setCoords(pos);
      } catch {
        setErrors((prev) => ({ ...prev, city: 'Could not get your location. Please enter manually.' }));
        setUseLocation(false);
      }
      setLocating(false);
    } else {
      setUseLocation(false);
      setCoords(null);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Book name is required';
    if (!category.trim()) e.category = 'Course/Category is required';
    if (!price.trim()) e.price = 'Selling price is required';
    if (!originalPrice.trim()) e.originalPrice = 'Original price is required';
    if (!sellerName.trim()) e.sellerName = 'Seller name is required';
    if (!sellerEmail.trim()) e.sellerEmail = 'Seller email is required';
    if (!city.trim()) e.city = 'City/Pincode is required';
    if (!contactNumber.trim()) e.contactNumber = 'Contact number is required';
    if (photos.length === 0) e.photos = 'At least one book cover photo is required';

    const priceNum = parseFloat(price);
    if (price.trim() && (isNaN(priceNum) || priceNum < 0)) e.price = 'Enter a valid price';

    const origNum = parseFloat(originalPrice);
    if (originalPrice.trim() && (isNaN(origNum) || origNum < 0)) e.originalPrice = 'Enter a valid price';

    if (!sellerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail.trim())) {
      e.sellerEmail = 'Enter a valid email address';
    }

    if (!contactNumber.trim() || contactNumber.replace(/\D/g, '').length < 10) {
      e.contactNumber = 'Enter a valid phone number (min 10 digits)';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!user) return;
    if (!validate()) return;

    setSubmitting(true);

    const insert: BookInsert = {
      title: title.trim(),
      author: author.trim(),
      price: parseFloat(price),
      original_price: parseFloat(originalPrice),
      condition,
      category: category.trim(),
      subject: subject.trim(),
      edition_year: editionYear.trim(),
      description: description.trim(),
      city: city.trim(),
      seller_name: sellerName.trim(),
      seller_email: sellerEmail.trim(),
      contact_number: contactNumber.trim(),
      alternate_number: alternateNumber.trim(),
      photo_urls: photos,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    };

    let error: { message: string } | null = null;

    if (isEdit && editBook) {
      const { error: updateError } = await supabase
        .from('books')
        .update({ ...insert, user_id: user.id })
        .eq('id', editBook.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('books')
        .insert({ ...insert, user_id: user.id })
        .select();
      error = insertError;
    }

    setSubmitting(false);

    if (error) {
      setErrors({ form: 'Could not save the listing. Please try again.' });
      return;
    }

    resetForm();
    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-ink-900 shadow-2xl sm:rounded-3xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="rounded-full p-1 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-white">{isEdit ? 'Edit Book' : 'Sell a Book'}</h2>
          </div>
          <button onClick={handleClose} className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {/* Photos */}
            <div>
              <label className="label-dark">Book Cover Photos <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-3 gap-2.5">
                {photos.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-700">
                    <img src={url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950/70 text-white backdrop-blur-sm transition-all hover:bg-red-500/80"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-1 left-1 rounded bg-brand px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-700 bg-ink-800/50 text-ink-500 transition-all hover:border-brand hover:text-brand"
                  >
                    <div className="rounded-full bg-ink-800 p-2">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium">Add Photo</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
              <p className="mt-1.5 text-[11px] text-ink-500">{photos.length}/{MAX_PHOTOS} photos • Max 2MB each</p>
              {errors.photos && <p className="mt-1 text-xs font-medium text-red-400">{errors.photos}</p>}
              {photoError && <p className="mt-1 text-xs font-medium text-amber-400">{photoError}</p>}
            </div>

            {/* Required fields */}
            <Field label="Book Name" required error={errors.title}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Concepts of Physics" className="input-dark" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Course / Category" required error={errors.category}>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-dark">
                  <option value="">Select a category</option>
                  <option value="CA Intermediate">CA Intermediate</option>
                  <option value="Engineering / B.Tech">Engineering / B.Tech</option>
                  <option value="Medical / NEET-JEE">Medical / NEET-JEE</option>
                  <option value="UPSC / Civil Services">UPSC / Civil Services</option>
                  <option value="Class 12 / School">Class 12 / School</option>
                  <option value="Class 10 / Board">Class 10 / Board</option>
                  <option value="Novels & Fiction">Novels &amp; Fiction</option>
                  <option value="Comics">Comics</option>
                  <option value="Competitive Exams">Competitive Exams</option>
                  <option value="General Knowledge">General Knowledge</option>
                  <option value="Others">Others</option>
                </select>
              </Field>
              <Field label="Subject">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mechanics" className="input-dark" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Selling Price (₹)" required error={errors.price}>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="input-dark" />
              </Field>
              <Field label="Original Price (₹)" required error={errors.originalPrice}>
                <input type="number" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="0" className="input-dark" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Condition">
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="input-dark">
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Edition / Year">
                <input value={editionYear} onChange={(e) => setEditionYear(e.target.value)} placeholder="e.g. 3rd Ed. 2020" className="input-dark" />
              </Field>
            </div>

            <Field label="Author Name">
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. H.C. Verma" className="input-dark" />
            </Field>

            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the book's condition, highlights, etc." rows={3} className="input-dark resize-none" />
            </Field>

            {/* Seller info */}
            <div className="space-y-3 rounded-xl border border-ink-800 bg-ink-950/50 p-4">
              <p className="label-dark">Seller Information</p>
              <Field label="Seller Name" required error={errors.sellerName}>
                <input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Your name" className="input-dark" />
              </Field>
              <Field label="Seller Email" required error={errors.sellerEmail}>
                <input type="email" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} placeholder="your@email.com" className="input-dark" />
              </Field>
              <Field label="City / Pincode" required error={errors.city}>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai 400001" className="input-dark" />
              </Field>

              {/* Use current location */}
              <button
                onClick={handleUseLocation}
                type="button"
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  useLocation
                    ? 'border-brand/40 bg-brand/10 text-brand'
                    : 'border-ink-700 bg-ink-800 text-ink-300 hover:border-ink-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Use current location
                </span>
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
                ) : useLocation ? (
                  <span className="text-xs text-brand">Location set</span>
                ) : (
                  <span className="text-xs text-ink-500">Tap to enable</span>
                )}
              </button>

              <Field label="Contact Number" required error={errors.contactNumber}>
                <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g. +91 98765 43210" className="input-dark" />
              </Field>
              <Field label="Alternate Number">
                <input type="tel" value={alternateNumber} onChange={(e) => setAlternateNumber(e.target.value)} placeholder="Optional" className="input-dark" />
              </Field>
            </div>

            {errors.form && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                {errors.form}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-ink-800 p-4">
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? 'Updating...' : 'Listing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {isEdit ? 'Update Book' : 'List My Book'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-dark">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}
