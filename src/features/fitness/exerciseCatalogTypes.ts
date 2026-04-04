export type ExerciseCatalogItem = {
  source: "exercisedb";
  externalExerciseId: string;
  name: string;
  target: string | null;
  equipment: string | null;
  bodyPart: string | null;
  secondaryMuscles: string[];
  instructions: string[];
  imageUrl: string | null;
  videoUrl: string | null;
};

export type ExerciseCatalogSearchParams = {
  query?: string;
  target?: string | null;
  equipment?: string | null;
  limit?: number;
};

export type ExerciseSwapParams = {
  currentExerciseId?: string | null;
  currentExerciseName?: string | null;
  target?: string | null;
  equipment?: string | null;
  limit?: number;
};

export type ExerciseCatalogFilters = {
  targets: string[];
  equipment: string[];
};

export type ExerciseImageParams = {
  exerciseId: string;
  resolution?: number;
};

export type ExerciseImageResult = {
  dataUrl: string;
  contentType: string;
};

export type ExercisePreviewParams = {
  exerciseId?: string | null;
  query?: string | null;
  target?: string | null;
  equipment?: string | null;
  resolution?: number;
};

export type ExercisePreviewResult = ExerciseImageResult & {
  exercise: ExerciseCatalogItem | null;
};
