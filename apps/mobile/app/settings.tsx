import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';

import { AppHeader, Button, Screen, colors, radii, spacing, typography, PixelIcon } from '@gamdojang/ui';

import { useSessionStore } from '../src/store/session-store';

export default function SettingsRoute() {
  const router = useRouter();
  const signOut = useSessionStore((state) => state.signOut);

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 YEO:UN에서 나가시겠어요?', [
      { text: '머무르기', style: 'cancel' },
      { 
        text: '나가기', 
        style: 'destructive', 
        onPress: async () => {
          await signOut();
          router.replace('/splash');
        }
      }
    ]);
  };

  return (
    <Screen 
      scroll={false}
      header={<AppHeader onBack={() => router.back()} title="다이어리 설정" subtitle="내 공간을 관리하는 곳" />}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.noteCard}>
          {/* Notebook binding rings mock */}
          <View style={styles.bindingContainer}>
            <View style={styles.ring} /><View style={styles.ring} /><View style={styles.ring} />
            <View style={styles.ring} /><View style={styles.ring} /><View style={styles.ring} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>알림장 설정</Text>
            <View style={styles.itemGroup}>
              <Pressable style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <PixelIcon name="bell" size={20} color={colors.ink700} />
                  <Text style={styles.menuText}>푸시 알림 받기</Text>
                </View>
                <Text style={styles.menuValue}>켜짐</Text>
              </Pressable>
              <Pressable style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <PixelIcon name="mood-card" size={20} color={colors.ink700} />
                  <Text style={styles.menuText}>새로운 여운 알림</Text>
                </View>
                <Text style={styles.menuValue}>켜짐</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계정 관리</Text>
            <View style={styles.itemGroup}>
              <Pressable style={styles.menuItem} onPress={() => Alert.alert('준비 중', '비밀번호 변경은 곧 지원될 예정이에요.')}>
                <View style={styles.menuLeft}>
                  <PixelIcon name="settings" size={20} color={colors.ink700} />
                  <Text style={styles.menuText}>비밀번호 변경</Text>
                </View>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={() => Alert.alert('준비 중', '차단 목록 관리는 곧 지원될 예정이에요.')}>
                <View style={styles.menuLeft}>
                  <PixelIcon name="comment" size={20} color={colors.ink700} />
                  <Text style={styles.menuText}>차단한 사용자 관리</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>정보</Text>
            <View style={styles.itemGroup}>
              <View style={styles.menuItem}>
                <Text style={styles.menuText}>버전 정보</Text>
                <Text style={styles.menuValue}>1.0.0 (무드카드)</Text>
              </View>
              <Pressable style={styles.menuItem}>
                <Text style={styles.menuText}>이용 약관</Text>
              </Pressable>
              <Pressable style={styles.menuItem}>
                <Text style={styles.menuText}>개인정보 처리방침</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.dangerZone}>
          <Button onPress={handleSignOut} variant="secondary">
            조용히 로그아웃하기
          </Button>
          <Pressable style={styles.withdrawBtn} onPress={() => Alert.alert('탈퇴', '정말 무드카드를 찢고 떠나시겠어요?')}>
            <Text style={styles.withdrawText}>무드카드 버리기 (회원 탈퇴)</Text>
          </Pressable>
        </View>
        
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl
  },
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    paddingLeft: spacing.xxl, // extra padding for rings
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.warmGray100,
    position: 'relative'
  },
  bindingContainer: {
    position: 'absolute',
    left: -8,
    top: spacing.xl,
    bottom: spacing.xl,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  ring: {
    width: 24,
    height: 8,
    backgroundColor: colors.warmGray300,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.warmGray400,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    ...typography.headingS,
    fontFamily: 'DungGeunMo',
    color: colors.lavender500,
    marginBottom: spacing.xs
  },
  itemGroup: {
    gap: spacing.md
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  menuText: {
    ...typography.bodyL,
    color: colors.ink900,
    fontWeight: '500'
  },
  menuValue: {
    ...typography.caption,
    color: colors.warmGray400,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.warmGray200,
    borderStyle: 'dashed',
    marginVertical: spacing.lg
  },
  dangerZone: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    marginTop: spacing.md
  },
  withdrawBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md
  },
  withdrawText: {
    ...typography.caption,
    color: colors.warmGray400,
    textDecorationLine: 'underline'
  }
});