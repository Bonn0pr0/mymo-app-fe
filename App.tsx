import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { I18nProvider, useI18n } from './src/i18n';
import { Colors, Gradients, Shadows } from './src/constants/colors';
import type { Friend } from './src/constants/data';

import AuthScreen from './src/screens/AuthScreen';
import MapScreen from './src/screens/MapScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CameraSheet from './src/components/CameraSheet';
import ChatScreen from './src/components/ChatScreen';
import AddFriendSheet from './src/components/AddFriendSheet';
import { LocationPermSheet, EnableLocationModal } from './src/components/LocationPermSheet';

type Screen = 'auth' | 'app';
type Tab = 'map' | 'friends' | 'notifications' | 'profile';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        body {
          background-color: #F3F1F8 !important;
          margin: 0;
          padding: 0;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <AppInner />
        <Toast />
      </I18nProvider>
    </SafeAreaProvider>
  );
}

function AppInner() {
  const { t } = useI18n();
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    (async () => {
      const { getStoredAuthSession } = await import('./src/services/authApi');
      try {
        const session = await getStoredAuthSession();
        if (session) setScreen('app');
      } catch {
        // ignore
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);
  const [screen, setScreen] = useState<Screen>('auth');
  const [tab, setTab] = useState<Tab>('map');
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [incognito, setIncognito] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [chatWith, setChatWith] = useState<Friend | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  useEffect(() => {
    if (screen === 'app' && !permissionAsked) {
      const timer = setTimeout(() => setPermissionAsked(true), 700);
      return () => clearTimeout(timer);
    }
  }, [screen, permissionAsked]);

  const handleEnableLocation = () => {
    setLocationGranted(true);
    setPermissionAsked(true);
    setLocationPromptOpen(false);
    Toast.show({ type: 'success', text1: t('loc.enabled'), text2: t('loc.enabledDesc') });
  };

  const handleDenyLocation = () => {
    setLocationGranted(false);
    setPermissionAsked(true);
    Toast.show({ type: 'info', text1: t('loc.off'), text2: t('loc.offDesc') });
  };

  const visibleOnMap = !!locationGranted && !incognito;

  if (screen === 'auth') {
    return <AuthScreen onContinue={() => setScreen('app')} />;
  }

  // Chat screen takes full screen
  if (chatWith) {
    return <ChatScreen friend={chatWith} onClose={() => setChatWith(null)} />;
  }

  return (
    <View style={styles.root}>
      {/* Main content */}
      <View style={styles.content}>
        {tab === 'map' && (
          <MapScreen
            locationGranted={!!locationGranted}
            visibleOnMap={visibleOnMap}
            incognito={incognito}
            onFriendTap={setSelectedFriend}
            selectedFriend={selectedFriend}
            onCloseSheet={() => setSelectedFriend(null)}
            onMessage={f => { setSelectedFriend(null); setChatWith(f); }}
          />
        )}
        {tab === 'friends' && (
          <FriendsScreen
            onFriendTap={setSelectedFriend}
            onChat={setChatWith}
            onAdd={() => setAddFriendOpen(true)}
          />
        )}
        {tab === 'notifications' && <NotificationsScreen />}
        {tab === 'profile' && (
          <ProfileScreen
            locationGranted={!!locationGranted}
            incognito={incognito}
            onToggleLocation={() => setLocationGranted(v => !v)}
            onToggleIncognito={() => {
              setIncognito(v => {
                const next = !v;
                if (next) Toast.show({ type: 'info', text1: t('loc.incognitoOn'), text2: t('loc.incognitoOnDesc') });
                else Toast.show({ type: 'info', text1: t('loc.incognitoOff'), text2: t('loc.incognitoOffDesc') });
                return next;
              });
            }}
            onLogout={() => {
              setScreen('auth');
              setTab('map');
              setLocationGranted(null);
              setPermissionAsked(false);
              setIncognito(false);
              Toast.show({ type: 'info', text1: t('profile.loggedOut') });
            }}
          />
        )}
      </View>

      {/* Bottom nav */}
      <BottomNav tab={tab} setTab={setTab} onCamera={() => setCameraOpen(true)} />

      {/* Modals & Sheets */}
      {(!permissionAsked || locationGranted === null) && screen === 'app' && (
        <LocationPermSheet onAllow={handleEnableLocation} onDeny={handleDenyLocation} />
      )}

      {cameraOpen && (
        <CameraSheet
          locationGranted={!!locationGranted}
          onClose={() => setCameraOpen(false)}
          onRequestLocation={() => { setCameraOpen(false); setLocationPromptOpen(true); }}
        />
      )}

      {locationPromptOpen && (
        <EnableLocationModal
          onAllow={handleEnableLocation}
          onCancel={() => {
            setLocationPromptOpen(false);
            Toast.show({ type: 'info', text1: t('loc.postDisabled'), text2: t('loc.postDisabledDesc') });
          }}
        />
      )}

      {addFriendOpen && <AddFriendSheet onClose={() => setAddFriendOpen(false)} />}

      {/* Friend sheet in Friends tab */}
      {tab === 'friends' && selectedFriend && (
        <View style={StyleSheet.absoluteFill}>
          {/* handled inside FriendsScreen via MapScreen's selectedFriend prop */}
        </View>
      )}
    </View>
  );
}

/* =================== BOTTOM NAV =================== */

function BottomNav({ tab, setTab, onCamera }: { tab: Tab; setTab: (t: Tab) => void; onCamera: () => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const navItems = [
    { id: 'map' as Tab,           icon: 'map-outline',                iconActive: 'map',                   label: t('nav.map') },
    { id: 'friends' as Tab,       icon: 'people-outline',              iconActive: 'people',                label: t('nav.friends') },
    { id: 'notifications' as Tab, icon: 'notifications-outline',       iconActive: 'notifications',         label: t('nav.inbox') },
    { id: 'profile' as Tab,       icon: 'person-circle-outline',       iconActive: 'person-circle',         label: t('nav.me') },
  ];

  return (
    <View style={[styles.navWrap, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.nav}>
        {/* Left items */}
        <NavItem item={navItems[0]} active={tab === navItems[0].id} onPress={() => setTab(navItems[0].id)} />
        <NavItem item={navItems[1]} active={tab === navItems[1].id} onPress={() => setTab(navItems[1].id)} />

        {/* Camera FAB */}
        <TouchableOpacity onPress={onCamera} style={styles.cameraBtn} activeOpacity={0.88}>
          <LinearGradient colors={Gradients.primary} style={styles.cameraBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="camera" size={26} color={Colors.white} />
          </LinearGradient>
          <View style={styles.cameraSparkle}>
            <Ionicons name="sparkles" size={10} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* Right items */}
        <NavItem item={navItems[2]} active={tab === navItems[2].id} onPress={() => setTab(navItems[2].id)} />
        <NavItem item={navItems[3]} active={tab === navItems[3].id} onPress={() => setTab(navItems[3].id)} />
      </View>
    </View>
  );
}

function NavItem({
  item, active, onPress,
}: {
  item: { id: Tab; icon: string; iconActive: string; label: string };
  active: boolean;
  onPress: () => void;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={handlePress} style={styles.navItem}>
        <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
          <Ionicons
            name={(active ? item.iconActive : item.icon) as any}
            size={22}
            color={active ? Colors.primary : Colors.textMuted}
          />
        </View>
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primaryTint,
    ...Platform.select({
      web: {
        maxWidth: 500,
        width: '100%',
        marginHorizontal: 'auto',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#EBE8F5',
        boxShadow: '0 8px 30px rgba(124, 91, 255, 0.06)',
        position: 'relative',
      },
      default: {},
    }),
  },
  content: {
    flex: 1,
  },
  navWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    ...Shadows.float,
  },
  navItem: {
    width: 56,
    alignItems: 'center',
    gap: 3,
  },
  navIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconWrapActive: {
    backgroundColor: Colors.primaryTint,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  navLabelActive: {
    color: Colors.primary,
  },
  cameraBtn: {
    marginTop: -28,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: Colors.white,
    overflow: 'visible',
    ...Shadows.float,
    ...Shadows.glow,
  },
  cameraBtnGrad: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraSparkle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});
