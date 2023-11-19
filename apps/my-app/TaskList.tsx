import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Activity } from "./src/models";
import { useState } from "react";

export interface TaskListProps {
  allActivities?: Activity[];
  selectedActivity?: Activity;
  onSave: (title: string, id?: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}
export default function TaskList(props: TaskListProps) {
  const [title, setTitle] = useState<string>('');

  const styles = StyleSheet.create({
    container: {
      padding: 10,
    },
    deleteButton: {
      backgroundColor: "red",
      color: "white",
      borderWidth: 1,
      borderRadius: 10,
      padding: 5,
      margin: 5,
    },
    selectButton: {
      backgroundColor: "yellow",
      color: "black",
      borderWidth: 1,
      borderRadius: 10,
      padding: 5,
      margin: 5,
    },
    button: {
      backgroundColor: "blue",
      color: "white",
      borderWidth: 1,
      borderRadius: 10,
      padding: 5,
      margin: 5,
    },
    primaryButton: {
      backgroundColor: "green",
      color: "white",
      borderWidth: 1,
      borderRadius: 10,
      padding: 5,
      margin: 5,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 5,
      margin: 5,
      flex: 1,
    },
    itemName: {
      borderWidth: 0,
      borderRadius: 10,
      padding: 5,
      margin: 5,
    },
    selectedName: {
      borderWidth: 0,
      borderRadius: 10,
      padding: 5,
      margin: 5,
    }
  });

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={styles.container}>
        <View style={styles.selectedName}>
          <Text>{props.selectedActivity?.title ?? 'New Task'}</Text>
        </View>
        <View style={[styles.container, { flexDirection: "row" }]}>
          <Text>Id: {props.selectedActivity?.id}</Text>
        </View>
        <View style={[styles.container, { flexDirection: "row" }]}>
          <Text>Name: </Text>
          <TextInput
            style={styles.input}
            value={title}
            placeholder='Enter a new task...'
            onChangeText={setTitle}
          />
        </View>
        <Pressable
          disabled={(title?.length ?? 0) === 0}
          onPress={() => props.onSave(title, props.selectedActivity?.id)}
          style={styles.button}
        >
          <Text>Save</Text>
        </Pressable>
      </View>
      <View style={styles.container}>
        {props.allActivities ? props.allActivities.map((p) => (
          <View style={{ flexDirection: "row" }} key={p.id}>
            <Pressable onPress={() => props.onSelect(p.id)} style={styles.selectButton}>
              <Text>Select</Text>
            </Pressable>
            <Pressable onPress={() => props.onDelete(p.id)} style={styles.deleteButton}>
              <Text>Delete</Text>
            </Pressable>
            <View style={styles.itemName}>
              <Text key={p.id}>{p.title}</Text>
            </View>
          </View>
        )) : null}
      </View>
      <View style={styles.container}>
        <Pressable onPress={props.onClear} style={styles.button}>
          <Text>Clear</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
