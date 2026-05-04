"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Search, X, User, Phone, Package, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axios";
import { AdminLayout } from "@/components/admin-layout";

interface Consultation {
  _id: string;
  name: string;
  phone: string;
  pageSource: "home" | "product";
  productId: { _id: string; name: string; slug: string; imageUrl?: string } | null;
  productName: string | null;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export default function ConsultationsPage() {
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchConsultations();
  }, [page, search]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.append("search", search);
      const res = await axiosInstance.get(`/consultations/admin/all?${params}`);
      if (res.data.success) {
        setConsultations(res.data.data.consultations);
        setPagination(res.data.data.pagination);
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to fetch consultation requests.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="p-5 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consultation Requests</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pagination.total} total request{pagination.total !== 1 ? "s" : ""} received
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">From Product Pages</p>
              <p className="text-2xl font-bold text-gray-900">
                {consultations.filter((c) => c.pageSource === "product").length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">From Home Page</p>
              <p className="text-2xl font-bold text-gray-900">
                {consultations.filter((c) => c.pageSource === "home").length}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email or product..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              {searchInput && (
                <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-20">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No consultation requests found</p>
              {search && <p className="text-sm text-gray-400 mt-1">Try a different search term</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><User size={13} /> Name</div>
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><Phone size={13} /> Mobile</div>
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><Package size={13} /> Product</div>
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5"><Clock size={13} /> Date & Time</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consultations.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">{c.name}</td>
                      <td className="px-5 py-4 text-gray-600">{c.phone}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            c.pageSource === "product"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {c.pageSource === "product" ? "Product Page" : "Home Page"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {c.pageSource === "product" ? (
                          <div className="flex items-center gap-2">
                            {c.productId?.imageUrl && (
                              <img
                                src={c.productId.imageUrl}
                                alt={c.productId.name}
                                className="w-8 h-8 rounded border border-gray-200 object-cover shrink-0"
                              />
                            )}
                            <span className="truncate max-w-[180px]" title={c.productName ?? c.productId?.name ?? "—"}>
                              {c.productName ?? c.productId?.name ?? "—"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
