import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, BookOpen, Trash2, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, type Book, type UserWithCount } from '@/lib/supabase';
import { formatINR } from '@/lib/utils';

type Props = {
  books: Book[];
  onBookClick: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onBooksChanged: () => void;
};

export default function AdminView({ books, onBookClick, onEdit, onDelete, onBooksChanged }: Props) {
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [bookSearch, setBookSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('get_all_users');
    setLoading(false);
    if (rpcError) {
      setError('Could not load user data.');
      return;
    }
    setUsers((data as UserWithCount[]) ?? []);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    const { error: rpcError } = await supabase.rpc('admin_toggle_user_admin', {
      p_user_id: userId,
      p_is_admin: !currentAdmin,
    });
    if (rpcError) {
      alert('Could not update admin status.');
      return;
    }
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_admin: !currentAdmin } : u));
  };

  const handleAdminDeleteBook = async (book: Book) => {
    if (!confirm(`Delete "${book.title}" by ${book.seller_name}? This cannot be undone.`)) return;
    const { error: rpcError } = await supabase.rpc('admin_delete_book', { p_book_id: book.id });
    if (rpcError) {
      alert('Could not delete the listing.');
      return;
    }
    onBooksChanged();
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    return !q || u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q);
  });

  const filteredBooks = books.filter((b) => {
    const q = bookSearch.toLowerCase().trim();
    return !q || b.title.toLowerCase().includes(q) || b.seller_name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
  });

  return (
    <div className="px-4 py-4">
      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="card-dark p-3 text-center">
          <p className="text-lg font-extrabold text-brand">{users.length}</p>
          <p className="text-[10px] font-medium text-ink-500">Users</p>
        </div>
        <div className="card-dark p-3 text-center">
          <p className="text-lg font-extrabold text-brand">{books.length}</p>
          <p className="text-[10px] font-medium text-ink-500">Listings</p>
        </div>
        <div className="card-dark p-3 text-center">
          <p className="text-lg font-extrabold text-brand">{users.filter((u) => u.is_admin).length}</p>
          <p className="text-[10px] font-medium text-ink-500">Admins</p>
        </div>
      </div>

      {/* User Records */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-bold text-white">User Records</h2>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full rounded-xl border border-ink-700 bg-ink-800 py-2.5 pl-9 pr-3 text-xs text-ink-100 outline-none placeholder:text-ink-500 focus:border-brand"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-500">No users found.</p>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((u) => {
              const userBooks = books.filter((b) => b.user_id === u.id);
              const isExpanded = expandedUser === u.id;
              return (
                <div key={u.id} className="card-dark overflow-hidden">
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                    className="flex w-full items-center gap-3 p-3.5 text-left"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                      {(u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {u.full_name || u.email}
                      </p>
                      <p className="truncate text-[11px] text-ink-500">{u.email}</p>
                    </div>
                    {u.is_admin && (
                      <span className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                        <Shield className="h-2.5 w-2.5" />
                        Admin
                      </span>
                    )}
                    <span className="rounded-full bg-ink-800 px-2 py-0.5 text-[10px] font-medium text-ink-400">
                      {u.listing_count} books
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-ink-500" /> : <ChevronDown className="h-4 w-4 text-ink-500" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-ink-800 p-3.5 animate-fade-in">
                      <div className="mb-3 flex items-center justify-between text-[11px] text-ink-400">
                        <span>Joined: {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                            u.is_admin
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                          }`}
                        >
                          {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </div>

                      {userBooks.length > 0 ? (
                        <div className="space-y-2">
                          {userBooks.map((book) => (
                            <div key={book.id} className="flex items-center gap-2.5 rounded-lg bg-ink-800 p-2.5">
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-ink-700">
                                {(book.photo_urls?.[0] || book.photo_url) ? (
                                  <img src={book.photo_urls?.[0] ?? book.photo_url ?? ''} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-ink-600" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-white">{book.title}</p>
                                <p className="text-[10px] text-ink-500">{formatINR(Number(book.price))} • {book.condition}</p>
                              </div>
                              <button
                                onClick={() => onBookClick(book)}
                                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-700 hover:text-white"
                              >
                                <Search className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onEdit(book)}
                                className="rounded-lg p-1.5 text-sky-400 transition-colors hover:bg-ink-700"
                              >
                                <span className="text-[10px] font-bold">Edit</span>
                              </button>
                              <button
                                onClick={() => handleAdminDeleteBook(book)}
                                className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-[11px] text-ink-600">No listings from this user.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Listings Management */}
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-bold text-white">All Listings</h2>
          <span className="text-xs text-ink-500">({filteredBooks.length})</span>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={bookSearch}
            onChange={(e) => setBookSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full rounded-xl border border-ink-700 bg-ink-800 py-2.5 pl-9 pr-3 text-xs text-ink-100 outline-none placeholder:text-ink-500 focus:border-brand"
          />
        </div>

        <div className="space-y-2">
          {filteredBooks.map((book) => (
            <div key={book.id} className="card-dark flex items-center gap-3 p-3">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ink-700">
                {(book.photo_urls?.[0] || book.photo_url) ? (
                  <img src={book.photo_urls?.[0] ?? book.photo_url ?? ''} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-5 w-5 text-ink-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{book.title}</p>
                <p className="truncate text-[10px] text-ink-500">
                  {formatINR(Number(book.price))} • {book.seller_name} • {book.city}
                </p>
              </div>
              <button
                onClick={() => onBookClick(book)}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-700 hover:text-white"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onEdit(book)}
                className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-sky-400 transition-colors hover:bg-ink-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleAdminDeleteBook(book)}
                className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
