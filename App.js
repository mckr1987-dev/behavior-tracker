import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]); // New state for the log

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedPoints = await AsyncStorage.getItem('kidPoints');
      if (savedPoints !== null) setPoints(parseInt(savedPoints));

      // Parse the JSON string back into a JavaScript array
      const savedHistory = await AsyncStorage.getItem('kidHistory');
      if (savedHistory !== null) setHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.log('Failed to load data');
    }
  };

  const updatePoints = async (change, taskName) => {
    const newTotal = points + change;
    
    // Create a new timestamped record
    const newRecord = {
      id: Date.now().toString(),
      task: taskName,
      change: change,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Add new record to the top and keep only the last 10
    const newHistory = [newRecord, ...history].slice(0, 10);

    setPoints(newTotal);
    setHistory(newHistory);
    
    try {
      await AsyncStorage.setItem('kidPoints', newTotal.toString());
      await AsyncStorage.setItem('kidHistory', JSON.stringify(newHistory));
    } catch (e) {
      console.log('Failed to save data');
    }
  };

  const resetPoints = () => {
    Alert.alert("Reset Points", "Reset the total back to 0?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Reset", 
        style: "destructive", 
        onPress: async () => { 
          setPoints(0); 
          
          // Log the reset action in the history
          const resetRecord = { 
            id: Date.now().toString(), 
            task: 'Points Reset', 
            change: -points, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          };
          const newHistory = [resetRecord, ...history].slice(0, 10);
          
          setHistory(newHistory);
          await AsyncStorage.setItem('kidPoints', '0'); 
          await AsyncStorage.setItem('kidHistory', JSON.stringify(newHistory));
        } 
      }
    ]);
  };

  const behaviors = [
    { id: 1, name: 'Complete Homework', points: 100, type: 'good' },
    { id: 2, name: 'Eat One Egg', points: 50, type: 'good' },
    { id: 3, name: 'Wake Up & Brush', points: 20, type: 'good' },
    { id: 4, name: 'Ate Chocolate', points: -10, type: 'bad' },
    { id: 5, name: 'Tantrum/Arguing', points: -50, type: 'bad' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Parent Dashboard</Text>
      
      <View style={styles.scoreBoard}>
        <Text style={styles.scoreText}>Current Balance</Text>
        <Text style={styles.scoreNumber}>{points}</Text>
        <TouchableOpacity style={styles.resetButton} onPress={resetPoints}>
          <Text style={styles.resetText}>Reset Score</Text>
        </TouchableOpacity>
      </View>

      {/* Main Task List */}
      <View style={{ height: 300 }}>
        <ScrollView style={styles.taskList}>
          {behaviors.map((task) => (
            <TouchableOpacity 
              key={task.id} 
              style={[styles.taskCard, task.type === 'good' ? styles.cardGood : styles.cardBad]}
              onPress={() => updatePoints(task.points, task.name)}
            >
              <Text style={styles.taskName}>{task.name}</Text>
              <Text style={[styles.taskPoints, task.type === 'bad' && styles.textRed]}>
                {task.points > 0 ? '+' : ''}{task.points}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* History Log */}
      <Text style={styles.historyHeader}>Recent Activity</Text>
      <ScrollView style={styles.historyList}>
        {history.length === 0 ? (
          <Text style={styles.historyEmpty}>No activity yet.</Text>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View>
                <Text style={styles.historyTask}>{item.task}</Text>
                <Text style={styles.historyTime}>{item.time}</Text>
              </View>
              <Text style={[styles.historyChange, item.change < 0 && styles.textRed]}>
                {item.change > 0 ? '+' : ''}{item.change}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60, paddingHorizontal: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
  scoreBoard: { backgroundColor: '#1e1e1e', padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  scoreText: { color: '#aaa', fontSize: 16 },
  scoreNumber: { color: '#4CAF50', fontSize: 56, fontWeight: 'bold', marginVertical: 10 },
  resetButton: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  resetText: { color: 'white', fontSize: 14 },
  taskList: { flex: 1 },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1 },
  cardGood: { backgroundColor: '#1a2e1a', borderColor: '#2e5a2e' },
  cardBad: { backgroundColor: '#331a1a', borderColor: '#5a2e2e' },
  taskName: { fontSize: 16, color: '#e0e0e0', fontWeight: '500' },
  taskPoints: { fontSize: 16, color: '#4CAF50', fontWeight: 'bold' },
  textRed: { color: '#F44336' },
  
  // New styles for the History Log
  historyHeader: { fontSize: 18, color: '#aaa', marginTop: 15, marginBottom: 10 },
  historyList: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 15 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 10 },
  historyTask: { color: 'white', fontSize: 15 },
  historyTime: { color: '#888', fontSize: 12, marginTop: 4 },
  historyChange: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold' },
  historyEmpty: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }
});