// app/(tabs)/JournalScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { journalService } from '../../services/journalService';
import { JournalEntry, MoodType } from '../../types/journal';

// Define valid icon names for mood icons
type MoodIconName =
    | 'happy-outline'
    | 'sad-outline'
    | 'alert-circle-outline'
    | 'leaf-outline'
    | 'heart-outline'
    | 'eye-outline'
    | 'rocket-outline'
    | 'bed-outline'
    | 'flash-outline'
    | 'ellipse-outline';

// Define valid icon names for other icons used in this component
type JournalIconName =
    | MoodIconName
    | 'journal-outline'
    | 'add'
    | 'trash-outline';

export default function JournalScreen() {
    const theme = useTheme();
    const { user } = useAuth();

    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        if (!user) {
            console.log('No user found');
            return;
        }

        try {
            setLoading(true);
            console.log('Loading journal entries for user:', user.id);
            const data = await journalService.getEntries();
            console.log('Loaded entries:', data.length);
            setEntries(data);
        } catch (error) {
            console.error('Error loading entries:', error);
            Alert.alert('Error', 'Failed to load journal entries. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadEntries();
    };

    const openEditor = (entry?: JournalEntry) => {
        if (entry) {
            setEditingEntry(entry);
            setTitle(entry.title || '');
            setContent(entry.content);
            setSelectedMood((entry.mood as MoodType) || 'neutral');
        } else {
            setEditingEntry(null);
            setTitle('');
            setContent('');
            setSelectedMood('neutral');
        }
        setShowEditor(true);
    };

    const closeEditor = () => {
        setShowEditor(false);
        setEditingEntry(null);
        setTitle('');
        setContent('');
        setSelectedMood('neutral');
    };

    const saveEntry = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please write something in your journal entry');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'Please sign in to save journal entries');
            return;
        }

        setSaving(true);
        try {
            const entryData = {
                title: title.trim() || undefined,
                content: content.trim(),
                mood: selectedMood,
                tags: [], // Simple tags for now
            };

            console.log('Saving entry:', entryData);

            if (editingEntry) {
                await journalService.updateEntry(editingEntry.id, entryData);
                Alert.alert('Success', 'Journal entry updated successfully');
            } else {
                await journalService.createEntry(entryData);
                Alert.alert('Success', 'Journal entry saved successfully');
            }

            closeEditor();
            loadEntries(); // Refresh the list
        } catch (error: any) {
            console.error('Error saving entry:', error);

            // More specific error messages
            if (error.code === 'PGRST204') {
                Alert.alert(
                    'Database Error',
                    'The journal feature is not properly set up. Please contact support.'
                );
            } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
                Alert.alert('Network Error', 'Please check your internet connection and try again.');
            } else {
                Alert.alert('Error', 'Failed to save journal entry. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const deleteEntry = (entry: JournalEntry) => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this journal entry? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await journalService.deleteEntry(entry.id);
                            Alert.alert('Success', 'Journal entry deleted successfully');
                            loadEntries();
                        } catch (error) {
                            console.error('Error deleting entry:', error);
                            Alert.alert('Error', 'Failed to delete journal entry');
                        }
                    },
                },
            ]
        );
    };

    // FIXED: Properly typed mood icons
    const getMoodIcon = (mood: MoodType): MoodIconName => {
        const moodIcons: Record<MoodType, MoodIconName> = {
            happy: 'happy-outline',
            sad: 'sad-outline',
            anxious: 'alert-circle-outline',
            peaceful: 'leaf-outline',
            grateful: 'heart-outline',
            reflective: 'eye-outline',
            hopeful: 'rocket-outline',
            tired: 'bed-outline',
            excited: 'flash-outline',
            neutral: 'ellipse-outline',
        };
        return moodIcons[mood];
    };

    const getMoodColor = (mood: MoodType) => {
        const moodColors = {
            happy: '#10B981', // green
            sad: '#3B82F6',   // blue
            anxious: '#F59E0B', // amber
            peaceful: '#8B5CF6', // violet
            grateful: '#EC4899', // pink
            reflective: '#06B6D4', // cyan
            hopeful: '#84CC16', // lime
            tired: '#6B7280', // gray
            excited: '#DC2626', // red
            neutral: theme.colors.textSecondary,
        };
        return moodColors[mood];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Mood options for the selector
    const moodOptions: MoodType[] = [
        'happy', 'sad', 'anxious', 'peaceful', 'grateful',
        'reflective', 'hopeful', 'tired', 'excited', 'neutral'
    ];

    if (loading) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading your journal...
                </Text>
            </View>
        );
    }

    return (
        <View style={theme.screen}>
            {/* Header */}
            <View style={[theme.rowBetween, {
                paddingHorizontal: theme.Spacing.md,
                paddingVertical: theme.Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }]}>
                <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                }}>
                    My Journal
                </Text>
                <TouchableOpacity
                    onPress={() => openEditor()}
                    style={[theme.button, { flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }]}
                >
                    <Ionicons name="add" size={20} color={theme.colors.textInverse} />
                    <Text style={theme.buttonText}>New Entry</Text>
                </TouchableOpacity>
            </View>

            {/* Journal Entries List */}
            {entries.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.Spacing.xl }}>
                    <Ionicons name="journal-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginTop: theme.Spacing.lg,
                        textAlign: 'center',
                    }}>
                        No journal entries yet
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        marginTop: theme.Spacing.sm,
                        textAlign: 'center',
                        lineHeight: 20,
                    }}>
                        Start writing your thoughts and reflections.{'\n'}Your journal is private and secure.
                    </Text>
                    <TouchableOpacity
                        onPress={() => openEditor()}
                        style={[theme.button, { marginTop: theme.Spacing.lg }]}
                    >
                        <Text style={theme.buttonText}>Write Your First Entry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[theme.colors.accentPrimary]}
                            tintColor={theme.colors.accentPrimary}
                        />
                    }
                    contentContainerStyle={{ padding: theme.Spacing.md }}
                >
                    {entries.map((entry) => (
                        <TouchableOpacity
                            key={entry.id}
                            style={[theme.card, { marginBottom: theme.Spacing.md }]}
                            onPress={() => openEditor(entry)}
                            onLongPress={() => deleteEntry(entry)}
                        >
                            <View style={[theme.rowBetween, { marginBottom: theme.Spacing.sm }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                                    <Ionicons
                                        name={getMoodIcon((entry.mood as MoodType) || 'neutral')}
                                        size={16}
                                        color={getMoodColor((entry.mood as MoodType) || 'neutral')}
                                    />
                                    <Text style={{
                                        fontSize: 12,
                                        color: theme.colors.textSecondary,
                                        fontWeight: '500',
                                        textTransform: 'capitalize',
                                    }}>
                                        {(entry.mood as MoodType) || 'neutral'}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: theme.colors.textSecondary,
                                    }}>
                                        • {formatDate(entry.created_at)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => deleteEntry(entry)}
                                    style={{ padding: theme.Spacing.xs }}
                                >
                                    <Ionicons name="trash-outline" size={16} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {entry.title && (
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: '600',
                                    color: theme.colors.text,
                                    marginBottom: theme.Spacing.xs,
                                }}>
                                    {entry.title}
                                </Text>
                            )}

                            <Text
                                style={{
                                    fontSize: 14,
                                    color: theme.colors.text,
                                    lineHeight: 20,
                                }}
                                numberOfLines={3}
                            >
                                {entry.content}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Journal Editor Modal */}
            <Modal
                visible={showEditor}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeEditor}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {/* Editor Header */}
                    <View style={[theme.rowBetween, {
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                    }]}>
                        <TouchableOpacity onPress={closeEditor} disabled={saving}>
                            <Text style={{
                                color: saving ? theme.colors.textSecondary : theme.colors.text,
                                fontSize: 16
                            }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                            {editingEntry ? 'Edit Entry' : 'New Entry'}
                        </Text>

                        <TouchableOpacity onPress={saveEntry} disabled={saving || !content.trim()}>
                            {saving ? (
                                <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                            ) : (
                                <Text style={{
                                    color: content.trim() ? theme.colors.accentPrimary : theme.colors.textSecondary,
                                    fontSize: 16,
                                    fontWeight: '600'
                                }}>
                                    Save
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Editor Content */}
                    <ScrollView style={{ flex: 1, padding: theme.Spacing.md }}>
                        {/* Title Input */}
                        <TextInput
                            style={[{
                                backgroundColor: theme.colors.backgroundCard,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                borderRadius: theme.BorderRadius.md,
                                padding: theme.Spacing.md,
                                fontSize: 16,
                                color: theme.colors.text,
                                marginBottom: theme.Spacing.lg,
                            }]}
                            placeholder="Title (optional)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Mood Selection */}
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            How are you feeling?
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginBottom: theme.Spacing.lg }}
                            contentContainerStyle={{ paddingRight: theme.Spacing.md }}
                        >
                            <View style={{ flexDirection: 'row', gap: theme.Spacing.sm }}>
                                {moodOptions.map((mood) => (
                                    <TouchableOpacity
                                        key={mood}
                                        onPress={() => setSelectedMood(mood)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: theme.Spacing.xs,
                                            paddingHorizontal: theme.Spacing.md,
                                            paddingVertical: theme.Spacing.sm,
                                            borderRadius: theme.BorderRadius.round,
                                            backgroundColor: selectedMood === mood
                                                ? getMoodColor(mood) + '20'
                                                : 'transparent',
                                            borderWidth: 1,
                                            borderColor: selectedMood === mood
                                                ? getMoodColor(mood)
                                                : theme.colors.border,
                                        }}
                                    >
                                        <Ionicons
                                            name={getMoodIcon(mood)}
                                            size={16}
                                            color={getMoodColor(mood)}
                                        />
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '500',
                                            color: getMoodColor(mood),
                                            textTransform: 'capitalize',
                                        }}>
                                            {mood}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Content Input */}
                        <TextInput
                            style={[{
                                backgroundColor: theme.colors.backgroundCard,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                borderRadius: theme.BorderRadius.md,
                                padding: theme.Spacing.md,
                                fontSize: 16,
                                color: theme.colors.text,
                                minHeight: 200,
                                textAlignVertical: 'top',
                            }]}
                            placeholder="Write your thoughts here... (required)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            numberOfLines={10}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}