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

import { SafeAreaView, StatusBar, View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Activity } from './src/models';
import { ActivityStatus } from './src/models';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { helloWorld } from '@my-sample/my-package';
import TaskList from './TaskList';

const App = () => {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [allActivitys, setAllActivitys] = useState<Activity[]>([]);

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
  async function onSave(title: string, id?: string) {
    console.log('Saving', activity);
    if (!id) {
      const _activity = await DataStore.save(
        new Activity({
          title: title,
          rating: Math.floor(Math.random() * (8 - 1) + 1),
          status: ActivityStatus.ACTIVE
        })
      );
      console.log('Saved', _activity);
      setActivity(null);
      console.log('Created', _activity);
    } else {
      const toUpdate = await DataStore.query(Activity, id);
      const updatedActivity = Activity.copyOf(toUpdate, (draft) => {
        draft.title = title;
      });
      const savedActivity = await DataStore.save(updatedActivity);
      console.log('Activity saved: ', savedActivity);
      setActivity(null);
    }
  }

  async function onSelect(id: string) {
    const selected = await DataStore.query(Activity, id);
    setActivity(selected);
    console.log('Selected', id);
  }

  async function onDelete(id: string) {
    const toDelete = await DataStore.query(Activity, id);
    await DataStore.delete(toDelete);
    setActivity(null);
    console.log('Deleted', id);
  }

  async function onClear() {
    await DataStore.clear();
    setAllActivitys([]);
    setActivity(null);
    console.log('Cleared');
  }

  const styles = StyleSheet.create({
    container: {
      padding: 10,
    },
    button: {
      backgroundColor: "blue",
      color: "white",
      borderWidth: 1,
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
        </View>
        <TaskList 
          allActivities={allActivitys} 
          selectedActivity={activity} 
          onClear={onClear}
          onDelete={onDelete}
          onSave={onSave}
          onSelect={onSelect}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default withAuthenticator(App);