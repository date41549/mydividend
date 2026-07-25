import AsyncStorage from "@react-native-async-storage/async-storage";
import { Holding, Goal, Settings, DEFAULT_SETTINGS } from "./types";

// 端末内保存のキー。スキーマ変更に備えてバージョン番号を付ける。
const HOLDINGS_KEY = "holdings/v1";
const GOALS_KEY = "goals/v1";
const SETTINGS_KEY = "settings/v1";

// 保有一覧を読み込む。未保存・壊れている場合は空配列。
export async function loadHoldings(): Promise<Holding[]> {
  try {
    const raw = await AsyncStorage.getItem(HOLDINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Holding[]) : [];
  } catch {
    return [];
  }
}

// 保有一覧を保存する。
export async function saveHoldings(holdings: Holding[]): Promise<void> {
  await AsyncStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
}

// 目標を読み込む。未設定なら null。
export async function loadGoal(): Promise<Goal | null> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Goal;
  } catch {
    return null;
  }
}

// 目標を保存する。
export async function saveGoal(goal: Goal): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goal));
}

// 設定を読み込む。未設定なら既定値。
export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// 設定を保存する。
export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// 追加時のID生成（端末内で一意であれば十分）。
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
