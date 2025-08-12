'use client';

import { useState, useEffect } from 'react';
import { CameraTest } from '@/components/CameraTest';

export default function TestCameraPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Teste de Câmera</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Câmera</h1>
      <CameraTest />
    </div>
  );
} 