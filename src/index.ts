type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key : string ]: JsonValue };
type JsonArray = JsonValue[];

class Parser {
    private pos = 0;
    constructor(private input : string) {}

    public parse(): JsonValue {
        this.consumeWhitespace();

        const result = this.parseValue();

        this.consumeWhitespace();

        if (this.hasNext()) {
            throw new Error(`Unexpected token at position ${this.pos}-${this.currentToken()}`);
        }

        return result;
    }

    private consumeWhitespace(): void {
        while (/\s/.test(this.currentToken())) {
            this.consume();
        }
    }

    private hasNext(): boolean {
        this.consumeWhitespace();
        return this.currentToken() !== undefined && this.currentToken() !== '';
    }

    private currentToken(): string {
        return this.input.charAt(this.pos);
    }

    private parseValue() : JsonValue
    {
        switch (this.currentToken()) {
          // If the current token is an opening brace, parse an object
            case '{':
                return this.parseObject();
          // If the current token is an opening bracket, parse an array
            case '[':
                return this.parseArray();
          // If the current token is a string literal, parse a string
            case '"':
                return this.parseString();
          // If the current token is a minus sign or a digit, parse a number
            case '-':
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                return this.parseNumber();
          // If the current token is the 'true' literal, return true
            case 't':
                return this.parseTrue();
          // If the current token is the 'false' literal, return false
            case 'f':
                return this.parseFalse();
          // If the current token is the 'null' literal, return null
            case 'n':
                return this.parseNull();
          // Otherwise, the JSON value is invalid
            default:
                throw new Error(`Invalid JSON value at position ${this.pos}`);
        }
    }

    private parseObject() {
        const obj: JsonObject = {};

        this.consume('{');
        while (this.currentToken() !== '}') {
            const { key, value } = this.parsePair();
            obj[key] = value;

            if (this.currentToken() === ',') {
                this.consume(',');
            } else if (this.currentToken() !== '}') {
                throw new Error(`Invalid object at position ${this.pos}`);
            }
        }

        this.consume('}');

        return obj;
    }

    private parsePair() : { key : string, value : JsonValue }
    {
        const key = this.parseString();

        this.consume(':');

        const value = this.parseValue();

        return { key, value };
    }

    private parseArray() : JsonArray
    {
        const arr : JsonArray = [];

        this.consume('[');

        while (this.currentToken() !== ']') {
            const value = this.parseValue();
            arr.push(value);

            if (this.currentToken() === ",") {
                this.consume(",");
            } else if (this.currentToken() !== "]") {
                throw new Error(`Invalid array at position ${this.pos}`);
            }
        }

        this.consume(']');

        return arr;
    }

    private parseString(): string {
        let str = '';

        // Consume opening quote
        this.consume('"');

        // Parse string characters
        while (this.currentToken() !== '"') {
            if (this.currentToken() === '\\') {
                str += this.parseEscape();
            } else {
                str += this.currentToken();
                this.pos++;
            }
        }

        // Consume closing quote
        this.consume('"');

        return str;
    }

    private parseNumber(): number {
        let str = '';

        // If the number is negative, add the minus sign to the string and consume the token
        if (this.currentToken() === '-') {
            str += '-';
            this.consume('-');
        }

        // Parse the integer part of the number
        str += this.parseDigits();

        // If the number has a fractional part, parse it
        if (this.currentToken() === '.') {
            str += '.';
            this.consume('.');
            str += this.parseDigits();
        }

        // If the number has an exponent, parse it
        if (this.currentToken() === 'e' || this.currentToken() === 'E') {
            str += this.currentToken();
            this.consume();

            if (this.currentToken() === '+' || this.currentToken() === '-') {
                str += this.currentToken();
                this.consume();
            }

            str += this.parseDigits();
        }

        // Convert the parsed string to a number and return it
        return parseFloat(str);
    }

    private parseDigits(): string {
        let str = '';

        // If the first digit is zero, add it to the string and consume the token
        if (this.currentToken() === '0') {
            str += this.currentToken();
            this.consume();
        }
        // If the first digit is between 1 and 9, parse the rest of the digits
        else if (this.currentToken() >= '1' && this.currentToken() <= '9') {
            str += this.currentToken();
            this.consume();

            while (this.currentToken() >= '0' && this.currentToken() <= '9') {
                str += this.currentToken();
                this.consume();
            }
        }
        // Otherwise, the JSON number is invalid
        else {
            throw new Error(`Invalid JSON number at position ${this.pos}`);
        }

        // Return the parsed string of digits
        return str;
    }

    private parseEscape(): string {
        // Consume the backslash
        this.consume('\\');

        switch (this.currentToken()) {
          // If the escape sequence is a double quote, backslash, or forward slash, return the corresponding character
            case '"':
            case '\\':
            case '/':
                const c = this.currentToken();
                this.consume();
                return c;
          // If the escape sequence is a backspace, return the corresponding character
            case 'b':
                this.consume();
                return '\b';
          // If the escape sequence is a form feed, return the corresponding character
            case 'f':
                this.consume();
                return '\f';
          // If the escape sequence is a newline, return the corresponding character
            case 'n':
                this.consume();
                return '\n';
          // If the escape sequence is a carriage return, return the corresponding character
            case 'r':
                this.consume();
                return '\r';
          // If the escape sequence is a tab, return the corresponding character
            case 't':
                this.consume();
                return '\t';
           // If the escape sequence is a Unicode code point, parse it and return the corresponding character
            case 'u':
                this.consume();
                const code = parseInt(this.input.substr(this.pos, 4), 16);

                if (isNaN(code)) {
                    throw new Error(`Invalid Unicode escape sequence at position ${this.pos}`);
                }

                this.pos += 4;

                return String.fromCharCode(code);
           // Otherwise, the JSON escape sequence is invalid
            default:
                throw new Error(`Invalid escape sequence at position ${this.pos}`);
        }
    }

    private parseTrue(): true {
        this.consume('t');
        this.consume('r');
        this.consume('u');
        this.consume('e');
        return true;
    }

    private parseFalse(): false {
        this.consume('f');
        this.consume('a');
        this.consume('l');
        this.consume('s');
        this.consume('e');
        return false;
    }

    private parseNull(): null {
        this.consume('n');
        this.consume('u');
        this.consume('l');
        this.consume('l');
        return null;
    }

    private consume(expected?: string): void {
        if (expected && this.currentToken() !== expected) {
            throw new Error(`Expected ${expected} at position ${this.pos}`);
        }

        this.pos++;

        // Skip over any whitespace characters
        while (
          this.currentToken() === " " ||
          this.currentToken() === "\t" ||
          this.currentToken() === "\n" ||
          this.currentToken() === "\r"
          ) {
            this.pos++;
        }
    }

    private optionalConsume(expected: string): boolean {
        if (this.currentToken() === expected) {
            this.pos++;
            // Skip over any whitespace characters
            while (
              this.currentToken() === " " ||
              this.currentToken() === "\t" ||
              this.currentToken() === "\n" ||
              this.currentToken() === "\r"
              ) {
                this.pos++;
            }

            return true;
        }

        return false;
    }
}

export default new class EJson {
    decode<T>(json : string): T {
        const parser = new Parser(json);
        return parser.parse() as T;
    }
}
