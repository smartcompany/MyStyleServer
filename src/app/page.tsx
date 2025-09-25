'use client';

import { useState, useEffect } from 'react';

interface AdConfig {
  ios_ad: string;
  android_ad: string;
  ios_banner_ad: string;
  android_banner_ad: string;
  ref: {
    ios: {
      initial_ad: string;
      rewarded_ad: string;
      banner_ad: string;
    };
    android: {
      initial_ad: string;
      rewarded_ad: string;
      banner_ad: string;
    };
  };
}

export default function Home() {
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdConfig();
  }, []);

  const fetchAdConfig = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch ad settings');
      }
      const data = await response.json();
      setAdConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateAdConfig = async () => {
    if (!adConfig) return;
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adConfig),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ad settings');
      }
      
      alert('Settings updated successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Ad Settings Management
        </h1>
        
        {adConfig && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Current Ad Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* iOS Settings */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-600 mb-3">iOS Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Initial Ad
                    </label>
                    <input
                      type="text"
                      value={adConfig.ref.ios.initial_ad}
                      onChange={(e) => setAdConfig({
                        ...adConfig,
                        ref: {
                          ...adConfig.ref,
                          ios: {
                            ...adConfig.ref.ios,
                            initial_ad: e.target.value
                          }
                        }
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rewarded Ad
                    </label>
                    <input
                      type="text"
                      value={adConfig.ref.ios.rewarded_ad}
                      onChange={(e) => setAdConfig({
                        ...adConfig,
                        ref: {
                          ...adConfig.ref,
                          ios: {
                            ...adConfig.ref.ios,
                            rewarded_ad: e.target.value
                          }
                        }
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Banner Ad
                    </label>
                    <input
                      type="text"
                      value={adConfig.ref.ios.banner_ad}
                      onChange={(e) => setAdConfig({
                        ...adConfig,
                        ref: {
                          ...adConfig.ref,
                          ios: {
                            ...adConfig.ref.ios,
                            banner_ad: e.target.value
                          }
                        }
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Android Settings */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-600 mb-3">Android Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Initial Ad
                    </label>
                    <input
                      type="text"
                      value={adConfig.ref.android.initial_ad}
                      onChange={(e) => setAdConfig({
                        ...adConfig,
                        ref: {
                          ...adConfig.ref,
                          android: {
                            ...adConfig.ref.android,
                            initial_ad: e.target.value
                          }
                        }
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rewarded Ad
                    </label>
                    <input
                      type="text"
                      value={adConfig.ref.android.rewarded_ad}
                      onChange={(e) => setAdConfig({
                        ...adConfig,
                        ref: {
                          ...adConfig.ref,
                          android: {
                            ...adConfig.ref.android,
                            rewarded_ad: e.target.value
                          }
                        }
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Banner Ad
                    </label>
                    <input
                      type="text"
                      value={adConfig.ref.android.banner_ad}
                      onChange={(e) => setAdConfig({
                        ...adConfig,
                        ref: {
                          ...adConfig.ref,
                          android: {
                            ...adConfig.ref.android,
                            banner_ad: e.target.value
                          }
                        }
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={fetchAdConfig}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Refresh
              </button>
              <button
                onClick={updateAdConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Settings
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">GET</span>
              <code className="bg-gray-100 px-2 py-1 rounded">/api/settings</code>
              <span className="text-gray-600">- Get ad configuration</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">POST</span>
              <code className="bg-gray-100 px-2 py-1 rounded">/api/settings</code>
              <span className="text-gray-600">- Update ad configuration</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">GET</span>
              <code className="bg-gray-100 px-2 py-1 rounded">/api/health</code>
              <span className="text-gray-600">- Health check</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}