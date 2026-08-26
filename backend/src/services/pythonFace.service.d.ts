export interface PythonFaceResult {
    verified: boolean;
    score: number;
    distance: number;
    message: string;
    ref_face_found: boolean;
    live_face_found: boolean;
}
export declare function compareFacesWithPython(referenceImageUrl: string, liveSnapshotDataUrl: string): Promise<PythonFaceResult>;
//# sourceMappingURL=pythonFace.service.d.ts.map