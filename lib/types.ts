export type DemandKey =
  | "mind"
  | "skill"
  | "body"
  | "tactics"
  | "reasoning"
  | "reinforcement"
  | "nutrition";

export type NutritionKey =
  | "mealQuality"
  | "snackTiming"
  | "hydration"
  | "sleepRelation"
  | "conditionImpact"
  | "matchCondition";

export type PlayerProfile = {
  name: string;
  grade: string;
  dominantHand: string;
  playStyle: string;
  goal: string;
  guardianMemo: string;
};

export type PracticeLog = {
  id: string;
  date: string;
  durationMinutes: number;
  theme: string;
  menu: string;
  goodPoint: string;
  issue: string;
  nextAction: string;
  intensity: number;
};

export type MatchLog = {
  id: string;
  date: string;
  tournament: string;
  opponent: string;
  score: string;
  result: "win" | "lose" | "draw";
  goodPoint: string;
  issue: string;
  lesson: string;
};

export type DemandScores = Record<DemandKey, number>;
export type NutritionScores = Record<NutritionKey, number>;

export type DemandEvaluation = {
  id: string;
  date: string;
  scores: DemandScores;
  nutrition: NutritionScores;
  nutritionMemo: string;
  memo: string;
};

export type GrowthData = {
  profile: PlayerProfile;
  practiceLogs: PracticeLog[];
  matchLogs: MatchLog[];
  evaluations: DemandEvaluation[];
};

export type MonthlyReport = {
  growthPoints: string[];
  currentIssues: string[];
  nextPractice: string[];
  nutritionCondition: string[];
  guardianComment: string;
  coachComment: string;
};

export const demandLabels: Record<DemandKey, string> = {
  mind: "心",
  skill: "技",
  body: "体",
  tactics: "戦術",
  reasoning: "推論",
  reinforcement: "強化学習",
  nutrition: "栄養",
};

export const nutritionLabels: Record<NutritionKey, string> = {
  mealQuality: "食事の質",
  snackTiming: "練習前後の補食",
  hydration: "水分補給",
  sleepRelation: "睡眠との関係",
  conditionImpact: "体調への影響",
  matchCondition: "試合前後のコンディション",
};
