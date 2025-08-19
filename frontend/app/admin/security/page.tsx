'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/Toast';
import { apiCall } from '../../utils/api';

interface FraudStats {
  totalChecks: number;
  averageScore: number;
  blocked: number;
  reviewed: number;
  allowed: number;
}

interface GDPRStats {
  totalRequests: number;
  pending: number;
  processing: number;
  completed: number;
  rejected: number;
  accessRequests: number;
  erasureRequests: number;
  portabilityRequests: number;
}

interface DataRightsRequest {
  id: string;
  email: string;
  request_type: string;
  reason?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SecurityPage() {
  const { addToast } = useToast();
  const [fraudStats, setFraudStats] = useState<FraudStats | null>(null);
  const [gdprStats, setGdprStats] = useState<GDPRStats | null>(null);
  const [dataRightsRequests, setDataRightsRequests] = useState<DataRightsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState(false);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    const token = sessionStorage.getItem("admin_jwt");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    apiCall("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.role !== "admin") {
          sessionStorage.removeItem("admin_jwt");
          router.replace("/admin/login");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        sessionStorage.removeItem("admin_jwt");
        router.replace("/admin/login");
      });
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchData();
    }
  }, [authChecked]);

  async function fetchData() {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("admin_jwt");
      
      // Fetch fraud stats
      const fraudRes = await apiCall("/api/fraud/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (fraudRes.ok) {
        const fraudData = await fraudRes.json();
        setFraudStats(fraudData.stats);
      }

      // Fetch GDPR stats
      const gdprRes = await apiCall("/api/privacy/admin/gdpr-stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (gdprRes.ok) {
        const gdprData = await gdprRes.json();
        setGdprStats(gdprData.stats);
      }

      // Fetch data rights requests
      const requestsRes = await apiCall("/api/privacy/admin/data-rights", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setDataRightsRequests(requestsData.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load security data'
      });
    } finally {
      setLoading(false);
    }
  }

  async function processDataRightsRequest(requestId: string) {
    setProcessingRequest(true);
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const res = await apiCall(`/api/privacy/admin/data-rights/${requestId}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Data rights request processed successfully'
        });
        fetchData(); // Refresh data
      } else {
        throw new Error('Failed to process request');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to process data rights request'
      });
    } finally {
      setProcessingRequest(false);
    }
  }

  if (!authChecked) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading security data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security & Compliance</h1>
          <p className="mt-2 text-gray-600">Monitor fraud detection and manage GDPR compliance</p>
        </div>

        {/* Fraud Detection Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fraud Detection</h2>
            {fraudStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{fraudStats.totalChecks}</div>
                    <div className="text-sm text-green-600">Total Checks</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{fraudStats.averageScore?.toFixed(1) || 0}</div>
                    <div className="text-sm text-blue-600">Avg Risk Score</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{fraudStats.allowed}</div>
                    <div className="text-xs text-green-600">Allowed</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">{fraudStats.reviewed}</div>
                    <div className="text-xs text-yellow-600">Reviewed</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{fraudStats.blocked}</div>
                    <div className="text-xs text-red-600">Blocked</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No fraud detection data available</div>
            )}
          </div>

          {/* GDPR Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">GDPR Compliance</h2>
            {gdprStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{gdprStats.totalRequests}</div>
                    <div className="text-sm text-purple-600">Total Requests</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{gdprStats.completed}</div>
                    <div className="text-sm text-blue-600">Completed</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">{gdprStats.pending}</div>
                    <div className="text-xs text-yellow-600">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{gdprStats.processing}</div>
                    <div className="text-xs text-blue-600">Processing</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{gdprStats.rejected}</div>
                    <div className="text-xs text-red-600">Rejected</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{gdprStats.accessRequests}</div>
                    <div className="text-xs text-green-600">Access</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{gdprStats.erasureRequests}</div>
                    <div className="text-xs text-orange-600">Erasure</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{gdprStats.portabilityRequests}</div>
                    <div className="text-xs text-blue-600">Portability</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No GDPR data available</div>
            )}
          </div>
        </div>

        {/* Data Rights Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Rights Requests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dataRightsRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {request.request_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => processDataRightsRequest(request.id)}
                          disabled={processingRequest}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {processingRequest ? 'Processing...' : 'Process'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dataRightsRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No data rights requests found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 