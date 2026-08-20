import { Avatar, Style } from "./vendor/dicebear/core/index.js";

export const FALLBACK_AVATAR = "/assets/avatar-fallback.svg";
export const DEFAULT_AVATAR_STYLE = "bottts-neutral";

const STYLE_SOURCES = new Map([
	[DEFAULT_AVATAR_STYLE, "/assets/vendor/dicebear/styles/bottts-neutral.json"]
]);
const loadedStyles = new Map();
const renderedAvatars = new Map();

export async function preloadAvatarStyles() {
	await Promise.all([...STYLE_SOURCES].map(async ([styleName, source]) => {
		try {
			const response = await fetch(source, { cache: "force-cache" });
			if (!response.ok) {
				throw new Error(`Style request failed with status ${response.status}`);
			}
			loadedStyles.set(styleName, new Style(await response.json()));
		} catch (error) {
			console.error(`Avatar style ${styleName} could not be loaded.`, error);
		}
	}));
}

export function avatarFor(styleName, seed) {
	const style = loadedStyles.get(styleName);
	if (!style || !seed) {
		return FALLBACK_AVATAR;
	}
	const cacheKey = `${styleName}/${seed}`;
	let dataUri = renderedAvatars.get(cacheKey);
	if (!dataUri) {
		dataUri = new Avatar(style, { seed: String(seed) }).toDataUri();
		renderedAvatars.set(cacheKey, dataUri);
	}
	return dataUri;
}
