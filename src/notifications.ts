import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Holding, Settings } from "./types";
import { dividendMonths, yen } from "./calc";

// FR-17 配当月リマインド（ローカル通知のみ・サーバー不使用＝プライバシー影響は通知権限だけ）。
// 端末内の payoutMonths から「今月は配当月」を、未来12か月ぶんだけ絶対日時で予約する。
// カレンダー繰り返しトリガーは Android で月指定が不安定なため、起動のたびに張り直す方式にしている。

const CHANNEL_ID = "dividend-reminders";

// フォアグラウンドでも通知を表示する。
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Android は通知チャンネルが必須。起動時に一度呼ぶ。
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "配当リマインド",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// 通知の許可を要求する。許可されたら true。
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// 配当月リマインドを張り直す。既存の予約を全消しし、ONのときだけ未来12か月ぶんを予約する。
// now はテスト・再現性のため引数で受ける（呼び出し側で new Date()）。
export async function rescheduleDividendReminders(
  holdings: Holding[],
  settings: Settings,
  fx: number,
  now: Date
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.notifyDividendMonth) return;

  const months = dividendMonths(holdings, fx);
  for (let i = 0; i < 12; i++) {
    // 各月の1日 9:00。当月ぶんが過ぎていれば来年の同月まで送らずスキップ（12か月窓で自然に拾う）。
    const fire = new Date(now.getFullYear(), now.getMonth() + i, 1, 9, 0, 0, 0);
    if (fire.getTime() <= now.getTime()) continue;
    const info = months[fire.getMonth()];
    if (info.count === 0) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "今月は配当月です",
        body: `${info.count}銘柄・想定 税引前 ${yen(info.amount)}`,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
    });
  }
}
