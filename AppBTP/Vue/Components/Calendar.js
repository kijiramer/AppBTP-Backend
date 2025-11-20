// Components/Calendar.js
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/fr';

const { width } = Dimensions.get('window');
moment.locale('fr');

/**
 * Affiche un calendrier hebdomadaire (lundi -> dimanche)
 * avec sélection de jour et bouton "Aujourd'hui"
 */
export function displayCalendarScreen(selectedDate, onDateChange, datesWithNotes = []) {
  // États
  const [internalSelectedDate, setInternalSelectedDate] = useState(selectedDate || new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  // Utilise la date fournie ou la date interne
  const currentSelectedDate = selectedDate || internalSelectedDate;

  // Génère 21 jours (3 semaines)
  const currentWeeks = useMemo(() => {
    const startOfWeek = moment()
        .add(weekOffset, 'weeks')
        .startOf('isoWeek');

    return Array.from({ length: 21 }, (_, i) => {
      const dayMoment = moment(startOfWeek).add(i, 'days').startOf('day');
      return {
        weekday: dayMoment.format('ddd'),
        date: dayMoment.toDate(),
      };
    });
  }, [weekOffset]);

  // Mois et année à afficher
  const currentMonthYear = moment()
      .add(weekOffset, 'weeks')
      .startOf('isoWeek')
      .format('MMMM YYYY');

  const today = moment().startOf('day');
  const formattedSelectedDate = moment(currentSelectedDate)
      .format('dddd D MMMM YYYY');

  // Handlers
  const handleTodayPress = () => {
    setWeekOffset(0);
    const newDate = moment().startOf('day').toDate();
    console.log('🏠 Today button pressed:', newDate.toISOString(), 'Local:', newDate.toLocaleDateString());
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalSelectedDate(newDate);
    }
  };

  const handleDateSelect = (date) => {
    console.log('📅 Calendar date clicked:', date.toISOString(), 'Local:', date.toLocaleDateString());
    if (onDateChange) {
      onDateChange(date);
    } else {
      setInternalSelectedDate(date);
    }
  };

  const handlePrevWeek = () => setWeekOffset(w => w - 1);
  const handleNextWeek = () => setWeekOffset(w => w + 1);

  // Render
  return (
      <View style={styles.container}>

        {/* Calendrier */}
        <View style={styles.calendarFrame}>

          {/* En-tête : navigation et mois */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevWeek}>
              <Text style={styles.navButton}>{'<'}</Text>
            </TouchableOpacity>

            <Text style={styles.monthText}>{currentMonthYear}</Text>

            <TouchableOpacity onPress={handleNextWeek}>
              <Text style={styles.navButton}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Jours de la semaine (3 semaines = 3 lignes) */}
          {[0, 1, 2].map(weekIndex => (
            <View key={weekIndex} style={styles.weekRow}>
              {currentWeeks.slice(weekIndex * 7, (weekIndex + 1) * 7).map((item, idx) => {
                const isActive =
                    currentSelectedDate.toDateString() === item.date.toDateString();
                const isToday = today.isSame(item.date, 'day');
                const hasNotes = datesWithNotes.includes(moment(item.date).format('YYYY-MM-DD'));

                return (
                    <TouchableOpacity
                        key={idx}
                        style={styles.dayWrapper}
                        onPress={() => handleDateSelect(item.date)}
                        activeOpacity={0.7}
                    >
                      <View
                          style={[
                            styles.dayItem,
                            isActive && styles.activeDay,
                            isToday && styles.todayBorder,
                          ]}
                      >
                        {hasNotes && (
                          <View style={[styles.noteDotOverlay, isActive && styles.activeDot]} />
                        )}
                        <Text
                            style={[
                              styles.weekdayText,
                              isActive && styles.activeText,
                            ]}
                        >
                          {item.weekday}
                        </Text>
                        <View style={styles.dateContainer}>
                          <Text
                              style={[
                                styles.dateText,
                                isActive && styles.activeText,
                              ]}
                          >
                            {item.date.getDate()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                );
              })}
            </View>
          ))}

        </View>

      </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
  },

  calendarFrame: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'black',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  navButton: {
    fontSize: 20,
    color: '#f26463',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  dayWrapper: {
    flex: 1,
  },

  dayItem: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekdayText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },

  dateContainer: {
    alignItems: 'center',
    position: 'relative',
  },

  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
  },

  noteDotOverlay: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f26463',
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: -3,
  },

  activeDot: {
    backgroundColor: '#fff',
  },

  activeDay: {
    backgroundColor: '#f26463',
  },

  activeText: {
    color: '#fff',
  },

  todayBorder: {
    borderWidth: 2,
    borderColor: '#f26463',
  },

  selectedDateContainer: {
    alignItems: 'center',
    marginTop: 8,
  },

  selectedDateText: {
    fontSize: 14,
    color: '#333',
  },
});