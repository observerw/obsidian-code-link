export type LangPackage = unknown;

export type NpmPackageMetadata = {
	"dist-tags": {
		latest: string;
	};
	versions: {
		[version: string]: {
			dist: {
				tarball: string;
			};
		};
	};
};
