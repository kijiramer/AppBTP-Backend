import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './Header';
import ScreenWrapper from '../Controleur/ScreenWrapper';
import { TabContext } from '../Controleur/TabContext';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

export default function Batiment({ route, navigation }) {
  const { city, building } = route.params;
  const { setActiveTab } = useContext(TabContext);
  const [selectedTask, setSelectedTask] = useState(null);

  const tasks = [
    { name: 'Notes', icon: 'assignment' },
    { name: 'Rapport Photo', icon: 'remove-red-eye' },
    { name: 'Constatation', icon: 'warning' },
    { name: 'Effectif', icon: 'group' }
  ];

  useEffect(() => {
    setActiveTab(building);
  }, [building, setActiveTab]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setActiveTab(building);
      setSelectedTask(null); // Reset the selected task when coming back
    });

    return unsubscribe;
  }, [navigation, building, setActiveTab]);

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setActiveTab(task.name);
    
    // Navigation vers une page spécifique en fonction de la tâche
    switch (task.name) {
        case 'Notes':
            navigation.navigate('Note', { city, building, task: task.name });
            break;
        case 'Rapport Photo':
            navigation.navigate('RapportPhoto', { city, building, task: task.name });
            break;
        case 'Constatation':
            navigation.navigate('Constatation', { city, building, task: task.name });
            break;
        case 'Effectif':
            navigation.navigate('Effectif', { city, building, task: task.name });
            break;
    }
};

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        <Header
          navigation={navigation}
          isHomePage={false}
          city={city}
          building={building}
          task={selectedTask ? selectedTask.name : null}
        />
        <ScrollView style={styles.content}>
          <View style={styles.cardList}>
            {tasks.map((task, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => handleTaskPress(task)}
              >
                <MaterialIcons name={task.icon} color="#414248" size={35} style={styles.cardIcon} />
                <Text style={styles.cardText}>{task.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#414248',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#414248',
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  cardList: {
    marginTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#90a0ca',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 1,
    marginBottom: 16,
  },
  cardIcon: {
    marginRight: 16,
  },
  cardText: {
    fontSize: 25,
    color: '#414248',
    fontFamily: 'Quicksand-bold',
  },
});
