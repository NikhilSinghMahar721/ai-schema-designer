/**
 * AI service — the ONLY file that calls the AI provider.
 *
 * Responsibilities:
 * - Initialize the Google GenAI client
 * - Call generateContent with timeout
 * - Parse the response (strip code fences, JSON.parse, Zod, semantic validation)
 * - Retry up to 2 times, feeding validation errors back to the model
 * - Map provider errors to safe HTTP exceptions
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  UnprocessableEntityException,
  BadGatewayException,
  RequestTimeoutException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { SchemaZ } from '../schema/schema.types.js';
import type { Schema } from '../schema/schema.types.js';
import { validateSemantics, SchemaValidationError } from '../schema/schema.validator.js';
import { buildGeneratePrompt } from './prompts/generate.prompt.js';
import { buildRefinePrompt } from './prompts/refine.prompt.js';

/** Maximum number of retry attempts when the model returns invalid output. */
const MAX_RETRIES = 2;

/** Timeout for a single AI call in milliseconds (30 seconds). */
const AI_TIMEOUT_MS = 30_000;

/**
 * Mockable interface so tests never call the real API.
 * Any test can provide an alternative implementation of this interface.
 */
export interface AiClient {
  generate(description: string): Promise<Schema>;
  refine(schema: Schema, instruction: string): Promise<Schema>;
}

@Injectable()
export class AiService implements AiClient {
  private readonly logger = new Logger(AiService.name);
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY')!;
    this.model = this.configService.get<string>('GEMINI_MODEL')!;
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generate a schema from a natural-language description.
   */
  async generate(description: string): Promise<Schema> {
    const { systemInstruction, userMessage } = buildGeneratePrompt(description);
    return this.callWithRetry(systemInstruction, userMessage);
  }

  /**
   * Refine an existing schema with a user instruction.
   */
  async refine(schema: Schema, instruction: string): Promise<Schema> {
    const { systemInstruction, userMessage } = buildRefinePrompt(schema, instruction);
    return this.callWithRetry(systemInstruction, userMessage);
  }

  /**
   * Core loop: call the model, parse, validate, retry if invalid.
   */
  private async callWithRetry(
    systemInstruction: string,
    userMessage: string,
  ): Promise<Schema> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const prompt =
        attempt === 0
          ? userMessage
          : `${userMessage}\n\nYour previous response was invalid. Fix these errors and return corrected JSON only:\n${lastError}`;

      const rawText = await this.callModel(systemInstruction, prompt);
      const parseResult = this.parseAndValidate(rawText);

      if (parseResult.ok) {
        return parseResult.schema;
      }

      lastError = parseResult.error;
      this.logger.warn(
        `AI output validation failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError}`,
      );
    }

    throw new UnprocessableEntityException(
      'AI output is invalid after retries. Please try rephrasing your description.',
    );
  }

  /**
   * Single call to the AI provider with a timeout.
   * Maps provider errors to safe HTTP exceptions.
   */
  private async callModel(
    systemInstruction: string,
    userMessage: string,
  ): Promise<string> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      try {
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: userMessage,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
          // @ts-expect-error -- AbortSignal support may vary by SDK version
          signal: controller.signal,
        });

        const text = response.text;
        if (!text || text.trim().length === 0) {
          throw new BadGatewayException('AI returned an empty response');
        }

        return text;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error: unknown) {
      // Re-throw our own HTTP exceptions
      if (
        error instanceof UnprocessableEntityException ||
        error instanceof BadGatewayException ||
        error instanceof RequestTimeoutException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Abort = timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new RequestTimeoutException(
          'AI request timed out. Please try again.',
        );
      }

      // Log safely (never log the full prompt or API key)
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      this.logger.error(`AI provider error: ${message}`);

      throw new BadGatewayException(
        'AI service is temporarily unavailable. Please try again later.',
      );
    }
  }

  /**
   * Parse raw AI text into a validated Schema.
   * Steps: strip code fences → JSON.parse → Zod parse → semantic validation.
   */
  private parseAndValidate(raw: string): { ok: true; schema: Schema } | { ok: false; error: string } {
    // Step 1: Strip markdown code fences if present
    const cleaned = this.stripCodeFences(raw);

    // Step 2: JSON.parse
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { ok: false, error: `Invalid JSON: could not parse AI response` };
    }

    // Step 3: Zod structural validation
    const zodResult = SchemaZ.safeParse(parsed);
    if (!zodResult.success) {
      const issues = zodResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return { ok: false, error: `Schema structure invalid: ${issues}` };
    }

    // Step 4: Semantic validation
    try {
      validateSemantics(zodResult.data);
    } catch (err) {
      if (err instanceof SchemaValidationError) {
        return { ok: false, error: err.errors.join('; ') };
      }
      return { ok: false, error: 'Unknown semantic validation error' };
    }

    return { ok: true, schema: zodResult.data };
  }

  /**
   * Strips markdown code fences (```json ... ``` or ``` ... ```) from the response.
   */
  private stripCodeFences(text: string): string {
    let s = text.trim();

    // Remove opening fence: ```json or ```
    if (s.startsWith('```')) {
      const firstNewline = s.indexOf('\n');
      if (firstNewline !== -1) {
        s = s.slice(firstNewline + 1);
      }
    }

    // Remove closing fence
    if (s.endsWith('```')) {
      s = s.slice(0, -3);
    }

    return s.trim();
  }
}
