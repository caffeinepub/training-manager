// Auto-generated backend stub — no Motoko backend available.
// The app uses localStorage as a mock data store instead.
// This file satisfies TypeScript imports in config.ts and useActor.ts.

import type { Identity } from "@icp-sdk/core/agent";

export type backendInterface = {
  _initializeAccessControlWithSecret: (token: string) => Promise<void>;
};

export type AgentOptions = {
  identity?: Identity | Promise<Identity>;
  host?: string;
  [key: string]: unknown;
};

export type CreateActorOptions = {
  agentOptions?: AgentOptions;
  [key: string]: unknown;
};

type UploadFileFn = (file: ExternalBlob) => Promise<Uint8Array>;
type DownloadFileFn = (bytes: Uint8Array) => Promise<ExternalBlob>;

export class ExternalBlob {
  private url?: string;
  private bytes?: Uint8Array;
  public onProgress?: (percentage: number) => void;

  constructor(data?: { url?: string; bytes?: Uint8Array }) {
    this.url = data?.url;
    this.bytes = data?.bytes;
  }

  static fromURL(url: string): ExternalBlob {
    return new ExternalBlob({ url });
  }

  async getBytes(): Promise<Uint8Array> {
    if (this.bytes) return this.bytes;
    if (this.url) {
      const res = await fetch(this.url);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
    return new Uint8Array();
  }

  getURL(): string | undefined {
    return this.url;
  }
}

export async function createActor(
  _canisterId: string,
  _uploadFile?: UploadFileFn,
  _downloadFile?: DownloadFileFn,
  _options?: CreateActorOptions
): Promise<backendInterface> {
  return {
    _initializeAccessControlWithSecret: async (_token: string) => {},
  };
}
