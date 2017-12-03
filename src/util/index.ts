
/**
 * Remove all the extra spaces in a string.
 *
 * @export
 * @param {string} original the string that needs to be cleaned
 * @returns {Promise<string>} cleaned string, with extra spaces removed
 */
export async function eatSpaces(original: string): Promise<string> {
    return original.trim().replace(/\s+/g, " ");
}

export function title(original: string): string {
	return `${original[0].toUpperCase()}${original.substr(1)}`;
}
