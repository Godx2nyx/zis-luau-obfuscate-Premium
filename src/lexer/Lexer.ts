/**
 * Zis Luau Obfuscate Premium v0.1
 *
 * Standalone Luau lexer.
 *
 * This lexer is intentionally implemented from scratch.
 */

import {
    IdentifierToken,
    Keywords,
    NumberToken,
    SourcePosition,
    StringToken,
    Token,
    TokenType,
    token,
} from "../tokens";

import { LexerError } from "./errors";

export interface LexerOptions {
    preserveNewlines?: boolean;
    allowUnicodeIdentifiers?: boolean;
}

const DEFAULT_OPTIONS: Required<LexerOptions> = {
    preserveNewlines: true,
    allowUnicodeIdentifiers: true,
};

export class Lexer {
    private readonly source: string;
    private readonly options: Required<LexerOptions>;

    private index = 0;
    private line = 1;
    private column = 1;

    constructor(
        source: string,
        options: LexerOptions = {},
    ) {
        this.source = source;
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }

    public tokenize(): Token[] {
        const result: Token[] = [];

        while (!this.eof()) {
            this.skipHorizontalWhitespace();

            if (this.eof()) {
                break;
            }

            if (this.isNewlineStart()) {
                const newline = this.readNewline();

                if (this.options.preserveNewlines) {
                    result.push(newline);
                }

                continue;
            }

            if (this.startsWith("--")) {
                this.readComment();
                continue;
            }

            const char = this.current();

            if (this.isIdentifierStart(char)) {
                result.push(this.readIdentifier());
                continue;
            }

            if (this.isDigit(char) || (char === "." && this.isDigit(this.peek()))) {
                result.push(this.readNumber());
                continue;
            }

            if (char === "\"" || char === "'") {
                result.push(this.readQuotedString());
                continue;
            }

            if (char === "[" && this.isLongStringStart()) {
                result.push(this.readLongString());
                continue;
            }

            result.push(this.readOperatorOrPunctuation());
        }

        const position = this.position();

        result.push(
            token(
                TokenType.EOF,
                null,
                "",
                position,
                position,
            ),
        );

        return result;
    }

    private eof(): boolean {
        return this.index >= this.source.length;
    }

    private current(): string {
        return this.source[this.index] ?? "";
    }

    private peek(offset = 1): string {
        return this.source[this.index + offset] ?? "";
    }

    private startsWith(value: string): boolean {
        return this.source.startsWith(value, this.index);
    }

    private position(): SourcePosition {
        return {
            offset: this.index,
            line: this.line,
            column: this.column,
        };
    }

    private advance(): string {
        const char = this.current();

        if (char === "") {
            return "";
        }

        this.index++;
        this.column++;

        return char;
    }

    private consume(value: string): void {
        if (!this.startsWith(value)) {
            throw new LexerError(
                `Expected "${value}"`,
                this.position(),
            );
        }

        for (let i = 0; i < value.length; i++) {
            this.advance();
        }
    }

    private isNewlineStart(): boolean {
        return this.current() === "\n" ||
            this.current() === "\r";
    }

    private readNewline(): Token {
        const start = this.position();

        let raw: string;

        if (this.startsWith("\r\n")) {
            raw = "\r\n";
            this.advance();
            this.advance();
        } else {
            raw = this.advance();
        }

        this.line++;
        this.column = 1;

        const end = this.position();

        return token(
            TokenType.NEWLINE,
            raw,
            raw,
            start,
            end,
        );
    }

    private skipHorizontalWhitespace(): void {
        while (!this.eof()) {
            const char = this.current();

            if (
                char === " " ||
                char === "\t" ||
                char === "\v" ||
                char === "\f"
            ) {
                this.advance();
                continue;
            }

            break;
        }
    }

    private readComment(): void {
        this.consume("--");

        if (this.isLongStringStart()) {
            this.readLongStringBody();
            return;
        }

        while (!this.eof() && !this.isNewlineStart()) {
            this.advance();
        }
    }

    private isIdentifierStart(char: string): boolean {
        if (!char) {
            return false;
        }

        if (
            char === "_" ||
            (char >= "a" && char <= "z") ||
            (char >= "A" && char <= "Z")
        ) {
            return true;
        }

        if (this.options.allowUnicodeIdentifiers) {
            return this.isUnicodeLetter(char);
        }

        return false;
    }

    private isIdentifierPart(char: string): boolean {
        if (this.isIdentifierStart(char)) {
            return true;
        }

        return char >= "0" && char <= "9";
    }

    private isUnicodeLetter(char: string): boolean {
        if (!char) {
            return false;
        }

        return /[\p{L}\p{Nl}]/u.test(char);
    }

    private readIdentifier(): IdentifierToken {
        const start = this.position();
        const begin = this.index;

        this.advance();

        while (!this.eof() && this.isIdentifierPart(this.current())) {
            this.advance();
        }

        const raw = this.source.slice(begin, this.index);

        const keyword = Keywords[raw];

        const end = this.position();

        if (keyword !== undefined) {
            return token(
                keyword,
                raw,
                raw,
                start,
                end,
            ) as IdentifierToken;
        }

        return token(
            TokenType.Identifier,
            raw,
            raw,
            start,
            end,
        );
    }

    private isDigit(char: string): boolean {
        return char >= "0" && char <= "9";
    }

    private readNumber(): NumberToken {
        const start = this.position();
        const begin = this.index;

        if (this.startsWith("0x") || this.startsWith("0X")) {
            this.advance();
            this.advance();

            this.readDigits(16, true);

            if (this.current() === ".") {
                this.advance();
                this.readDigits(16, false);
            }

            if (this.current() === "p" || this.current() === "P") {
                this.advance();

                if (this.current() === "+" || this.current() === "-") {
                    this.advance();
                }

                this.readDigits(10, true);
            }
        } else {
            this.readDigits(10, false);

            if (this.current() === ".") {
                this.advance();
                this.readDigits(10, false);
            }

            if (this.current() === "e" || this.current() === "E") {
                this.advance();

                if (this.current() === "+" || this.current() === "-") {
                    this.advance();
                }

                this.readDigits(10, true);
            }
        }

        const raw = this.source.slice(begin, this.index);

        const value = this.parseNumber(raw);

        const end = this.position();

        return token(
            TokenType.Number,
            value,
            raw,
            start,
            end,
        );
    }

    private readDigits(
        radix: number,
        required: boolean,
    ): void {
        const begin = this.index;

        while (!this.eof()) {
            const char = this.current();

            const valid =
                radix === 16
                    ? /^[0-9a-fA-F]$/.test(char)
                    : this.isDigit(char);

            if (!valid) {
                break;
            }

            this.advance();
        }

        if (required && begin === this.index) {
            throw new LexerError(
                "Expected digits",
                this.position(),
            );
        }
    }

    private parseNumber(raw: string): number {
        let value: number;

        if (/^0[xX]/.test(raw)) {
            value = Number(raw);
        } else {
            value = Number(raw);
        }

        if (!Number.isFinite(value)) {
            throw new LexerError(
                `Invalid numeric literal "${raw}"`,
                this.position(),
            );
        }

        return value;
    }

    private readQuotedString(): StringToken {
        const start = this.position();
        const quote = this.advance();

        let value = "";

        while (!this.eof()) {
            const char = this.current();

            if (char === quote) {
                this.advance();

                const end = this.position();

                const raw = this.source.slice(
                    start.offset,
                    end.offset,
                );

                return token(
                    TokenType.String,
                    value,
                    raw,
                    start,
                    end,
                );
            }

            if (this.isNewlineStart()) {
                throw new LexerError(
                    "Unterminated string literal",
                    this.position(),
                );
            }

            if (char === "\\") {
                value += this.readEscapeSequence();
                continue;
            }

            value += this.advance();
        }

        throw new LexerError(
            "Unterminated string literal",
            start,
        );
    }

    private readEscapeSequence(): string {
        this.advance();

        if (this.eof()) {
            throw new LexerError(
                "Unterminated escape sequence",
                this.position(),
            );
        }

        const char = this.advance();

        switch (char) {
            case "a":
                return "\x07";

            case "b":
                return "\b";

            case "f":
                return "\f";

            case "n":
                return "\n";

            case "r":
                return "\r";

            case "t":
                return "\t";

            case "v":
                return "\v";

            case "\\":
                return "\\";

            case "\"":
                return "\"";

            case "'":
                return "'";

            case "\n":
                this.line++;
                this.column = 1;
                return "\n";

            case "\r":
                if (this.current() === "\n") {
                    this.advance();
                }

                this.line++;
                this.column = 1;

                return "\n";

            case "x":
                return this.readHexEscape();

            case "u":
                return this.readUnicodeEscape();

            case "z":
                this.skipWhitespaceAfterEscape();
                return "";

            default:
                if (char >= "0" && char <= "9") {
                    return this.readDecimalEscape(char);
                }

                return char;
        }
    }

    private readHexEscape(): string {
        const first = this.advance();
        const second = this.advance();

        if (
            !/^[0-9a-fA-F]$/.test(first) ||
            !/^[0-9a-fA-F]$/.test(second)
        ) {
            throw new LexerError(
                "Invalid hexadecimal escape",
                this.position(),
            );
        }

        return String.fromCharCode(
            parseInt(first + second, 16),
        );
    }

    private readUnicodeEscape(): string {
        if (this.current() !== "{") {
            throw new LexerError(
                "Expected '{' after \\u",
                this.position(),
            );
        }

        this.advance();

        let hex = "";

        while (!this.eof() && this.current() !== "}") {
            const char = this.current();

            if (!/^[0-9a-fA-F]$/.test(char)) {
                throw new LexerError(
                    "Invalid Unicode escape",
                    this.position(),
                );
            }

            hex += this.advance();

            if (hex.length > 6) {
                throw new LexerError(
                    "Unicode escape is too long",
                    this.position(),
                );
            }
        }

        if (this.current() !== "}") {
            throw new LexerError(
                "Unterminated Unicode escape",
                this.position(),
            );
        }

        this.advance();

        const codePoint = parseInt(hex, 16);

        if (
            !Number.isFinite(codePoint) ||
            codePoint > 0x10FFFF
        ) {
            throw new LexerError(
                "Invalid Unicode code point",
                this.position(),
            );
        }

        return String.fromCodePoint(codePoint);
    }

    private readDecimalEscape(first: string): string {
        let digits = first;

        for (let i = 0; i < 2; i++) {
            const char = this.current();

            if (char < "0" || char > "9") {
                break;
            }

            digits += this.advance();
        }

        const value = Number(digits);

        if (value > 255) {
            throw new LexerError(
                "Decimal escape must be between 0 and 255",
                this.position(),
            );
        }

        return String.fromCharCode(value);
    }

    private skipWhitespaceAfterEscape(): void {
        while (!this.eof()) {
            const char = this.current();

            if (
                char === " " ||
                char === "\t" ||
                char === "\v" ||
                char === "\f"
            ) {
                this.advance();
                continue;
            }

            if (char === "\n" || char === "\r") {
                this.readNewline();
                continue;
            }

            break;
        }
    }

    private isLongStringStart(): boolean {
        if (this.current() !== "[") {
            return false;
        }

        let i = this.index + 1;

        while (this.source[i] === "=") {
            i++;
        }

        return this.source[i] === "[";
    }

    private getLongBracketLevel(): number {
        if (this.current() !== "[") {
            return -1;
        }

        let i = this.index + 1;
        let level = 0;

        while (this.source[i] === "=") {
            level++;
            i++;
        }

        return this.source[i] === "[" ? level : -1;
    }

    private readLongString(): StringToken {
        const start = this.position();
        const begin = this.index;

        const level = this.getLongBracketLevel();

        if (level < 0) {
            throw new LexerError(
                "Invalid long string delimiter",
                this.position(),
            );
        }

        this.advance();

        for (let i = 0; i < level; i++) {
            this.advance();
        }

        this.advance();

        let value = "";

        if (this.current() === "\r" || this.current() === "\n") {
            this.readNewline();
        }

        while (!this.eof()) {
            if (this.isLongStringEnd(level)) {
                this.advance();

                for (let i = 0; i < level; i++) {
                    this.advance();
                }

                this.advance();

                const end = this.position();

                const raw = this.source.slice(
                    begin,
                    this.index,
                );

                return token(
                    TokenType.String,
                    value,
                    raw,
                    start,
                    end,
                );
            }

            if (this.isNewlineStart()) {
                const newline = this.readNewline();
                value += newline.raw;
                continue;
            }

            value += this.advance();
        }

        throw new LexerError(
            "Unterminated long string",
            start,
        );
    }

    private readLongStringBody(): void {
        const level = this.getLongBracketLevel();

        if (level < 0) {
            return;
        }

        this.advance();

        for (let i = 0; i < level; i++) {
            this.advance();
        }

        this.advance();

        while (!this.eof()) {
            if (this.isLongStringEnd(level)) {
                this.advance();

                for (let i = 0; i < level; i++) {
                    this.advance();
                }

                this.advance();

                return;
            }

            if (this.isNewlineStart()) {
                this.readNewline();
            } else {
                this.advance();
            }
        }

        throw new LexerError(
            "Unterminated long comment",
            this.position(),
        );
    }

    private isLongStringEnd(level: number): boolean {
        if (this.current() !== "]") {
            return false;
        }

        let i = this.index + 1;

        for (let n = 0; n < level; n++) {
            if (this.source[i] !== "=") {
                return false;
            }

            i++;
        }

        return this.source[i] === "]";
    }

    private readOperatorOrPunctuation(): Token {
        const start = this.position();

        const operators: Array<[string, TokenType]> = [
            ["//=", TokenType.FloorDivideAssign],
            ["==", TokenType.Equal],
            ["~=", TokenType.NotEqual],
            ["<=", TokenType.LessEqual],
            [">=", TokenType.GreaterEqual],
            ["//", TokenType.FloorDivide],
            ["..=", TokenType.PlusAssign],
            ["+=", TokenType.PlusAssign],
            ["-=", TokenType.MinusAssign],
            ["*=", TokenType.MultiplyAssign],
            ["/=", TokenType.DivideAssign],
            ["%=", TokenType.ModuloAssign],
            ["^=", TokenType.PowerAssign],
            ["::", TokenType.DoubleColon],
            ["...", TokenType.Vararg],
            ["->", TokenType.Arrow],
            ["..", TokenType.Dot],
        ];

        for (const [raw, type] of operators) {
            if (this.startsWith(raw)) {
                this.consume(raw);

                return token(
                    type,
                    raw,
                    raw,
                    start,
                    this.position(),
                );
            }
        }

        const char = this.current();

        const single: Record<string, TokenType> = {
            "+": TokenType.Plus,
            "-": TokenType.Minus,
            "*": TokenType.Multiply,
            "/": TokenType.Divide,
            "%": TokenType.Modulo,
            "^": TokenType.Power,

            "<": TokenType.Less,
            ">": TokenType.Greater,
            "=": TokenType.Assign,

            "(": TokenType.LeftParen,
            ")": TokenType.RightParen,

            "{": TokenType.LeftBrace,
            "}": TokenType.RightBrace,

            "[": TokenType.LeftBracket,
            "]": TokenType.RightBracket,

            ",": TokenType.Comma,
            ".": TokenType.Dot,
            ":": TokenType.Colon,
            ";": TokenType.Semicolon,

            "?": TokenType.Question,
        };

        const type = single[char];

        if (type === undefined) {
            throw new LexerError(
                `Unexpected character "${char}"`,
                start,
            );
        }

        this.advance();

        return token(
            type,
            char,
            char,
            start,
            this.position(),
        );
    }
  }
