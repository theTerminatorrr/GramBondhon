declare module 'bullmq' {
  export type JobId = string | number;

  export interface ConnectionOptions {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number | null;
    enableReadyCheck?: boolean;
    [key: string]: unknown;
  }

  export interface QueueOptions {
    connection?: ConnectionOptions;
    prefix?: string;
    [key: string]: unknown;
  }

  export interface JobsOptions {
    jobId?: JobId;
    attempts?: number;
    backoff?: { type: 'exponential' | 'fixed'; delay?: number } | number;
    removeOnComplete?: number | { age?: number; count?: number };
    removeOnFail?: number | { age?: number; count?: number };
    [key: string]: unknown;
  }

  export interface Job<T = any> {
    id: string;
    name: string;
    data: T;
    [key: string]: unknown;
  }

  export class Queue<T = any, R = any, N extends string = string> {
    constructor(name: string, opts?: QueueOptions);
    add(name: string, data: T, opts?: JobsOptions): Promise<Job<T>>;
    close(): Promise<void>;
  }

  export interface WorkerOptions {
    connection?: ConnectionOptions;
    concurrency?: number;
    prefix?: string;
    [key: string]: unknown;
  }

  export class Worker<T = any, R = any, N extends string = string> {
    constructor(
      name: string,
      processor: (job: Job<T>) => Promise<R> | void,
      opts?: WorkerOptions,
    );
    on(event: 'completed' | 'failed' | 'error', listener: (...args: any[]) => void): this;
    close(): Promise<void>;
  }
}