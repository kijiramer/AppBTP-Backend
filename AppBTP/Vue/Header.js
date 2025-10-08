import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import logo from '../assets/logo.jpg';
import { TabContext } from '../Controleur/TabContext';

export default function Header({ navigation, isHomePage, city, building, task }) {
  const { activeTab, setActiveTab } = useContext(TabContext);
  const [tabItems, setTabItems] = useState([]);

  useEffect(() => {
    const items = [];
    if (city) items.push({ name: city });
    if (building) items.push({ name: building });
    if (task) items.push({ name: task });
    setTabItems(items);
  }, [city, building, task]);

  useEffect(() => {
    if (tabItems.length > 0 && !activeTab) {
      setActiveTab(tabItems[0].name);
    }
  }, [tabItems, activeTab, setActiveTab]);

  const renderTabs = (items) => {
    return (
      <View style={styles.tabs}>
        {items.map(({ name }) => {
          const isActive = activeTab === name;

          return (
            <View key={name} style={styles.tabsItemWrapper}>
              <View style={styles.tabsItem}>
                <Text
                  style={[
                    styles.tabsItemText,
                    isActive && { color: '#F26463' },
                  ]}
                >
                  {name}
                </Text>
              </View>

              {isActive && <View style={styles.tabsItemLine} />}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View>
      <View style={styles.header}>
        {!isHomePage && (
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" color="#F85F6A" size={30} />
          </TouchableOpacity>
        )}

        <View style={styles.logoContainer}>
          <Image
            source={logo}
            style={isHomePage ? [styles.logo, styles.logoHome] : styles.logo}
          />
        </View>

        {!isHomePage && (
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="search" color="#F85F6A" size={30} />
          </TouchableOpacity>
        )}
      </View>

      {!isHomePage && renderTabs(tabItems)}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    position: 'relative',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 50,
    resizeMode: 'contain',
  },
  logoHome: {
    marginTop: 88,
    marginBottom: 48,
    transform: [{ translateY: 10 }],
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tabsItemWrapper: {
    marginRight: 28,
  },
  tabsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  tabsItemText: {
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#7b7c7e',
  },
  tabsItemLine: {
    width: 20,
    height: 3,
    backgroundColor: '#f26463',
    borderRadius: 24,
  },
});
