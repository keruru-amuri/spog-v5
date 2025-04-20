'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

/**
 * API Documentation page
 * Displays the Swagger UI for the API documentation
 */
export default function ApiDocs() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    // Fetch the OpenAPI specification
    fetch('/api/api-docs')
      .then((response) => response.json())
      .then((data) => setSpec(data))
      .catch((error) => console.error('Error loading API docs:', error));

    // Add custom styles for Swagger UI
    const style = document.createElement('style');
    style.innerHTML = `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { background-color: #f9fafb; box-shadow: none }
      .swagger-ui .opblock-tag { font-size: 18px; border-bottom: 1px solid #e5e7eb }
      .swagger-ui .opblock { border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1) }
      .swagger-ui .opblock .opblock-summary { padding: 8px 16px }
      .swagger-ui .opblock-tag:hover,
      .swagger-ui .opblock-tag:focus { background-color: #f3f4f6 }
      .swagger-ui .btn.authorize { background-color: #3b82f6; border-color: #3b82f6 }
      .swagger-ui .btn.authorize svg { fill: #fff }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">SPOG Inventory Management API Documentation</h1>
        <p className="text-gray-600 mb-4">
          This documentation provides details about the API endpoints available in the SPOG Inventory Management system.
          Use the endpoints below to interact with the system programmatically.
        </p>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Base URL: /api</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Authentication: Bearer Token</span>
        </div>
      </div>

      {spec ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <SwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={-1}
            displayRequestDuration={true}
            filter={true}
          />
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
