import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebase/config';

export default function HomeScreen({ navigation }) {
  const user = auth.currentUser;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    });
  };

  const getCapitalizedName = (email) => {
    if (!email) return 'Guest';
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  return (
    <ImageBackground
      source={require('../assets/home_bg.png')}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    >
      <LinearGradient colors={['#E0F7FAAA', '#B2EBF2AA']} style={styles.container}>
        {/* Burger Icon */}
        <View style={styles.burgerOverlay}>
          <TouchableOpacity style={styles.burger} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={28} color="#00796B" />
          </TouchableOpacity>
        </View>

        {/* Welcome Message (Top Left) */}
        <View style={styles.welcomeWrapper}>
          <View style={styles.profileOverlay}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => navigation.navigate('Settings')}
            >
              <Image
                source={require('../assets/avatar_placeholder.png')} // Replace with your own avatar image
                style={styles.avatar}
              />
              <Text style={styles.welcomeText}>Hi, {getCapitalizedName(user?.email)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Animated Logo and Tagline */}
        <View style={[styles.top, styles.overlayBox]}>
          <Animated.Image
            source={require('../assets/logo_v2.jpg')}
            style={[
              styles.logo,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          />
          <Animated.Text style={[styles.tagline, { opacity: opacityAnim }]}>
            Good Choices Start with a Scan.
          </Animated.Text>
        </View>

        {/* Menu Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.menu}>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Settings');
                }}
              >
                <Text style={styles.menuText}>Settings</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Preferences');
                }}
              >
                <Text style={styles.menuText}>Preferences</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('ScanHistory');
                }}
              >
                <Text style={styles.menuText}>Scan History</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  handleLogout();
                }}
              >
                <Text style={styles.menuText}>Logout</Text>
              </Pressable>
              
              <Pressable style={styles.closeBtn} onPress={() => setMenuVisible(false)}>
                <Ionicons name="close-circle-outline" size={28} color="#555" />
              </Pressable>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </ImageBackground>
  );
}

HomeScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignContent: 'center',
    justifyContent: 'center',
  },
  burger: {
    // The burgerOverlay handles position now
  },
  burgerOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 6,
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  welcomeWrapper: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#004D40',
  },
  top: {
    alignItems: 'center',
    marginTop: 80,
  },
  overlayBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 100,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004D40',
    marginBottom: 10,
    fontStyle: 'italic',
    textShadow: '0px 1px 4px #fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: 20,
  },
});