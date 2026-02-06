"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle2, X, MessageSquare, Trash2, Eye, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axios";
import { AdminLayout } from "@/components/admin-layout";

export default function ReviewsPage() {
    const { toast } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("pending");
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseText, setResponseText] = useState("");
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
    });

    useEffect(() => {
        fetchReviews();
    }, [page, statusFilter]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                sortBy: "createdAt",
                sortOrder: "desc"
            });

            if (statusFilter) {
                params.append("status", statusFilter);
            }

            const response = await axiosInstance.get(`/reviews/admin/all?${params}`);
            if (response.data.success) {
                setReviews(response.data.data.reviews);
                setTotalPages(response.data.data.pagination.pages);
            }
        } catch (error: any) {
            console.error("Error fetching reviews:", error);
            toast({ title: "Error", description: "Failed to fetch reviews", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            // Fetch counts for each status
            const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
                axiosInstance.get("/reviews/admin/all?status=pending&limit=1"),
                axiosInstance.get("/reviews/admin/all?status=approved&limit=1"),
                axiosInstance.get("/reviews/admin/all?status=rejected&limit=1")
            ]);

            setStats({
                pending: pendingRes.data.data.pagination.total,
                approved: approvedRes.data.data.pagination.total,
                rejected: rejectedRes.data.data.pagination.total,
                total: pendingRes.data.data.pagination.total +
                    approvedRes.data.data.pagination.total +
                    rejectedRes.data.data.pagination.total
            });
        } catch (error: any) {
            console.error("Error fetching stats:", error);
        }
    };

    const moderateReview = async (reviewId: string, status: string, rejectionReason: string | null = null) => {
        try {
            const response = await axiosInstance.patch(`/reviews/admin/${reviewId}/moderate`, {
                status,
                rejectionReason
            });

            if (response.data.success) {
                toast({ title: "Success", description: `Review ${status} successfully` });
                fetchReviews();
                fetchStats();
            }
        } catch (error: any) {
            console.error("Error moderating review:", error);
            toast({ title: "Error", description: error.response?.data?.message || "Failed to moderate review", variant: "destructive" });
        }
    };

    const addResponse = async (reviewId: string) => {
        if (!responseText.trim()) {
            toast({ title: "Error", description: "Please enter a response", variant: "destructive" });
            return;
        }

        try {
            const response = await axiosInstance.post(`/reviews/admin/${reviewId}/response`, {
                comment: responseText
            });

            if (response.data.success) {
                toast({ title: "Success", description: "Response added successfully" });
                setShowResponseModal(false);
                setResponseText("");
                setSelectedReview(null);
                fetchReviews();
            }
        } catch (error: any) {
            console.error("Error adding response:", error);
            toast({ title: "Error", description: error.response?.data?.message || "Failed to add response", variant: "destructive" });
        }
    };

    const deleteReview = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) {
            return;
        }

        try {
            const response = await axiosInstance.delete(`/reviews/admin/${reviewId}`);
            if (response.data.success) {
                toast({ title: "Success", description: "Review deleted successfully" });
                fetchReviews();
                fetchStats();
            }
        } catch (error: any) {
            console.error("Error deleting review:", error);
            toast({ title: "Error", description: error.response?.data?.message || "Failed to delete review", variant: "destructive" });
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage and moderate customer reviews</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Star className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Filter className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rejected</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <X className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                        <div className="flex gap-2">
                            {["all", "pending", "approved", "rejected"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setStatusFilter(status === "all" ? "" : status);
                                        setPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(status === "all" && !statusFilter) || statusFilter === status
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="bg-white rounded-lg border border-gray-200">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500">No reviews found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {reviews.map((review) => (
                                <div key={review._id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            {/* Product Info */}
                                            <div className="flex items-center gap-3 mb-3">
                                                {review.productId?.imageUrl && (
                                                    <img
                                                        src={review.productId.imageUrl}
                                                        alt={review.productId.name}
                                                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {review.productId?.name || "Product Deleted"}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={14}
                                                                    className={`${i < review.rating
                                                                        ? "fill-yellow-400 text-yellow-400"
                                                                        : "text-gray-200"
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="font-medium text-gray-900">{review.customerName}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-sm text-gray-600">{review.customerEmail}</span>
                                                {review.isVerifiedPurchase && (
                                                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                        <CheckCircle2 size={12} />
                                                        Verified Purchase
                                                    </span>
                                                )}
                                            </div>

                                            {/* Review Content */}
                                            {review.title && (
                                                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                                            )}
                                            <p className="text-gray-700 mb-3">{review.comment}</p>

                                            {/* Media */}
                                            {review.media && review.media.length > 0 && (
                                                <div className="flex gap-2 mb-3">
                                                    {review.media.map((media: any, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                                                        >
                                                            {media.type === "image" ? (
                                                                <img
                                                                    src={media.url}
                                                                    alt={`Review media ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                                    <Eye size={20} className="text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Admin Response */}
                                            {review.adminResponse && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                                    <p className="text-xs font-semibold text-blue-700 mb-1">
                                                        Response from Store
                                                    </p>
                                                    <p className="text-sm text-gray-700">{review.adminResponse.comment}</p>
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="mt-3">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${review.status === "approved"
                                                        ? "bg-green-100 text-green-700"
                                                        : review.status === "rejected"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-orange-100 text-orange-700"
                                                        }`}
                                                >
                                                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 ml-4">
                                            {review.status === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => moderateReview(review._id, "approved")}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt("Rejection reason (optional):");
                                                            moderateReview(review._id, "rejected", reason);
                                                        }}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <X size={16} />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {review.status === "approved" && !review.adminResponse && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedReview(review);
                                                        setShowResponseModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                >
                                                    <MessageSquare size={16} />
                                                    Respond
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteReview(review._id)}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Response Modal */}
                {showResponseModal && selectedReview && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Add Response</h3>
                                <button
                                    onClick={() => {
                                        setShowResponseModal(false);
                                        setResponseText("");
                                        setSelectedReview(null);
                                    }}
                                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>{selectedReview.customerName}</strong> wrote:
                                </p>
                                <p className="text-gray-700">{selectedReview.comment}</p>
                            </div>

                            <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                rows={5}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                placeholder="Write your response..."
                            />

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => addResponse(selectedReview._id)}
                                    className="flex-1 bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Submit Response
                                </button>
                                <button
                                    onClick={() => {
                                        setShowResponseModal(false);
                                        setResponseText("");
                                        setSelectedReview(null);
                                    }}
                                    className="px-6 bg-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
