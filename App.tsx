import 'core-js/full/symbol/async-iterator';
import React, { useEffect, useState } from 'react';
import { Amplify } from '@aws-amplify/core';
import awsconfig from './src/aws-exports';
Amplify.configure(awsconfig);
import { DataStore } from '@aws-amplify/datastore';
import { ExpoSQLiteAdapter } from '@aws-amplify/datastore-storage-adapter/ExpoSQLiteAdapter';
DataStore.configure({
  storageAdapter: ExpoSQLiteAdapter
});

import { SafeAreaView, StatusBar, View, Text, ScrollView, StyleSheet, Pressable, TextInput } from "react-native";
import { Post } from './src/models';
import { PostStatus } from './src/models';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

const App = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
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
    if (post) {
      /**
       * This keeps `post` fresh.
       */
      sub = DataStore.observeQuery(Post, (c) =>
        c.id.eq(post.id)
      ).subscribe(({ items }) => {
        setPost(items[0]);
      });
    }

    const allPostsSub = DataStore.observeQuery(
      Post
    ).subscribe(snapshot => {
      const { items, isSynced } = snapshot;
      setAllPosts(items);
      console.log(`[Snapshot] item count: ${items.length}, isSynced: ${isSynced}`);
    });

    console.log('Subscribed');

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
      allPostsSub.unsubscribe();
    };
  }, []);

  /**
   * Create a new Post
   */
  async function onSave() {
    if (!post) {
      const _post = await DataStore.save(
        new Post({
          title: title,
          rating: Math.floor(Math.random() * (8 - 1) + 1),
          status: PostStatus.ACTIVE
        })
      );
      setPost(null);
      setTitle('');
      console.log('Created', _post);
    } else {
      const updatedPost = Post.copyOf(post, (draft) => {
        draft.title = title;
      });
      const savedPost = await DataStore.save(updatedPost);
      console.log('Post saved: ', savedPost);
      setPost(null);
      setTitle('');
    }
  }

  async function onSelect(id) {
    const selected = await DataStore.query(Post, id);
    setPost(selected);
    setTitle(selected.title)
    console.log('Selected', id);
  }

  async function onDelete(id) {
    const toDelete = await DataStore.query(Post, id);
    await DataStore.delete(toDelete);
    setPost(null);
    setTitle('');
    console.log('Deleted', id);
  }

  async function onClear() {
    await DataStore.clear();
    setAllPosts([]);
    setPost(null);
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
          <SignOutButton />
          <View style={styles.selectedName}>
            <Text>{post?.title ?? 'New Task'}</Text>
          </View>
          <View style={[styles.container, { flexDirection: "row" }]}>
            <Text>Id: {post?.id}</Text>
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
          {allPosts ? allPosts.map((p) => (
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