export class Encoder {
    encode(input : unknown) : string {
        if (!Array.isArray(input) && typeof input !== 'object') {
            throw new Error('Invalid Json, json should start with [] or {}');
        }

        return this.encodeValue(input) as string;
    }

    private encodeValue(value : unknown) {
        if (Array.isArray(value)) {
            return this.encodeArray(value);
        }

        if (value === null || value === undefined) {
            return 'null';
        }

        if (value instanceof Date) {
            return this.withDoubleQuotes(value.toString());
        }

        if (!isNaN(+value)) {
            return value;
        }

        switch (typeof value) {
            case 'string':
                return `"${value}"`;
            case 'object':
                return this.encodeObject(value);
            case 'boolean':
                return `"${value.toString()}"`;
            case 'function':
                return this.encodeFunction(value as () => unknown);
        }

        throw new Error(`Unexpected value: ${value}`);
    }

    private encodeFunction(val : () => unknown) : unknown {
        const result = val();

        return this.encodeValue(result);
    }

    private withDoubleQuotes(value : string) {
        return `"${value}"`;
    }

    private encodeObject(value : object) : string {
        if ('toString' in value) {
            const objectToString = value.toString();

            if (objectToString !== '[object Object]') {
                return this.withDoubleQuotes(value.toString());
            }
        }


        let obj = '{';

        const entries = Object.entries(value);

        let i = 0;
        for (const [key, value] of entries) {
            const val = this.encodeValue(value);

            if (typeof val === 'function') {
                console.log(val);
                continue;
            }

            const pair = `"${key}":${val}`;
            obj += pair;
            i++;

            if (i <= (entries.length - 1)) {
                obj += ',';
            } else {
                obj += '}';
            }
        }

        return obj;
    }

    private encodeArray(values : unknown[]) : string {
        let arr = '[';

        let i = 0;
        for (const value of values) {
            const val = this.encodeValue(value);

            if (typeof val === 'function') continue;

            arr += val;

            i++;

            if (i <= values.length - 1) {
                arr += ',';
            } else {
                arr += ']'
            }
        }

        return arr;
    }
}
