import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AuthErrorAlert({ onRefresh, onLogin }) {
  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Session Expired</AlertTitle>
      <AlertDescription className="text-red-700">
        <div className="space-y-2">
          <p>Token autentikasi Anda telah expired. Silakan login ulang untuk melanjutkan.</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              onClick={onLogin}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Login Ulang
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
