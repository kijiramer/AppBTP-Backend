import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Platform } from 'react-native';

export default function MobileBreadcrumb({ segments = [], navigation, onNavigate }) {
  const [visible, setVisible] = useState(false);
  const [activeItems, setActiveItems] = useState([]);
  const [activeLabel, setActiveLabel] = useState('');
  const [stack, setStack] = useState([]); // stack of { label, items }

  const openMenu = (segment) => {
    const items = segment.items || [];
    if (!items || items.length === 0) return;
    // push current menu to stack
    setStack((s) => [...s, { label: segment.label || '', items }]);
    setActiveItems(items);
    setActiveLabel(segment.label || '');
    setVisible(true);
  };

  const handleSelect = (item) => {
    // If the item has nested children, push them onto the stack and continue drilling
    const children = item.children || item.items || [];
    if (children && children.length > 0) {
      setStack((s) => [...s, { label: item.label || '', items: children }]);
      setActiveItems(children);
      setActiveLabel(item.label || '');
      return;
    }

    // Final selection -> navigate or call callback
    setVisible(false);
    setStack([]);
    if (item.route && navigation && typeof navigation.navigate === 'function') {
      navigation.navigate(item.route, item.params || {});
      return;
    }
    if (onNavigate) onNavigate(item);
  };

  const handleBack = () => {
    // pop stack
    setStack((s) => {
      if (!s || s.length <= 1) {
        // closing
        setVisible(false);
        setActiveItems([]);
        setActiveLabel('');
        return [];
      }
      const next = s.slice(0, -1);
      const top = next[next.length - 1];
      setActiveItems(top.items || []);
      setActiveLabel(top.label || '');
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {segments.map((s, idx) => (
          <TouchableOpacity
            key={`${s.label}-${idx}`}
            onPress={() => openMenu(s)}
            activeOpacity={s.items && s.items.length > 0 ? 0.7 : 1}
            style={styles.segment}
          >
            <Text style={styles.segmentText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setVisible(false); setStack([]); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              {stack.length > 1 ? (
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                  <Text style={styles.backText}>‹ Retour</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.backPlaceholder} />
              )}
              <Text style={styles.modalTitle}>{activeLabel ? `Choisir — ${activeLabel}` : 'Choisir'}</Text>
              <TouchableOpacity onPress={() => { setVisible(false); setStack([]); }} style={styles.closeIcon}>
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeItems}
              keyExtractor={(i, idx) => `${i.label || i.route || idx}-${idx}`}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.modalItemText}>{item.label || item.route}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, marginTop: 8 },
  row: { flexDirection: 'row' },
  segment: { marginRight: 16 },
  segmentText: { color: '#7b7c7e', fontSize: 15, fontWeight: '600' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '70%'
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  backText: { color: '#007aff' },
  backPlaceholder: { width: 56 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  closeIcon: { paddingHorizontal: 8, paddingVertical: 6 },
  closeIconText: { color: '#f26463', fontWeight: '700' },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 15 },
});

