export declare function resolveSeedlingAssetUrl(path: string): string | undefined;
export declare const seedlingFixtureBundle: {
    manifestCandidate: {
        schemaVersion: number;
        packId: string;
        packVersion: string;
        name: {
            "zh-CN": string;
            en: string;
        };
        levels: ({
            levelId: string;
            threshold: number;
            stageName: {
                "zh-CN": string;
                en: string;
            };
            summary: {
                "zh-CN": string;
                en: string;
            };
            milestone: {
                "zh-CN": string;
                en: string;
            };
            sceneId: string;
            presentation: {
                scale: string;
                camera: string;
                milestone: string;
            };
            upgrade?: undefined;
            keepsakeId?: undefined;
        } | {
            levelId: string;
            threshold: number;
            stageName: {
                "zh-CN": string;
                en: string;
            };
            summary: {
                "zh-CN": string;
                en: string;
            };
            milestone: {
                "zh-CN": string;
                en: string;
            };
            sceneId: string;
            presentation: {
                scale: string;
                camera: string;
                milestone: string;
            };
            upgrade: {
                transition: string;
                reveal: string;
                celebration: string;
            };
            keepsakeId: string;
        })[];
        scenes: {
            sceneId: string;
            backgroundAssetId: string;
            layers: ({
                layerId: string;
                kind: string;
                assetId: string;
                placement: string;
                zOrder: number;
                population?: undefined;
            } | {
                layerId: string;
                kind: string;
                population: {
                    populationId: string;
                    logicalCount: number;
                    assetId: string;
                    density: string;
                    placement: string;
                    aggregateLabel: {
                        "zh-CN": string;
                        en: string;
                    };
                };
                placement: string;
                zOrder: number;
                assetId?: undefined;
            })[];
            transition: string;
            sceneLabel: {
                "zh-CN": string;
                en: string;
            };
        }[];
        assets: {
            assetId: string;
            path: string;
            format: string;
            role: string;
            width: number;
            height: number;
            byteSizeCompressed: number;
            altText: {
                "zh-CN": string;
                en: string;
            };
        }[];
        keepsakes: {
            keepsakeId: string;
            levelId: string;
            title: {
                "zh-CN": string;
                en: string;
            };
            accessDescription: {
                "zh-CN": string;
                en: string;
            };
            assetId: string;
        }[];
    };
    resolveAssetUrl: typeof resolveSeedlingAssetUrl;
};
//# sourceMappingURL=index.d.ts.map