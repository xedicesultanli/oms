import React from 'react';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">System configuration and preferences</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
          <p className="text-gray-600 mb-6">
            This page will contain system configuration options, user preferences,
            and administrative settings.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• User account management</p>
            <p>• System preferences and configuration</p>
            <p>• Security settings and permissions</p>
            <p>• Backup and maintenance options</p>
          </div>
        </div>
      </div>
    </div>
  );
};