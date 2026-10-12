// Small readers for environment variables, so the config file stays easy to read.

export function readBooleanEnv(name: string, fallback: boolean): boolean {
    const value = process.env[name];

    if (value === undefined || value === '') {
        return fallback;
    }

    return value.toLowerCase() === 'true';
}

// "A@x.com, b@y.com" -> ['a@x.com', 'b@y.com']
export function readListEnv(name: string, fallback: string[] = []): string[] {
    const value = process.env[name];

    if (!value) {
        return fallback;
    }

    return value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0);
}