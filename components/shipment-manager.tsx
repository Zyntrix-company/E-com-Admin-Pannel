"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Truck, XCircle, Eye, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface ShipmentManagerProps {
    orderId: string;
    awbNumber?: string;
    shippingProvider?: string;
    orderStatus: string;
    onShipmentCreated?: () => void;
    onShipmentCancelled?: () => void;
}

export default function ShipmentManager({
    orderId,
    awbNumber,
    shippingProvider,
    orderStatus,
    onShipmentCreated,
    onShipmentCancelled
}: ShipmentManagerProps) {
    const [loading, setLoading] = useState(false);
    const [trackingData, setTrackingData] = useState<any>(null);
    const [showTracking, setShowTracking] = useState(false);

    const createShipment = async () => {
        if (!confirm("Create shipment for this order?")) return;

        setLoading(true);
        try {
            const response = await axios.post(`/api/tracking/create/${orderId}`);

            if (response.data.success) {
                toast.success("Shipment created successfully!");
                onShipmentCreated?.();
            }
        } catch (error: any) {
            console.error("Create shipment error:", error);
            toast.error(error.response?.data?.message || "Failed to create shipment");
        } finally {
            setLoading(false);
        }
    };

    const cancelShipment = async () => {
        const reason = prompt("Enter cancellation reason:");
        if (!reason) return;

        setLoading(true);
        try {
            const response = await axios.post(`/api/tracking/cancel/${orderId}`, {
                cancellationReason: reason
            });

            if (response.data.success) {
                toast.success("Shipment cancelled successfully!");
                onShipmentCancelled?.();
            }
        } catch (error: any) {
            console.error("Cancel shipment error:", error);
            toast.error(error.response?.data?.message || "Failed to cancel shipment");
        } finally {
            setLoading(false);
        }
    };

    const viewTracking = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/tracking/track/${orderId}`);

            if (response.data.success) {
                setTrackingData(response.data.data);
                setShowTracking(true);
            }
        } catch (error: any) {
            console.error("Track order error:", error);
            toast.error(error.response?.data?.message || "Failed to fetch tracking data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                {!awbNumber && orderStatus !== "cancelled" && (
                    <button
                        onClick={createShipment}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Package className="w-4 h-4" />
                        )}
                        Create Shipment
                    </button>
                )}

                {awbNumber && (
                    <>
                        <button
                            onClick={viewTracking}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                            View Tracking
                        </button>

                        {orderStatus !== "cancelled" && orderStatus !== "delivered" && (
                            <button
                                onClick={cancelShipment}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                Cancel Shipment
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Shipment Info */}
            {awbNumber && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <p className="text-sm text-gray-500">AWB Number</p>
                            <p className="font-semibold text-gray-900">{awbNumber}</p>
                        </div>
                        {shippingProvider && (
                            <div>
                                <p className="text-sm text-gray-500">Shipping Provider</p>
                                <p className="font-semibold text-gray-900 capitalize">{shippingProvider}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tracking Modal */}
            {showTracking && trackingData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowTracking(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-900">Tracking Details</h3>
                                <button
                                    onClick={() => setShowTracking(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <Truck className="w-6 h-6 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Current Status</p>
                                        <p className="text-lg font-bold text-blue-900">{trackingData.status}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {trackingData.awbNumber && (
                                    <div>
                                        <p className="text-sm text-gray-500">AWB Number</p>
                                        <p className="font-semibold text-gray-900">{trackingData.awbNumber}</p>
                                    </div>
                                )}
                                {trackingData.currentLocation && trackingData.currentLocation !== "N/A" && (
                                    <div>
                                        <p className="text-sm text-gray-500">Current Location</p>
                                        <p className="font-semibold text-gray-900">{trackingData.currentLocation}</p>
                                    </div>
                                )}
                                {trackingData.expectedDelivery && (
                                    <div>
                                        <p className="text-sm text-gray-500">Expected Delivery</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(trackingData.expectedDelivery).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {trackingData.provider && (
                                    <div>
                                        <p className="text-sm text-gray-500">Provider</p>
                                        <p className="font-semibold text-gray-900 capitalize">{trackingData.provider}</p>
                                    </div>
                                )}
                            </div>

                            {/* Tracking History */}
                            {trackingData.scans && trackingData.scans.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-4">Tracking History</h4>
                                    <div className="space-y-3">
                                        {trackingData.scans.map((scan: any, index: number) => (
                                            <div key={index} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                                                <div className="flex-shrink-0 mt-1">
                                                    {scan.status?.toLowerCase().includes("delivered") ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <AlertCircle className="w-5 h-5 text-blue-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-1">
                                                        <p className="font-semibold text-gray-900 text-sm">{scan.status}</p>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(scan.time).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {scan.location && (
                                                        <p className="text-sm text-gray-600">{scan.location}</p>
                                                    )}
                                                    {scan.instructions && (
                                                        <p className="text-xs text-gray-500 mt-1">{scan.instructions}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
