import 'core-js/full/symbol/async-iterator';
import React, { useEffect, useState } from 'react';
import { Amplify } from '@aws-amplify/core';
import { AuthModeStrategyType } from 'aws-amplify';
import awsconfig from './src/aws-exports';
Amplify.configure({
  ...awsconfig,
  DataStore: {
    authModeStrategyType: AuthModeStrategyType.MULTI_AUTH
  }
})
import { DataStore } from '@aws-amplify/datastore';
import { ExpoSQLiteAdapter } from '@aws-amplify/datastore-storage-adapter/ExpoSQLiteAdapter';
DataStore.configure({
  storageAdapter: ExpoSQLiteAdapter
});

import { SafeAreaView, StatusBar, View, Text, ScrollView, StyleSheet, Pressable, TextInput } from "react-native";
import { Activity } from './src/models';
import { ActivityStatus } from './src/models';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { helloWorld } from '@my-sample/my-package';

const App = () => {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [allActivitys, setAllActivitys] = useState<Activity[]>([]);
  const [title, setTitle] = useState<string>('');

  // retrieves only the current value of 'user' from 'useAuthenticator'
  const userSelector = (context) => [context.user]

  const SignOutButton = () => {
    const { user, signOut } = useAuthenticator(userSelector);
    return (
      <Pressable onPress={signOut} style={styles.button}>
        <Text>Hello, {user?.username}! Click here to sign out!</Text>
      </Pressable>
    )
  };

  useEffect(() => {
    let sub = null;
    if (activity) {
      /**
       * This keeps `activity` fresh.
       */
      sub = DataStore.observeQuery(Activity, (c) =>
        c.id.eq(activity.id)
      ).subscribe(({ items }) => {
        setActivity(items[0]);
      });
    }

    const allActivitysSub = DataStore.observeQuery(
      Activity
    ).subscribe(snapshot => {
      const { items, isSynced } = snapshot;
      setAllActivitys(items);
      console.log(`[Snapshot] item count: ${items.length}, isSynced: ${isSynced}`);
    });

    console.log('Subscribed');

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
      allActivitysSub.unsubscribe();
    };
  }, []);

  /**
   * Create a new Activity
   */
  async function onSave() {
    console.log('Saving', activity);
    if (!activity) {
      const _activity = await DataStore.save(
        new Activity({
          title: title,
          rating: Math.floor(Math.random() * (8 - 1) + 1),
          status: ActivityStatus.ACTIVE
        })
      );
      console.log('Saved', _activity);
      setActivity(null);
      setTitle('');
      console.log('Created', _activity);
    } else {
      const updatedActivity = Activity.copyOf(activity, (draft) => {
        draft.title = title;
      });
      const savedActivity = await DataStore.save(updatedActivity);
      console.log('Activity saved: ', savedActivity);
      setActivity(null);
      setTitle('');
    }
  }

  async function onSelect(id) {
    const selected = await DataStore.query(Activity, id);
    setActivity(selected);
    setTitle(selected.title)
    console.log('Selected', id);
  }

  async function onDelete(id) {
    const toDelete = await DataStore.query(Activity, id);
    await DataStore.delete(toDelete);
    setActivity(null);
    setTitle('');
    console.log('Deleted', id);
  }

  async function onClear() {
    await DataStore.clear();
    setAllActivitys([]);
    setActivity(null);
    setTitle('');
    console.log('Cleared');
  }

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
    <SafeAreaView>
      <StatusBar />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.container}>
          <View style={styles.selectedName}>
            <Text>{helloWorld('Monorepo')}</Text>
          </View>
          <SignOutButton />
          <View style={styles.selectedName}>
            <Text>{activity?.title ?? 'New Task'}</Text>
          </View>
          <View style={[styles.container, { flexDirection: "row" }]}>
            <Text>Id: {activity?.id}</Text>
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
            onPress={onSave}
            style={styles.button}
          >
            <Text>Save</Text>
          </Pressable>
        </View>
        <View style={styles.container}>
          {allActivitys ? allActivitys.map((p) => (
            <View style={{ flexDirection: "row" }} key={p.id}>
              <Pressable onPress={() => onSelect(p.id)} style={styles.selectButton}>
                <Text>Select</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(p.id)} style={styles.deleteButton}>
                <Text>Delete</Text>
              </Pressable>
              <View style={styles.itemName}>
                <Text key={p.id}>{p.title}</Text>
              </View>
            </View>
          )) : null}
        </View>
        <View style={styles.container}>
          <Pressable onPress={onClear} style={styles.button}>
            <Text>Clear</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default withAuthenticator(App);