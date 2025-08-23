import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bug, 
  Code, 
  Globe, 
  Navigation, 
  Settings, 
  X,
  Copy,
  ExternalLink,
  RefreshCw,
  Terminal
} from 'lucide-react';

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('routes');
  const location = useLocation();
  const navigate = useNavigate();

  // All available routes from the project
  const allRoutes = [
    { path: '/', name: 'Login', category: 'Auth' },
    { path: '/dashboard', name: 'Dashboard', category: 'Main' },
    { path: '/register', name: 'Register', category: 'Auth' },
    { path: '/input-po', name: 'Input PO', category: 'Main' },
    { path: '/arap', name: 'AR / AP', category: 'Main' },
    { path: '/masterdata/jenis-barang', name: 'Jenis Barang', category: 'Masterdata' },
    { path: '/masterdata/bentuk-barang', name: 'Bentuk Barang', category: 'Masterdata' },
    { path: '/masterdata/grade-barang', name: 'Grade Barang', category: 'Masterdata' },
    { path: '/masterdata/item-barang', name: 'Item Barang', category: 'Masterdata' },
    { path: '/masterdata/jenis-biaya', name: 'Jenis Biaya', category: 'Masterdata' },
    { path: '/masterdata/jenis-mutasi-stock', name: 'Jenis Mutasi Stock', category: 'Masterdata' },
    { path: '/masterdata/supplier', name: 'Supplier', category: 'Masterdata' },
    { path: '/masterdata/pelanggan', name: 'Pelanggan', category: 'Masterdata' },
    { path: '/masterdata/gudang', name: 'Gudang', category: 'Masterdata' },
    { path: '/masterdata/pelaksana', name: 'Pelaksana', category: 'Masterdata' },
    { path: '/masterdata/jenis-transaksi-kas', name: 'Jenis Transaksi Kas', category: 'Masterdata' },
    { path: '/workshop', name: 'Workshop', category: 'Tools' },
    { path: '/fui', name: 'FUI', category: 'Tools' },
    { path: '/report', name: 'Report', category: 'Tools' },
    { path: '/cut-report', name: 'Cut Report', category: 'Tools' },
    { path: '/add-cut', name: 'Add Cut', category: 'Tools' },
    { path: '/potong', name: 'Potong', category: 'Tools' },
  ];

  // Group routes by category
  const groupedRoutes = allRoutes.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = [];
    }
    acc[route.category].push(route);
    return acc;
  }, {});

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const openInNewTab = (path) => {
    window.open(path, '_blank');
  };

  const reloadPage = () => {
    window.location.reload();
  };

  const openDevTools = () => {
    if (window.electronAPI) {
      window.electronAPI.openDevTools();
    } else {
      // Fallback for web
      console.log('DevTools can only be opened in Electron app');
    }
  };

  // Keyboard shortcut to toggle DevTools
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title="Development Tools (Ctrl+Shift+D)"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bug size={20} />
            <h2 className="text-lg font-semibold">Development Tools</h2>
            <span className="text-xs bg-blue-500 px-2 py-1 rounded">Ctrl+Shift+D</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'routes', name: 'Routes', icon: Navigation },
              { id: 'current', name: 'Current URL', icon: Globe },
              { id: 'tools', name: 'Tools', icon: Settings },
              { id: 'info', name: 'Info', icon: Code }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon size={16} />
                  {tab.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Routes Tab */}
          {activeTab === 'routes' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Routes</h3>
              <div className="space-y-4">
                {Object.entries(groupedRoutes).map(([category, routes]) => (
                  <div key={category}>
                    <h4 className="font-medium text-gray-700 mb-2 bg-gray-100 px-3 py-2 rounded">
                      {category} ({routes.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                      {routes.map((route) => (
                        <div
                          key={route.path}
                          className={`p-3 border rounded-lg transition-all ${
                            location.pathname === route.path
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{route.name}</div>
                              <div className="text-sm text-gray-500 font-mono">{route.path}</div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => navigate(route.path)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Navigate to this route"
                              >
                                <Navigation size={16} />
                              </button>
                              <button
                                onClick={() => copyToClipboard(route.path)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Copy path"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => openInNewTab(route.path)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Open in new tab"
                              >
                                <ExternalLink size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current URL Tab */}
          {activeTab === 'current' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Current URL Information</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Current Path</label>
                      <div className="font-mono text-lg bg-white p-2 rounded border">
                        {location.pathname}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hash</label>
                      <div className="font-mono text-lg bg-white p-2 rounded border">
                        {location.hash || 'None'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Search Params</label>
                    <div className="font-mono text-sm bg-white p-2 rounded border">
                      {location.search || 'None'}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(location.pathname)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Copy size={16} />
                    Copy Current Path
                  </button>
                  <button
                    onClick={reloadPage}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    <RefreshCw size={16} />
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Development Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={openDevTools}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <Terminal size={24} className="text-blue-600 mb-2" />
                  <div className="font-medium">Open DevTools</div>
                  <div className="text-sm text-gray-500">Open browser DevTools</div>
                </button>
                
                <button
                  onClick={reloadPage}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <RefreshCw size={24} className="text-blue-600 mb-2" />
                  <div className="font-medium">Reload Page</div>
                  <div className="text-sm text-gray-500">Hard refresh current page</div>
                </button>

                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <Copy size={24} className="text-blue-600 mb-2" />
                  <div className="font-medium">Copy Full URL</div>
                  <div className="text-sm text-gray-500">Copy complete URL to clipboard</div>
                </button>

                <button
                  onClick={() => window.open('https://github.com', '_blank')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <ExternalLink size={24} className="text-blue-600 mb-2" />
                  <div className="font-medium">Documentation</div>
                  <div className="text-sm text-gray-500">Open project docs</div>
                </button>
              </div>
            </div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Environment</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Node.js:</span> {process.version || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">NODE_ENV:</span> {process.env.NODE_ENV || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Platform:</span> {navigator.platform}
                    </div>
                    <div>
                      <span className="font-medium">User Agent:</span> {navigator.userAgent.split(' ')[0]}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Toggle DevTools:</span>
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Shift+D</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Toggle Browser DevTools:</span>
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F12</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Reload Page:</span>
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+R</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevTools;
