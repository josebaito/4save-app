'use client';

import { useEffect } from 'react';

export function AdminTheme({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Força o dark mode em todas as páginas admin
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    
    // Override inline styles que possam estar forçando light mode
    const style = document.createElement('style');
    style.textContent = `
      /* Force dark theme for admin pages */
      .admin-page * {
        color-scheme: dark !important;
      }
      
      /* Override any light backgrounds */
      .admin-page .bg-white {
        background-color: rgb(30 41 59 / 0.5) !important;
        border-color: rgb(51 65 85 / 0.5) !important;
      }
      
      .admin-page .bg-gray-50 {
        background-color: rgb(30 41 59 / 0.3) !important;
      }
      
      .admin-page .bg-gray-100 {
        background-color: rgb(51 65 85 / 0.5) !important;
      }
      
      /* Override text colors */
      .admin-page .text-gray-900 {
        color: rgb(248 250 252) !important;
      }
      
      .admin-page .text-gray-800 {
        color: rgb(226 232 240) !important;
      }
      
      .admin-page .text-gray-700 {
        color: rgb(203 213 225) !important;
      }
      
      .admin-page .text-gray-600 {
        color: rgb(148 163 184) !important;
      }
      
      .admin-page .text-gray-500 {
        color: rgb(100 116 139) !important;
      }
      
      .admin-page .text-gray-400 {
        color: rgb(71 85 105) !important;
      }
      
      /* Override borders */
      .admin-page .border-gray-200 {
        border-color: rgb(51 65 85 / 0.5) !important;
      }
      
      .admin-page .border-gray-300 {
        border-color: rgb(71 85 105 / 0.5) !important;
      }
      
      /* Override badges and status colors for dark theme */
      .admin-page .bg-yellow-100 {
        background-color: rgb(202 138 4 / 0.2) !important;
        color: rgb(254 240 138) !important;
      }
      
      .admin-page .bg-blue-100 {
        background-color: rgb(59 130 246 / 0.2) !important;
        color: rgb(147 197 253) !important;
      }
      
      .admin-page .bg-green-100 {
        background-color: rgb(34 197 94 / 0.2) !important;
        color: rgb(134 239 172) !important;
      }
      
      .admin-page .bg-red-100 {
        background-color: rgb(239 68 68 / 0.2) !important;
        color: rgb(252 165 165) !important;
      }
      
      .admin-page .bg-orange-100 {
        background-color: rgb(249 115 22 / 0.2) !important;
        color: rgb(253 186 116) !important;
      }
      
      /* Input and form overrides */
      .admin-page input, 
      .admin-page textarea, 
      .admin-page select {
        background-color: rgb(51 65 85 / 0.5) !important;
        border-color: rgb(71 85 105 / 0.5) !important;
        color: rgb(248 250 252) !important;
      }
      
      .admin-page input::placeholder,
      .admin-page textarea::placeholder {
        color: rgb(148 163 184) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <div className="admin-page">{children}</div>;
}