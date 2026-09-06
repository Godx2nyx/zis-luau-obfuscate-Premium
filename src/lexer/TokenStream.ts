/**
 * Zis Luau Obfuscate Premium v0.1
 */

import {
    Token,
    TokenType,
} from "../tokens";

export class TokenStream {
    private readonly tokens: Token[];
    private index = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    public current(): Token {
        return this.tokens[this.index] ?? this.tokens[this.tokens.length - 1];
    }

    public peek(offset = 1): Token {
        const position = this.index + offset;

        return this.tokens[position] ??
            this.tokens[this.tokens.length - 1];
    }

    public advance(): Token {
        const result = this.current();

        if (this.index < this.tokens.length - 1) {
            this.index++;
        }

        return result;
    }

    public consume(type: TokenType): Token {
        const current = this.current();

        if (current.type !== type) {
            throw new Error(
                `Expected ${type}, got ${current.type}`,
            );
        }

        return this.advance();
    }

    public match(...types: TokenType[]): boolean {
        return types.includes(this.current().type);
    }

    public isEOF(): boolean {
        return this.current().type === TokenType.EOF;
    }

    public position(): number {
        return this.index;
    }

    public reset(position: number): void {
        if (position < 0 || position >= this.tokens.length) {
            throw new RangeError("Invalid token stream position");
        }

        this.index = position;
    }

    public all(): readonly Token[] {
        return this.tokens;
    }
}
