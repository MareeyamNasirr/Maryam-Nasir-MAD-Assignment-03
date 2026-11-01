
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ThemedView } from './components/ThemedView';
import { ThemedText } from './components/ThemedText';

const BLUE = '#425BEA';
const BG = '#F4F7FF';
const NAVY = '#202B44';
const STORAGE_KEY = '@student_hub_tasks_v3';

type Tab = 'Home' | 'Courses' | 'Tasks' | 'Profile';
type Filter = 'All' | 'Pending' | 'Completed';

type Task = {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
};

type ApiPost = {
  id: number;
  title: string;
  body: string;
};

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Mobile App Development',
    detail: 'Assignment 03',
    completed: false,
  },
  {
    id: '2',
    title: 'Database Systems',
    detail: 'Lab task',
    completed: false,
  },
];

const courses = [
  {
    code: 'MAD',
    title: 'Mobile App Development',
    progress: '8 lessons',
    color: '#E7ECFF',
    icon: '📱',
    lessons: [
      'Introduction to Mobile Development',
      'React Native Basics',
      'Components and Props',
      'State and Hooks',
      'Navigation',
      'API Integration',
      'Local Storage',
      'App Testing and Deployment',
    ],
  },
  {
    code: 'DB',
    title: 'Database Systems',
    progress: '5 lessons',
    color: '#E1F7EF',
    icon: '🗄️',
    lessons: [
      'Introduction to Databases',
      'Entity Relationship Diagrams',
      'SQL Queries',
      'Database Normalization',
      'Transactions and Security',
    ],
  },
  {
    code: 'SE',
    title: 'Software Engineering',
    progress: '6 lessons',
    color: '#FFF0DF',
    icon: '💡',
    lessons: [
      'Introduction to Software Engineering',
      'Software Development Life Cycle',
      'Requirement Engineering',
      'Software Design',
      'Software Testing',
      'Project Management',
    ],
  },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('Home');
  const [selectedCourse, setSelectedCourse] =
    useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetail, setTaskDetail] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const activeCourse = courses.find(
    (course) => course.code === selectedCourse
  );

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingCount = tasks.length - completedCount;

  const filteredTasks = tasks.filter((task) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      task.detail.toLowerCase().includes(query);

    const matchesFilter =
      filter === 'All' ||
      (filter === 'Completed' && task.completed) ||
      (filter === 'Pending' && !task.completed);

    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved !== null) {
          const parsed: Task[] = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTasks(parsed);
          } else {
            setTasks(initialTasks);
          }
        } else {
          setTasks(initialTasks);
        }
      } catch (error) {
        console.log('Storage loading error:', error);
        setTasks(initialTasks);
        Alert.alert(
          'Storage Error',
          'Saved tasks could not be loaded.'
        );
      } finally {
        setStorageReady(true);
      }
    };

    loadTasks();
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(tasks)
        );
      } catch (error) {
        console.log('Storage saving error:', error);
        Alert.alert(
          'Storage Error',
          'Tasks could not be saved.'
        );
      }
    };

    saveTasks();
  }, [tasks, storageReady]);

  const fetchApiData = async () => {
    setApiLoading(true);
    setApiError('');

    try {
      const response = await axios.get<ApiPost[]>(
        'https://jsonplaceholder.typicode.com/posts',
        { timeout: 15000 }
      );

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid API response');
      }

      setApiPosts(response.data.slice(0, 5));
    } catch (error) {
      console.log('API error:', error);
      setApiError(
        'Unable to load API data. Check your internet connection.'
      );
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchApiData();
  }, []);

  const resetForm = () => {
    setTaskTitle('');
    setTaskDetail('');
    setEditingId(null);
  };

  const saveTask = () => {
    const title = taskTitle.trim();
    const detail = taskDetail.trim();

    if (!title) {
      Alert.alert(
        'Required Field',
        'Please enter a task title.'
      );
      return;
    }

    if (editingId !== null) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingId
            ? { ...task, title, detail }
            : task
        )
      );
    } else {
      const newTask: Task = {
        id: `${Date.now()}-${Math.random()}`,
        title,
        detail,
        completed: false,
      };

      setTasks((previous) => [newTask, ...previous]);
    }

    resetForm();
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setTaskTitle(task.title);
    setTaskDetail(task.detail);
    setTab('Tasks');
  };

  const deleteTask = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTasks((previous) =>
              previous.filter((task) => task.id !== id)
            );

            if (editingId === id) {
              resetForm();
            }
          },
        },
      ]
    );
  };

  const toggleTask = (id: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const changeTab = (nextTab: Tab) => {
    setTab(nextTab);
    setSelectedCourse(null);
  };

  const renderCourse = (course: typeof courses[number]) => (
    <Pressable
      key={course.code}
      onPress={() => {
        setSelectedCourse(course.code);
        setTab('Courses');
      }}
    >
      <ThemedView
        variant="surface"
        style={styles.courseCard}
      >
        <ThemedView
          style={[
            styles.courseIcon,
            { backgroundColor: course.color },
          ]}
        >
          <ThemedText style={styles.courseEmoji}>
            {course.icon}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.courseInfo}>
          <ThemedText style={styles.courseCode}>
            {course.code}
          </ThemedText>
          <ThemedText style={styles.courseTitle}>
            {course.title}
          </ThemedText>
          <ThemedText type="muted">
            {course.progress}
          </ThemedText>
        </ThemedView>

        <ThemedText style={styles.chevron}>
          ›
        </ThemedText>
      </ThemedView>
    </Pressable>
  );

  const renderTask = (task: Task) => (
    <ThemedView
      key={task.id}
      variant="surface"
      style={styles.taskCard}
    >
      <Pressable
        onPress={() => toggleTask(task.id)}
        style={[
          styles.checkCircle,
          task.completed && styles.checked,
        ]}
      >
        <ThemedText style={styles.checkText}>
          {task.completed ? '✓' : ''}
        </ThemedText>
      </Pressable>

      <ThemedView style={styles.taskInfo}>
        <ThemedText
          style={[
            styles.taskTitle,
            task.completed && styles.strike,
          ]}
        >
          {task.title}
        </ThemedText>

        <ThemedText type="muted">
          {task.detail || 'No description'}
        </ThemedText>

        <ThemedText
          style={
            task.completed
              ? styles.completedText
              : styles.pendingText
          }
        >
          {task.completed ? 'Completed' : 'Pending'}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.taskActions}>
        <Pressable
          onPress={() => startEditing(task)}
          style={styles.editButton}
        >
          <ThemedText style={styles.editText}>
            Edit
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => deleteTask(task.id)}
          style={styles.deleteButton}
        >
          <ThemedText style={styles.deleteText}>
            Delete
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BG}
      />
      <ExpoStatusBar style="dark" />

      <ThemedView style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.topRow}>
            <ThemedView style={styles.brandMark}>
              <ThemedText style={styles.brandMarkText}>
                S
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.brandCopy}>
              <ThemedText type="subtitle">
                Student Hub
              </ThemedText>
              <ThemedText type="muted">
                LEARN · PLAN · ACHIEVE
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                MN
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {!storageReady && (
            <ActivityIndicator
              size="large"
              color={BLUE}
            />
          )}

          {storageReady && tab === 'Home' && (
            <>
              <ThemedView style={styles.hero}>
                <ThemedText style={styles.eyebrow}>
                  STUDENT DASHBOARD
                </ThemedText>

                <ThemedText style={styles.heroTitle}>
                  Hello, Maryam! 👋
                </ThemedText>

                <ThemedText style={styles.heroSub}>
                  Ready to make today count?
                </ThemedText>

                <ThemedView style={styles.heroBottom}>
                  <ThemedView style={styles.transparent}>
                    <ThemedText style={styles.heroNumber}>
                      03
                    </ThemedText>
                    <ThemedText style={styles.heroLabel}>
                      Courses
                    </ThemedText>
                  </ThemedView>

                  <ThemedView style={styles.heroDivider} />

                  <ThemedView style={styles.transparent}>
                    <ThemedText style={styles.heroNumber}>
                      {String(pendingCount).padStart(2, '0')}
                    </ThemedText>
                    <ThemedText style={styles.heroLabel}>
                      Open Tasks
                    </ThemedText>
                  </ThemedView>

                  <ThemedView style={styles.heroDivider} />

                  <ThemedView style={styles.transparent}>
                    <ThemedText style={styles.heroNumber}>
                      {tasks.length === 0
                        ? 0
                        : Math.round(
                            (completedCount / tasks.length) * 100
                          )}
                      %
                    </ThemedText>
                    <ThemedText style={styles.heroLabel}>
                      Progress
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.sectionHeading}>
                <ThemedText type="subtitle">
                  My Courses
                </ThemedText>

                <Pressable
                  onPress={() => changeTab('Courses')}
                >
                  <ThemedText style={styles.linkText}>
                    View all
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {courses.map(renderCourse)}

              <ThemedView style={styles.sectionHeading}>
                <ThemedText type="subtitle">
                  Upcoming Tasks
                </ThemedText>

                <Pressable
                  onPress={() => changeTab('Tasks')}
                >
                  <ThemedText style={styles.linkText}>
                    Manage Tasks
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {tasks.length === 0 ? (
                <ThemedText type="muted">
                  No tasks yet. Add one from My Tasks.
                </ThemedText>
              ) : (
                tasks.slice(0, 3).map(renderTask)
              )}

              <ThemedView style={styles.tip}>
                <ThemedText style={styles.tipIcon}>
                  ✦
                </ThemedText>

                <ThemedView style={styles.tipCopy}>
                  <ThemedText style={styles.tipTitle}>
                    A little progress adds up
                  </ThemedText>
                  <ThemedText style={styles.tipText}>
                    Complete one task at a time.
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </>
          )}

          {storageReady && tab === 'Courses' && (
            <>
              {!activeCourse ? (
                <>
                  <ThemedText
                    type="title"
                    style={styles.pageTitle}
                  >
                    My Courses
                  </ThemedText>

                  <ThemedText
                    type="muted"
                    style={styles.pageIntro}
                  >
                    Your learning, all in one place.
                  </ThemedText>

                  {courses.map(renderCourse)}
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => setSelectedCourse(null)}
                    style={styles.backButton}
                  >
                    <ThemedText style={styles.linkText}>
                      ← Back to Courses
                    </ThemedText>
                  </Pressable>

                  <ThemedView style={styles.detailCard}>
                    <ThemedText style={styles.detailEmoji}>
                      {activeCourse.icon}
                    </ThemedText>

                    <ThemedText style={styles.detailTitle}>
                      {activeCourse.title}
                    </ThemedText>

                    <ThemedText style={styles.detailSub}>
                      {activeCourse.progress} available
                    </ThemedText>
                  </ThemedView>

                  <ThemedText
                    type="subtitle"
                    style={styles.lessonHeading}
                  >
                    Course Lessons
                  </ThemedText>

                  {activeCourse.lessons.map((lesson, index) => (
                    <ThemedView
                      key={`${activeCourse.code}-${index}`}
                      variant="surface"
                      style={styles.lessonCard}
                    >
                      <View style={styles.lessonNumber}>
                        <ThemedText style={styles.lessonNumberText}>
                          {index + 1}
                        </ThemedText>
                      </View>

                      <ThemedView style={styles.lessonInfo}>
                        <ThemedText style={styles.lessonTitle}>
                          {lesson}
                        </ThemedText>
                        <ThemedText type="muted">
                          Lesson {index + 1}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  ))}
                </>
              )}
            </>
          )}

          {storageReady && tab === 'Tasks' && (
            <>
              <ThemedText
                type="title"
                style={styles.pageTitle}
              >
                My Tasks
              </ThemedText>

              <ThemedText
                type="muted"
                style={styles.pageIntro}
              >
                Create, edit, search and manage tasks.
              </ThemedText>

              <ThemedView
                variant="surface"
                style={styles.formCard}
              >
                <ThemedText style={styles.formHeading}>
                  {editingId ? 'Edit Task' : 'Add New Task'}
                </ThemedText>

                <TextInput
                  style={styles.input}
                  placeholder="Task title"
                  placeholderTextColor="#8894AD"
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Task description"
                  placeholderTextColor="#8894AD"
                  value={taskDetail}
                  onChangeText={setTaskDetail}
                />

                <Pressable
                  style={styles.primaryButton}
                  onPress={saveTask}
                >
                  <ThemedText style={styles.primaryButtonText}>
                    {editingId ? 'Update Task' : '+ Add Task'}
                  </ThemedText>
                </Pressable>

                {editingId !== null && (
                  <Pressable
                    onPress={resetForm}
                    style={styles.cancelButton}
                  >
                    <ThemedText style={styles.linkText}>
                      Cancel Editing
                    </ThemedText>
                  </Pressable>
                )}
              </ThemedView>

              <ThemedText
                type="subtitle"
                style={styles.listHeading}
              >
                Task List
              </ThemedText>

              <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                placeholderTextColor="#8894AD"
                value={search}
                onChangeText={setSearch}
              />

              <View style={styles.filterRow}>
                {(['All', 'Pending', 'Completed'] as const).map(
                  (option) => (
                    <Pressable
                      key={option}
                      onPress={() => setFilter(option)}
                      style={[
                        styles.filterButton,
                        filter === option &&
                          styles.activeFilterButton,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.filterText,
                          filter === option &&
                            styles.activeFilterText,
                        ]}
                      >
                        {option}
                      </ThemedText>
                    </Pressable>
                  )
                )}
              </View>

              <ThemedText
                type="muted"
                style={styles.resultsText}
              >
                Showing {filteredTasks.length} of {tasks.length} tasks
              </ThemedText>

              {filteredTasks.length === 0 ? (
                <ThemedView
                  variant="surface"
                  style={styles.emptyCard}
                >
                  <ThemedText type="muted">
                    No matching tasks found.
                  </ThemedText>
                </ThemedView>
              ) : (
                filteredTasks.map(renderTask)
              )}

              <ThemedView style={styles.progressCard}>
                <ThemedText style={styles.progressTitle}>
                  Task Completion
                </ThemedText>

                <ThemedText style={styles.progressNumber}>
                  {completedCount} / {tasks.length}
                </ThemedText>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          tasks.length === 0
                            ? 0
                            : (completedCount / tasks.length) * 100
                        }%`,
                      },
                    ]}
                  />
                </View>
              </ThemedView>
            </>
          )}

          {storageReady && tab === 'Profile' && (
            <>
              <ThemedText
                type="title"
                style={styles.pageTitle}
              >
                My Profile
              </ThemedText>

              <ThemedView style={styles.profileCard}>
                <ThemedView style={styles.profileAvatar}>
                  <ThemedText style={styles.profileInitials}>
                    MN
                  </ThemedText>
                </ThemedView>

                <ThemedText style={styles.profileName}>
                  Maryam Nasir
                </ThemedText>

                <ThemedText type="muted">
                  AI-09 · Student
                </ThemedText>
              </ThemedView>

              <ThemedView
                variant="surface"
                style={styles.profileRow}
              >
                <ThemedText>🎓 Program</ThemedText>
                <ThemedText type="muted">
                  Artificial Intelligence
                </ThemedText>
              </ThemedView>

              <ThemedView
                variant="surface"
                style={styles.profileRow}
              >
                <ThemedText>📚 Active Courses</ThemedText>
                <ThemedText type="muted">
                  3 Courses
                </ThemedText>
              </ThemedView>

              <ThemedView
                variant="surface"
                style={styles.profileRow}
              >
                <ThemedText>✅ Completed Tasks</ThemedText>
                <ThemedText type="muted">
                  {completedCount}
                </ThemedText>
              </ThemedView>

              <ThemedText
                type="subtitle"
                style={styles.apiHeading}
              >
                Live Learning Resources
              </ThemedText>

              <ThemedText
                type="muted"
                style={styles.apiDescription}
              >
                Data fetched using Axios GET from JSONPlaceholder.
              </ThemedText>

              {apiLoading && (
                <ActivityIndicator
                  size="large"
                  color={BLUE}
                  style={{ marginVertical: 24 }}
                />
              )}

              {!!apiError && !apiLoading && (
                <ThemedView
                  variant="surface"
                  style={styles.apiErrorCard}
                >
                  <ThemedText style={styles.errorText}>
                    {apiError}
                  </ThemedText>

                  <Pressable
                    style={styles.retryButton}
                    onPress={fetchApiData}
                  >
                    <ThemedText style={styles.primaryButtonText}>
                      Retry
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              )}

              {!apiLoading &&
                !apiError &&
                apiPosts.map((post) => (
                  <ThemedView
                    key={post.id}
                    variant="surface"
                    style={styles.apiCard}
                  >
                    <ThemedText style={styles.apiCardNumber}>
                      POST #{post.id}
                    </ThemedText>

                    <ThemedText style={styles.apiCardTitle}>
                      {post.title}
                    </ThemedText>

                    <ThemedText type="muted">
                      {post.body}
                    </ThemedText>
                  </ThemedView>
                ))}

              {!apiLoading && !apiError && (
                <Pressable
                  style={styles.refreshButton}
                  onPress={fetchApiData}
                >
                  <ThemedText style={styles.linkText}>
                    ↻ Refresh API Data
                  </ThemedText>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>

        <ThemedView style={styles.nav}>
          {(['Home', 'Courses', 'Tasks', 'Profile'] as const).map(
            (name, index) => (
              <Pressable
                key={name}
                onPress={() => changeTab(name)}
                style={styles.navItem}
              >
                <ThemedText
                  style={[
                    styles.navIcon,
                    tab === name && styles.navActive,
                  ]}
                >
                  {['⌂', '▤', '✓', '○'][index]}
                </ThemedText>

                <ThemedText
                  style={[
                    styles.navLabel,
                    tab === name && styles.navActive,
                  ]}
                >
                  {name}
                </ThemedText>
              </Pressable>
            )
          )}
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  page: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    backgroundColor: 'transparent',
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  brandCopy: {
    flex: 1,
    marginLeft: 11,
    backgroundColor: 'transparent',
    gap: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCE4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#354FD4',
    fontWeight: '800',
  },
  hero: {
    backgroundColor: BLUE,
    borderRadius: 25,
    padding: 22,
  },
  eyebrow: {
    color: '#D8DEFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 12,
  },
  heroSub: {
    color: '#E4E8FF',
    fontSize: 13,
    marginTop: 5,
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    backgroundColor: 'transparent',
  },
  heroNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroLabel: {
    color: '#D8DEFF',
    fontSize: 10,
    marginTop: 4,
  },
  heroDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#7E8DF2',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  linkText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
  },
  courseCard: {
    borderRadius: 17,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E7ECF7',
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseEmoji: {
    fontSize: 22,
  },
  courseInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 3,
    backgroundColor: 'transparent',
  },
  courseCode: {
    fontSize: 10,
    color: '#5268E8',
    fontWeight: '800',
    letterSpacing: 1,
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 25,
    color: '#8996B2',
    paddingHorizontal: 7,
  },
  taskCard: {
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E7ECF7',
  },
  checkCircle: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#B8C3DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 10,
    gap: 4,
    backgroundColor: 'transparent',
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  strike: {
    textDecorationLine: 'line-through',
    color: '#71809F',
  },
  completedText: {
    color: '#187B58',
    fontSize: 10,
    fontWeight: '700',
  },
  pendingText: {
    color: '#A96609',
    fontSize: 10,
    fontWeight: '700',
  },
  taskActions: {
    gap: 7,
    backgroundColor: 'transparent',
  },
  editButton: {
    backgroundColor: '#E7ECFF',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  editText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FFE9E9',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  deleteText: {
    color: '#C53C3C',
    fontSize: 11,
    fontWeight: '700',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#E9EDFF',
    borderRadius: 17,
    marginTop: 12,
  },
  tipIcon: {
    fontSize: 24,
    color: BLUE,
    marginRight: 11,
  },
  tipCopy: {
    flex: 1,
    backgroundColor: 'transparent',
    gap: 4,
  },
  tipTitle: {
    color: '#273B9E',
    fontSize: 12,
    fontWeight: '800',
  },
  tipText: {
    color: '#596AAE',
    fontSize: 11,
  },
  pageTitle: {
    marginTop: 18,
    color: NAVY,
  },
  pageIntro: {
    marginTop: 6,
    marginBottom: 22,
    color: '#71809F',
  },
  backButton: {
    marginTop: 20,
    marginBottom: 16,
  },
  detailCard: {
    padding: 24,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: 'center',
  },
  detailEmoji: {
    fontSize: 38,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  detailSub: {
    color: '#E4E8FF',
    marginTop: 8,
  },
  lessonHeading: {
    marginTop: 24,
    marginBottom: 14,
    color: NAVY,
  },
  lessonCard: {
    padding: 14,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lessonNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E7ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberText: {
    color: BLUE,
    fontWeight: '800',
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
    gap: 4,
  },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 22,
  },
  formHeading: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
    color: NAVY,
  },
  input: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#DCE4F4',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: NAVY,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 11,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  listHeading: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4F4',
    borderRadius: 11,
    padding: 13,
    marginBottom: 12,
    color: NAVY,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: '#E7ECF7',
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: BLUE,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#596AAE',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  resultsText: {
    marginBottom: 12,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: BLUE,
    marginTop: 10,
  },
  progressTrack: {
    height: 9,
    backgroundColor: '#E7ECFF',
    borderRadius: 10,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 10,
  },
  profileCard: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginBottom: 16,
    marginTop: 10,
  },
  profileAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#DCE4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: '#354FD4',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    marginTop: 14,
  },
  profileRow: {
    padding: 17,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apiHeading: {
    marginTop: 24,
    marginBottom: 7,
  },
  apiDescription: {
    marginBottom: 15,
  },
  apiCard: {
    padding: 16,
    borderRadius: 15,
    marginBottom: 10,
    gap: 8,
  },
  apiCardNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: BLUE,
  },
  apiCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  apiErrorCard: {
    padding: 18,
    borderRadius: 15,
  },
  errorText: {
    color: '#C53C3C',
    fontSize: 13,
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: BLUE,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  refreshButton: {
    alignItems: 'center',
    padding: 16,
  },
  nav: {
    height: 68,
    borderTopWidth: 1,
    borderTopColor: '#E5EAF5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 55,
  },
  navIcon: {
    fontSize: 21,
    color: '#96A1BA',
  },
  navLabel: {
    fontSize: 10,
    color: '#96A1BA',
  },
  navActive: {
    color: BLUE,
    fontWeight: '800',
  },
});
