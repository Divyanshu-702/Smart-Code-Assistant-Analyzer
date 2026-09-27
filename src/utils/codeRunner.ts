export interface ExecutionResult {
  success: boolean;
  logs: string[];
  result?: any;
  error?: string;
  executionTimeMs: number;
}

export function executeCodeInWorker(code: string, timeoutMs: number = 3000): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const workerScript = `
      self.onmessage = function(e) {
        const codeToRun = e.data;
        const logs = [];
        
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
          logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        };
        console.error = (...args) => {
          logs.push('[ERROR] ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        };
        console.warn = (...args) => {
          logs.push('[WARN] ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        };

        const startTime = performance.now();
        try {
          const wrappedCode = \`
            (function() {
              \${codeToRun}
            })();
          \`;
          const result = eval(wrappedCode);
          const endTime = performance.now();
          
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;

          self.postMessage({
            success: true,
            logs,
            result: result !== undefined ? (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)) : undefined,
            executionTimeMs: Math.round(endTime - startTime)
          });
        } catch (err) {
          const endTime = performance.now();
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;

          self.postMessage({
            success: false,
            logs,
            error: err.message || String(err),
            executionTimeMs: Math.round(endTime - startTime)
          });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    let timer: any = null;

    worker.onmessage = (event) => {
      if (timer) clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(event.data);
    };

    worker.onerror = (err) => {
      if (timer) clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        success: false,
        logs: [],
        error: err.message || 'Worker runtime error',
        executionTimeMs: 0
      });
    };

    timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        success: false,
        logs: ['Execution timed out after ' + timeoutMs + 'ms (Infinite loop protection triggered).'],
        error: 'Execution Timeout',
        executionTimeMs: timeoutMs
      });
    }, timeoutMs);

    worker.postMessage(code);
  });
}
