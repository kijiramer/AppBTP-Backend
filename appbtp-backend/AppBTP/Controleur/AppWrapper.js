import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Footer from '../Vue/Footer';

export default function AppWrapper({ children }) {
  const route = useRoute();
  const noFooterRoutes = ['LoginPage', 'SignUp'];

  return (
    <View style={styles.container}>
      {children}
      {!noFooterRoutes.includes(route.name) && <Footer />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
