/** Test-only adapter for browser workers in Node. Does not test browser origin/CSP/renderer. */
import {parentPort,workerData} from 'node:worker_threads';
globalThis.self=globalThis;
globalThis.postMessage=value=>parentPort.postMessage(value);
parentPort.on('message',data=>globalThis.onmessage?.({data}));
await import(workerData.module);
parentPort.postMessage({type:'harness-ready'});
