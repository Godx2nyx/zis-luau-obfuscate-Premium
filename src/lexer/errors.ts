/**
 * Zis Luau Obfuscate Premium v0.1
 * Lexer errors
 */

import type { SourcePosition } from "../tokens";

export class LexerError extends Error {
    public readonly position: SourcePosition;

    constructor(
        message: string,
        position: SourcePosition,
    ) {
        super(
            `Lexer error at ${position.line}:${position.column}: ${message}`,
        );

        this.name = "LexerError";
        this.position = position;
    }
}
