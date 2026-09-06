/**
 * Zis Luau Obfuscate Premium v0.1
 * Token definitions
 */

export enum TokenType {
    // ------------------------------------------------------------
    // End / trivia
    // ------------------------------------------------------------

    EOF = "EOF",
    NEWLINE = "NEWLINE",

    // ------------------------------------------------------------
    // Literals
    // ------------------------------------------------------------

    Identifier = "Identifier",
    Number = "Number",
    String = "String",

    // ------------------------------------------------------------
    // Keywords
    // ------------------------------------------------------------

    And = "And",
    Break = "Break",
    Do = "Do",
    Else = "Else",
    ElseIf = "ElseIf",
    End = "End",
    False = "False",
    For = "For",
    Function = "Function",
    If = "If",
    In = "In",
    Local = "Local",
    Nil = "Nil",
    Not = "Not",
    Or = "Or",
    Repeat = "Repeat",
    Return = "Return",
    Then = "Then",
    True = "True",
    Until = "Until",
    While = "While",

    // Luau / Lua additions
    Continue = "Continue",
    Type = "Type",
    Export = "Export",

    // ------------------------------------------------------------
    // Operators
    // ------------------------------------------------------------

    Plus = "Plus",
    Minus = "Minus",
    Multiply = "Multiply",
    Divide = "Divide",
    FloorDivide = "FloorDivide",
    Modulo = "Modulo",
    Power = "Power",

    Equal = "Equal",
    NotEqual = "NotEqual",
    Less = "Less",
    LessEqual = "LessEqual",
    Greater = "Greater",
    GreaterEqual = "GreaterEqual",

    Assign = "Assign",

    // ------------------------------------------------------------
    // Punctuation
    // ------------------------------------------------------------

    LeftParen = "LeftParen",
    RightParen = "RightParen",

    LeftBrace = "LeftBrace",
    RightBrace = "RightBrace",

    LeftBracket = "LeftBracket",
    RightBracket = "RightBracket",

    Comma = "Comma",
    Dot = "Dot",
    Colon = "Colon",
    Semicolon = "Semicolon",

    DoubleColon = "DoubleColon",

    Vararg = "Vararg",

    // ------------------------------------------------------------
    // Luau compound operators
    // ------------------------------------------------------------

    PlusAssign = "PlusAssign",
    MinusAssign = "MinusAssign",
    MultiplyAssign = "MultiplyAssign",
    DivideAssign = "DivideAssign",
    FloorDivideAssign = "FloorDivideAssign",
    ModuloAssign = "ModuloAssign",
    PowerAssign = "PowerAssign",

    // ------------------------------------------------------------
    // Type / syntax helpers
    // ------------------------------------------------------------

    Question = "Question",
    Arrow = "Arrow",
}

export interface SourcePosition {
    offset: number;
    line: number;
    column: number;
}

export interface SourceLocation {
    start: SourcePosition;
    end: SourcePosition;
}

export interface Token<T = unknown> {
    type: TokenType;
    value: T;
    raw: string;
    location: SourceLocation;
}

export type NumberToken = Token<number>;
export type StringToken = Token<string>;
export type IdentifierToken = Token<string>;

export const Keywords: Readonly<Record<string, TokenType>> = Object.freeze({
    and: TokenType.And,
    break: TokenType.Break,
    do: TokenType.Do,
    else: TokenType.Else,
    elseif: TokenType.ElseIf,
    end: TokenType.End,
    false: TokenType.False,
    for: TokenType.For,
    function: TokenType.Function,
    if: TokenType.If,
    in: TokenType.In,
    local: TokenType.Local,
    nil: TokenType.Nil,
    not: TokenType.Not,
    or: TokenType.Or,
    repeat: TokenType.Repeat,
    return: TokenType.Return,
    then: TokenType.Then,
    true: TokenType.True,
    until: TokenType.Until,
    while: TokenType.While,

    // Luau
    continue: TokenType.Continue,
    type: TokenType.Type,
    export: TokenType.Export,
});

export function isKeyword(value: string): boolean {
    return Object.prototype.hasOwnProperty.call(Keywords, value);
}

export function keywordType(value: string): TokenType | undefined {
    return Keywords[value];
}

export function token<T>(
    type: TokenType,
    value: T,
    raw: string,
    start: SourcePosition,
    end: SourcePosition,
): Token<T> {
    return {
        type,
        value,
        raw,
        location: {
            start,
            end,
        },
    };
  }
