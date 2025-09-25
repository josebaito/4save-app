// Configuração para resolver problemas de módulos ES/CommonJS

// Polyfill para exports se não estiver definido
if (typeof exports === 'undefined') {
  (global as Record<string, unknown>).exports = {};
}

// Polyfill para module se não estiver definido
if (typeof module === 'undefined') {
  (global as Record<string, unknown>).module = { exports: {} };
}

// Polyfill para require se não estiver definido
if (typeof require === 'undefined') {
  (global as Record<string, unknown>).require = (id: string) => {
    throw new Error(`Module ${id} not found`);
  };
}

export {};
