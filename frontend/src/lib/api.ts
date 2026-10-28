/**
 * Typed API client for calling backend endpoints.
 * All requests use relative URLs (/api/*) which Next.js rewrites to BACKEND_URL.
 * Standardizes error parsing according to the backend error envelope contract:
 *   { error: { code: string, message: string } }
 */

import type { Schema, Dialect, ApiErrorResponse } from '../features/designer/types';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly cookies for session authentication
  });

  if (!res.ok) {
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = `Request failed with status ${res.status}`;

    try {
      const errorJson = (await res.json()) as ApiErrorResponse;
      if (errorJson.error) {
        errorCode = errorJson.error.code || errorCode;
        errorMessage = errorJson.error.message || errorMessage;
      }
    } catch {
      // Body was not JSON (e.g. 504 Gateway Timeout HTML from upstream proxy)
      errorMessage = res.statusText || errorMessage;
    }

    throw new ApiClientError(errorCode, errorMessage, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  /**
   * Health check
   */
  async getHealth(): Promise<{ status: string }> {
    return request<{ status: string }>('/api/health');
  },

  /**
   * Generate a schema from natural-language description
   */
  async generateSchema(
    description: string,
    dialect: Dialect = 'postgresql',
  ): Promise<Schema> {
    const data = await request<{ schema: Schema }>('/api/schema/generate', {
      method: 'POST',
      body: JSON.stringify({ description, dialect }),
    });
    return data.schema;
  },

  /**
   * Refine an existing schema using textual instruction
   */
  async refineSchema(
    schema: Schema,
    instruction: string,
  ): Promise<Schema> {
    const data = await request<{ schema: Schema }>('/api/schema/refine', {
      method: 'POST',
      body: JSON.stringify({ schema, instruction }),
    });
    return data.schema;
  },

  /**
   * Export schema to SQL DDL
   */
  async exportSql(schema: Schema, dialect: Dialect): Promise<string> {
    const data = await request<{ sql: string }>('/api/schema/export', {
      method: 'POST',
      body: JSON.stringify({ schema, dialect }),
    });
    return data.sql;
  },

  // ── Auth Endpoints ──────────────────────────────────────────────────────────

  async register(
    email: string,
    password: string,
  ): Promise<{ user: { id: string; email: string } }> {
    return request<{ user: { id: string; email: string } }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    );
  },

  async login(
    email: string,
    password: string,
  ): Promise<{ user: { id: string; email: string } }> {
    return request<{ user: { id: string; email: string } }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    );
  },

  async logout(): Promise<void> {
    await request<void>('/api/auth/logout', {
      method: 'POST',
    });
  },

  async getMe(): Promise<{ user: { id: string; email: string } }> {
    return request<{ user: { id: string; email: string } }>('/api/auth/me');
  },

  async deleteAccount(password: string): Promise<void> {
    await request<void>('/api/auth/me', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },

  // ── Saved Schemas Endpoints ─────────────────────────────────────────────────

  async listSavedSchemas(): Promise<{
    items: Array<{
      id: string;
      name: string;
      dialect: Dialect;
      updatedAt: string;
    }>;
  }> {
    return request<{
      items: Array<{
        id: string;
        name: string;
        dialect: Dialect;
        updatedAt: string;
      }>;
    }>('/api/saved-schemas');
  },

  async getSavedSchema(id: string): Promise<{
    item: {
      id: string;
      name: string;
      dialect: Dialect;
      schema: Schema;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return request<{
      item: {
        id: string;
        name: string;
        dialect: Dialect;
        schema: Schema;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/saved-schemas/${id}`);
  },

  async createSavedSchema(payload: {
    name: string;
    dialect: Dialect;
    schema: Schema;
  }): Promise<{
    item: {
      id: string;
      name: string;
      dialect: Dialect;
      schema: Schema;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return request<{
      item: {
        id: string;
        name: string;
        dialect: Dialect;
        schema: Schema;
        createdAt: string;
        updatedAt: string;
      };
    }>('/api/saved-schemas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSavedSchema(
    id: string,
    payload: {
      name?: string;
      dialect?: Dialect;
      schema?: Schema;
    },
  ): Promise<{
    item: {
      id: string;
      name: string;
      dialect: Dialect;
      schema: Schema;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return request<{
      item: {
        id: string;
        name: string;
        dialect: Dialect;
        schema: Schema;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/saved-schemas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteSavedSchema(id: string): Promise<void> {
    await request<void>(`/api/saved-schemas/${id}`, {
      method: 'DELETE',
    });
  },
};
