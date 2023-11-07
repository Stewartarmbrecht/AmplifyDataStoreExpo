import { Amplify } from '@aws-amplify/core';
import { DataStore } from '@aws-amplify/datastore';
import { ExpoSQLiteAdapter } from '@aws-amplify/datastore-storage-adapter/ExpoSQLiteAdapter';
import { useEffect, useState } from 'react';
import { Post, PostStatus } from './src/models';
import { Date, Math } from 'core-js';
import { SafeAreaView, StatusBar, ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

import awsconfig from './src/aws-exports';
Amplify.configure(awsconfig);

DataStore.configure({
  storageAdapter: ExpoSQLiteAdapter
});

// Example showing how to observe the model and keep state updated before
// performing a save. This uses the useEffect React hook, but you can
// substitute for a similar mechanism in your application lifecycle with
// other frameworks.

export default App = () => {
  const [post, setPost] = useState<Post>();
  const [allPosts, setAllPosts] = useState<Post[]>([]);

  useEffect(() => {
    /**
     * This keeps `post` fresh.
     */
    const sub = DataStore.observeQuery(Post, (c) =>
      c.id.eq(post?.id)
    ).subscribe(({ items }) => {
      setPost(items[0]);
    });

    const allPostsSub = DataStore.observeQuery(
      Post
    ).subscribe(snapshot => {
      const { items, isSynced } = snapshot;
      setAllPosts(items);
      console.log(`[Snapshot] item count: ${items.length}, isSynced: ${isSynced}`);
    });

    console.log('Subscribed');

    return () => {
      sub.unsubscribe();
      allPostsSub.unsubscribe();
    };
  }, []);

  /**
   * Create a new Post
   */
  async function onCreate() {
    const _post = await DataStore.save(
      new Post({
        title: `New title ${Date.now()}`,
        rating: Math.floor(Math.random() * (8 - 1) + 1),
        status: PostStatus.ACTIVE
      })
    );
    setPost(_post);
    console.log('Created', _post);
  }

  async function onSelect(id) {
    const selected = await DataStore.query(Post, id);
    setPost(selected);
    console.log('Selected', id);
  }

  async function onDelete(id) {
    const toDelete = await DataStore.query(Post, id);
    await DataStore.delete(toDelete);
    console.log('Deleted', id);
  }

  async function onClear() {
    await DataStore.clear();
    setAllPosts([]);
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
            <Text>{post?.title}</Text>
          </View>
          <Pressable onPress={onCreate} style={styles.primaryButton}><Text>Create</Text></Pressable>
          <View style={[styles.container, { flexDirection: "row" }]}>
            <Text>Name: </Text>
            <TextInput
              style={styles.input}
              value={post?.title ?? ''}
              onChangeText={(text) => {
                /**
                 * Each keypress updates the post in local React state.
                 */
                setPost(
                  Post.copyOf(post, (draft) => {
                    draft.title = text;
                  })
                );
              }}
            />
          </View>
          <Pressable
            disabled={!post}
            onPress={async () => {
              /**
               * This post is already up-to-date because `observeQuery` updated it.
               */
              if (!post) {
                return;
              }
              const savedPost = await DataStore.save(post);
              console.log('Post saved: ', savedPost);
            }}
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
          <Pressable onPress={() => onClear()} style={styles.button}>
            <Text>Clear</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};