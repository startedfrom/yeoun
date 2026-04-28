import * as Haptics from 'expo-haptics';

/**
 * Expo Web·시뮬레이터 등 Haptics 미지원 환경에서도 예외를 내지 않음.
 * (미지원 시 expo가 동기로 UnavailabilityError를 던지는 경우가 있어 try/catch 필요)
 */
export function safeHapticImpact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): void {
  try {
    void Haptics.impactAsync(style).catch(() => {});
  } catch {
    /* noop */
  }
}

export function safeHapticSelection(): void {
  try {
    void Haptics.selectionAsync().catch(() => {});
  } catch {
    /* noop */
  }
}

export function safeHapticNotification(type: Haptics.NotificationFeedbackType): void {
  try {
    void Haptics.notificationAsync(type).catch(() => {});
  } catch {
    /* noop */
  }
}
